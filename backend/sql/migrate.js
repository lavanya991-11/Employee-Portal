/* =====================================================================
   Data migration: MongoDB  ->  SQL Server (ess_portal)
   Copies every document from each collection into the matching SQL table.

   - Users are migrated first, building a mongoId -> SQL id map; all other
     tables resolve their ObjectId references through that map.
   - Nested objects are flattened (address_*, admin_*, idDoc_* …).
   - Travel lines/attachments go into their child tables.
   - The script CLEARS the SQL tables first, so it can be re-run safely to
     produce a fresh, faithful copy (the tables were just created, so this is
     non-destructive to real data).

   Usage:  node sql/migrate.js
   ===================================================================== */
require('dotenv').config();
// Match config/db.js: use public DNS so the mongodb+srv SRV lookup resolves
// on networks that block the default resolver.
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
const mongoose = require('mongoose');
const { sql, getPool } = require('../config/mssql');

const User = require('../models/user');
const EmployeeInfo = require('../models/employeeInfo');
const Leave = require('../models/leave');
const Loan = require('../models/loan');
const LoanRequest = require('../models/loanRequest');
const Asset = require('../models/asset');
const Expense = require('../models/expense');
const TravelRequest = require('../models/travelRequest');
const Overtime = require('../models/overtime');
const Calendar = require('../models/calendar');
const CalendarPeriod = require('../models/calendarPeriod');
const FinElement = require('../models/finElement');
const IdentificationType = require('../models/identificationType');
const LoanProduct = require('../models/loanProduct');
const ImageRegister = require('../models/imageRegister');
const Setting = require('../models/setting');
const AmortizationTemp = require('../models/amortizationTemp');

// Cache of real column names per table, so stray document fields (schema drift)
// are silently dropped instead of breaking the insert.
const colCache = {};
async function tableColumns(pool, table) {
    if (!colCache[table]) {
        const r = await pool.request().input('t', `dbo.${table}`)
            .query('SELECT name FROM sys.columns WHERE object_id = OBJECT_ID(@t)');
        colCache[table] = new Set(r.recordset.map((x) => x.name.toLowerCase()));
    }
    return colCache[table];
}

// Insert one row and return the new identity id. Null/undefined values are
// omitted so the column DEFAULT applies (keeps NOT NULL columns valid);
// unknown columns are dropped.
async function insertRow(pool, table, row, typeHints = {}) {
    const validCols = await tableColumns(pool, table);
    const keys = Object.keys(row)
        .filter((k) => row[k] !== undefined && row[k] !== null && validCols.has(k.toLowerCase()));
    const req = pool.request();
    keys.forEach((k, i) => {
        const p = 'p' + i;
        if (typeHints[k]) req.input(p, typeHints[k], row[k]);
        else req.input(p, row[k]);
    });
    const cols = keys.map((k) => `[${k}]`).join(', ');
    const vals = keys.map((_, i) => '@p' + i).join(', ');
    const q = `INSERT INTO dbo.${table} (${cols}) OUTPUT INSERTED.id AS id VALUES (${vals})`;
    const r = await req.query(q);
    return r.recordset[0].id;
}

const DELETE_ORDER = [
    'TravelRequestLines', 'TravelRequestAttachments', 'TravelRequests',
    'Leaves', 'Loans', 'LoanRequests', 'Assets', 'Expenses', 'Overtimes',
    'AmortizationTemp', 'ImageRegister', 'EmployeeInfo', 'Users',
    'Calendars', 'CalendarPeriods', 'FinElements', 'IdentificationTypes',
    'LoanProducts', 'Settings'
];

async function main() {
    console.log('Connecting to MongoDB…');
    await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 20000 });
    console.log('MongoDB connected.');
    const pool = await getPool();

    // 1) Clear SQL tables (children first) so the migration is repeatable.
    for (const t of DELETE_ORDER) {
        try { await pool.request().query(`DELETE FROM dbo.${t}`); }
        catch (e) { console.error(`Clear ${t} failed: ${e.message}`); }
    }
    console.log('Cleared existing SQL rows.');

    const userMap = new Map(); // mongo _id -> SQL Users.id
    const uid = (ref) => (ref ? userMap.get(String(ref)) || null : null);
    const counts = {};
    const bump = (t, n = 1) => { counts[t] = (counts[t] || 0) + n; };

    /* ---------- Users (two passes for self-referencing manager) ---------- */
    const users = await User.find().lean();
    for (const u of users) {
        const row = {
            mongoId: String(u._id),
            name: u.name, email: u.email, password: u.password, empId: u.empId,
            department: u.department, designation: u.designation, dateOfJoining: u.dateOfJoining,
            address_street: u.address?.street, address_city: u.address?.city,
            address_state: u.address?.state, address_zip: u.address?.zip, address_country: u.address?.country,
            contactNumber: u.contactNumber,
            emergencyContact_name: u.emergencyContact?.name,
            emergencyContact_relationship: u.emergencyContact?.relationship,
            emergencyContact_phone: u.emergencyContact?.phone,
            bank_bankName: u.bankDetails?.bankName, bank_accountNumber: u.bankDetails?.accountNumber,
            bank_ifsc: u.bankDetails?.ifsc, bank_branch: u.bankDetails?.branch,
            profilePicture: u.profilePicture, businessEntity: u.businessEntity, employeeType: u.employeeType,
            dateOfBirth: u.dateOfBirth, confirmationDate: u.confirmationDate, grade: u.grade,
            service: u.service, nextShift: u.nextShift, reportingManager: u.reportingManager,
            role: u.role, refreshToken: u.refreshToken,
            isActive: u.isActive, createdAt: u.createdAt, updatedAt: u.updatedAt
        };
        try { userMap.set(String(u._id), await insertRow(pool, 'Users', row)); bump('Users'); }
        catch (e) { console.error(`User ${u.email} failed: ${e.message}`); }
    }
    for (const u of users) {
        if (u.manager && userMap.has(String(u._id)) && userMap.has(String(u.manager))) {
            await pool.request()
                .input('m', userMap.get(String(u.manager)))
                .input('id', userMap.get(String(u._id)))
                .query('UPDATE dbo.Users SET managerId = @m WHERE id = @id');
        }
    }

    /* ---------- EmployeeInfo ---------- */
    for (const e of await EmployeeInfo.find().lean()) {
        const a = e.administration || {}; const d = e.identityDocuments || {};
        const userId = uid(e.user);
        if (!userId) { console.error(`EmployeeInfo ${e.employeeCode}: user not found, skipped`); continue; }
        const row = {
            mongoId: String(e._id), userId, employeeCode: e.employeeCode,
            firstName: e.firstName, middleName: e.middleName, lastName: e.lastName, initials: e.initials,
            arabicFirstName: e.arabicFirstName, arabicMiddleName: e.arabicMiddleName, arabicLastName: e.arabicLastName,
            searchName: e.searchName, gender: e.gender, jobTitle: e.jobTitle, status: e.status,
            emergencyContactNo: e.emergencyContactNo, department: e.department, designation: e.designation,
            dateOfJoining: e.dateOfJoining, reportingManager: e.reportingManager, grade: e.grade,
            employmentType: e.employmentType, bankId: e.bankId, bankAccountNo: e.bankAccountNo, iban: e.iban,
            branch: e.branch, swiftCode: e.swiftCode, companyBank: e.companyBank, currency: e.currency,
            jobNumber: e.jobNumber, resourceNo: e.resourceNo,
            admin_employmentType: a.employmentType, admin_birthDate: a.birthDate, admin_probationDate: a.probationDate,
            admin_probationInMonths: a.probationInMonths, admin_employmentDate: a.employmentDate,
            admin_seniorityDate: a.seniorityDate, admin_terminationDate: a.terminationDate,
            admin_noticePeriodInMonths: a.noticePeriodInMonths, admin_religion: a.religion,
            admin_maritalStatus: a.maritalStatus, admin_sponsor: a.sponsor, admin_nationality: a.nationality,
            admin_nationalityName: a.nationalityName, admin_location: a.location, admin_language: a.language,
            admin_languageName: a.languageName, admin_address: a.address, admin_address2: a.address2,
            admin_city: a.city, admin_county: a.county, admin_altAddressCode: a.altAddressCode,
            admin_altAddressStartDate: a.altAddressStartDate, admin_altAddressEndDate: a.altAddressEndDate,
            admin_email: a.email, admin_oldEmployeeCode: a.oldEmployeeCode,
            idDoc_primaryVisaNumber: d.primaryVisaNumber, idDoc_visaNumber: d.visaNumber, idDoc_visaType: d.visaType,
            idDoc_visaDesignation: d.visaDesignation, idDoc_visaIssueFrom: d.visaIssueFrom,
            idDoc_visaIssueDate: d.visaIssueDate, idDoc_visaExpiryDate: d.visaExpiryDate,
            idDoc_primaryPassportNumber: d.primaryPassportNumber, idDoc_passportNumber: d.passportNumber,
            idDoc_passportIssueFrom: d.passportIssueFrom, idDoc_passportName: d.passportName,
            idDoc_passportIssueDate: d.passportIssueDate, idDoc_passportExpiryDate: d.passportExpiryDate,
            idDoc_primaryResidencyId: d.primaryResidencyId, idDoc_civilId: d.civilId,
            idDoc_residencyNumber: d.residencyNumber, idDoc_residencyIssueDate: d.residencyIssueDate,
            idDoc_residencyExpiryDate: d.residencyExpiryDate, idDoc_residencyPermitStatus: d.residencyPermitStatus,
            createdAt: e.createdAt, updatedAt: e.updatedAt
        };
        try { await insertRow(pool, 'EmployeeInfo', row); bump('EmployeeInfo'); }
        catch (err) { console.error(`EmployeeInfo ${e.employeeCode} failed: ${err.message}`); }
    }

    /* ---------- Helper for the employee/approver transactional tables ---------- */
    const migEmp = async (table, docs, mapFn) => {
        for (const x of docs) {
            const employeeId = uid(x.employee);
            if (!employeeId) { console.error(`${table}: employee not found, skipped`); continue; }
            const row = { mongoId: String(x._id), employeeId, createdAt: x.createdAt, updatedAt: x.updatedAt, ...mapFn(x) };
            try { await insertRow(pool, table, row); bump(table); }
            catch (e) { console.error(`${table} row failed: ${e.message}`); }
        }
    };

    await migEmp('Leaves', await Leave.find().lean(), (l) => ({
        leaveType: l.leaveType, leaveFinId: l.leaveFinId, leaveReferenceNumber: l.leaveReferenceNumber,
        payType: l.payType, fromDate: l.fromDate, toDate: l.toDate, totalDays: l.totalDays, reason: l.reason,
        status: l.status, approverRemarks: l.approverRemarks, approvedById: uid(l.approvedBy),
        approvedByName: l.approvedByName, approvedAt: l.approvedAt, isApproved: l.isApproved, isPosted: l.isPosted
    }));

    await migEmp('Loans', await Loan.find().lean(), (l) => ({
        loanType: l.loanType, amount: l.amount, reason: l.reason, status: l.status,
        approverRemarks: l.approverRemarks, approvedById: uid(l.approvedBy)
    }));

    await migEmp('LoanRequests', await LoanRequest.find().lean(), (l) => ({
        documentNo: l.documentNo, transactionNo: l.transactionNo, employeeCode: l.employeeCode,
        loanPayCode: l.loanPayCode, loanAmount: l.loanAmount, installmentCalculation: l.installmentCalculation,
        noOfInstallments: l.noOfInstallments, comments: l.comments, requestNo: l.requestNo,
        status: l.status, approvedBy: l.approvedBy, approvedDate: l.approvedDate
    }));

    await migEmp('Assets', await Asset.find().lean(), (x) => ({
        assetCode: x.assetCode, assetName: x.assetName, remarks: x.remarks, status: x.status,
        approverRemarks: x.approverRemarks, approvedById: uid(x.approvedBy)
    }));

    await migEmp('Expenses', await Expense.find().lean(), (x) => ({
        expenseType: x.expenseType, claimType: x.claimType, amount: x.amount, attachment: x.attachment,
        remarks: x.remarks, status: x.status, approverRemarks: x.approverRemarks, approvedById: uid(x.approvedBy)
    }));

    await migEmp('Overtimes', await Overtime.find().lean(), (x) => ({
        date: x.date, hoursRequested: x.hoursRequested, projectRef: x.projectRef, justification: x.justification,
        status: x.status, approverRemarks: x.approverRemarks, approvedById: uid(x.approvedBy)
    }));

    await migEmp('AmortizationTemp', await AmortizationTemp.find().lean(), (x) => ({
        employeeCode: x.employeeCode, transactionNo: x.transactionNo, finId: x.finId, totalAmount: x.totalAmount,
        paidAmount: x.paidAmount, remainingAmount: x.remainingAmount, serialNumber: x.serialNumber,
        payCodeDescription: x.payCodeDescription, dueDate: x.dueDate, deductionDate: x.deductionDate,
        amount: x.amount, isPaid: x.isPaid, isShifted: x.isShifted, isDisabled: x.isDisabled,
        loanEncashmentNo: x.loanEncashmentNo
    }));

    /* ---------- TravelRequests (+ child rows) ---------- */
    for (const t of await TravelRequest.find().lean()) {
        const employeeId = uid(t.employee);
        if (!employeeId) { console.error('TravelRequest: employee not found, skipped'); continue; }
        const row = {
            mongoId: String(t._id), employeeId, documentNo: t.documentNo, transactionNo: t.transactionNo,
            employeeCode: t.employeeCode, comments: t.comments, totalAmount: t.totalAmount,
            requestNo: t.requestNo, status: t.status, approvedBy: t.approvedBy, approvedDate: t.approvedDate,
            createdAt: t.createdAt, updatedAt: t.updatedAt
        };
        try {
            const trId = await insertRow(pool, 'TravelRequests', row);
            bump('TravelRequests');
            let ln = 0;
            for (const line of (t.lines || [])) {
                await insertRow(pool, 'TravelRequestLines', {
                    travelRequestId: trId, lineNo: ++ln, earningPayCode: line.earningPayCode,
                    earningPayCodeDesc: line.earningPayCodeDesc, amount: line.amount,
                    unitCount: line.unitCount, earningDate: line.earningDate
                });
                bump('TravelRequestLines');
            }
            for (const att of (t.attachments || [])) {
                await insertRow(pool, 'TravelRequestAttachments', {
                    travelRequestId: trId, fileName: att.fileName, mimeType: att.mimeType
                });
                bump('TravelRequestAttachments');
            }
        } catch (e) { console.error(`TravelRequest failed: ${e.message}`); }
    }

    /* ---------- ImageRegister (binary data) ---------- */
    for (const img of await ImageRegister.find().lean()) {
        const userId = uid(img.user);
        if (!userId) { console.error('ImageRegister: user not found, skipped'); continue; }
        const buf = img.data && img.data.buffer ? Buffer.from(img.data.buffer) : Buffer.from(img.data || []);
        try {
            await insertRow(pool, 'ImageRegister', {
                mongoId: String(img._id), userId, purpose: img.purpose, contentType: img.contentType,
                size: img.size, filename: img.filename, data: buf, createdAt: img.createdAt, updatedAt: img.updatedAt
            }, { data: sql.VarBinary(sql.MAX) });
            bump('ImageRegister');
        } catch (e) { console.error(`ImageRegister failed: ${e.message}`); }
    }

    /* ---------- Reference/master tables (no refs, fields map 1:1) ---------- */
    const migSimple = async (table, docs) => {
        for (const d of docs) {
            const row = { mongoId: String(d._id) };
            for (const [k, v] of Object.entries(d)) {
                if (k === '_id' || k === '__v') continue;
                row[k] = v;
            }
            try { await insertRow(pool, table, row); bump(table); }
            catch (e) { console.error(`${table} row failed: ${e.message}`); }
        }
    };
    await migSimple('Calendars', await Calendar.find().lean());
    await migSimple('CalendarPeriods', await CalendarPeriod.find().lean());
    await migSimple('FinElements', await FinElement.find().lean());
    await migSimple('IdentificationTypes', await IdentificationType.find().lean());
    await migSimple('LoanProducts', await LoanProduct.find().lean());
    await migSimple('Settings', await Setting.find().lean());

    console.log('\nMigration complete. Rows inserted:');
    Object.keys(counts).sort().forEach((t) => console.log(`  ${t.padEnd(26)} ${counts[t]}`));

    await mongoose.disconnect();
    await sql.close();
}

main().catch((e) => { console.error('Migration error:', e); process.exit(1); });
