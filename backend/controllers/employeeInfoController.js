const EmployeeInfo = require('../models/employeeInfo');
const { findEmployeeSystemId, updateEmployee, bcConfigured } = require('../services/bcClient');

// BC sentinel for "no date" — Business Central requires this instead of null/empty.
const NO_DATE = '0001-01-01';
const ymd = (d) => {
    if (!d) return NO_DATE;
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date.getTime())) return NO_DATE;
    return date.toISOString().slice(0, 10);
};

// Map our EmployeeInfo model → BC Novasoft employee PATCH body.
const toBcPayload = (info) => {
    const adm = info.administration || {};
    return {
        firstName: info.firstName || '',
        middleName: info.middleName || '',
        lastName: info.lastName || '',
        initials: info.initials || '',
        arabicFirstName: info.arabicFirstName || '',
        arabicMiddleName: info.arabicMiddleName || '',
        arabicLastName: info.arabicLastName || '',
        searchName: info.searchName || '',
        gender: info.gender || '',
        jobTitle: info.jobTitle || '',
        status: info.status || 'Active',
        emergencyContactNo: info.emergencyContactNo || '',
        department: info.department || '',
        designation: info.designation || '',
        dateOfJoining: ymd(info.dateOfJoining),
        managerNo: info.reportingManager || '',
        grade: info.grade || '',
        employmentTypeInfo: info.employmentType || '',
        bankId: info.bankId || '',
        bankAccountNo: info.bankAccountNo || '',
        iban: info.iban || '',
        branch: info.branch || '',
        swiftCode: info.swiftCode || '',
        companyBank: info.companyBank || '',
        currency: info.currency || 'AED',
        jobNumber: info.jobNumber || '',
        resourceNo: info.resourceNo || '',

        // Administration sub-object → flattened on BC side
        employmentType: adm.employmentType || '',
        birthDate: ymd(adm.birthDate),
        probationDate: ymd(adm.probationDate),
        probationInMonths: String(adm.probationInMonths ?? 0),
        employmentDate: ymd(adm.employmentDate),
        seniorityDate: ymd(adm.seniorityDate),
        terminationDate: ymd(adm.terminationDate),
        noticePeriodInMonths: Number(adm.noticePeriodInMonths ?? 0),
        religion: adm.religion || '',
        maritalStatus: adm.maritalStatus || '',
        sponsor: adm.sponsor || '',
        nationality: adm.nationality || '',
        nationalityName: adm.nationalityName || '',
        location: adm.location || '',
        language: adm.language || '',
        address: adm.address || '',
        address2: adm.address2 || '',
        city: adm.city || '',
        county: adm.county || '',
        altAddressCode: adm.altAddressCode || '',
        altAddressStartDate: ymd(adm.altAddressStartDate),
        altAddressEndDate: ymd(adm.altAddressEndDate),
        companyEmail: adm.email || '',
        oldEmployeeCode: adm.oldEmployeeCode || ''
    };
};

const syncToBc = async (info) => {
    if (!bcConfigured() || !info?.employeeCode) {
        return { systemId: null, patched: false, error: null };
    }
    try {
        const systemId = await findEmployeeSystemId(info.employeeCode);
        if (!systemId) {
            return { systemId: null, patched: false, error: 'No BC employee with that code.' };
        }
        await updateEmployee(systemId, toBcPayload(info));
        return { systemId, patched: true, error: null };
    } catch (err) {
        return { systemId: null, patched: false, error: err.message };
    }
};

exports.getMyInfo = async (req, res) => {
    try {
        const info = await EmployeeInfo.findOne({ user: req.user.id });
        res.json({ success: true, employeeInfo: info || null });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

exports.saveMyInfo = async (req, res) => {
    try {
        const data = { ...req.body };
        delete data.user;
        delete data._id;

        const existing = await EmployeeInfo.findOne({ user: req.user.id });

        if (existing) {
            Object.assign(existing, data);
            await existing.save();
            const bc = await syncToBc(existing);
            const bcMsg = bc.patched
                ? ` — BC updated (systemId: ${bc.systemId})`
                : bc.error ? ` — BC sync failed: ${bc.error}` : '';
            return res.json({
                success: true,
                message: 'Employee information updated' + bcMsg,
                employeeInfo: existing,
                bcSystemId: bc.systemId,
                bcPatched: bc.patched,
                bcError: bc.error
            });
        }

        if (!data.employeeCode) {
            return res.status(400).json({ success: false, message: "Employee Code is required" });
        }

        const codeExists = await EmployeeInfo.findOne({ employeeCode: data.employeeCode });
        if (codeExists) {
            return res.status(400).json({ success: false, message: "Employee Code already in use" });
        }

        const created = await EmployeeInfo.create({ ...data, user: req.user.id });
        const bc = await syncToBc(created);
        const bcMsg = bc.patched
            ? ` — BC updated (systemId: ${bc.systemId})`
            : bc.error ? ` — BC sync failed: ${bc.error}` : '';
        res.status(201).json({
            success: true,
            message: 'Employee information created' + bcMsg,
            employeeInfo: created,
            bcSystemId: bc.systemId,
            bcPatched: bc.patched,
            bcError: bc.error
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// PUT/POST /api/employee-info/identification
// Update an employee's identification-type / identity-document fields directly
// on the Business Central employee record, using the two-step flow:
//   1. GET the employee's systemId  (employees?$filter=employeeCode eq '<code>')
//   2. PATCH employees(systemId)     (update profile) with the supplied fields
//
// Body:
//   { "employeeCode": "1001", "fields": { "<bcField>": "<value>", ... } }
//   — or, for convenience, put the BC fields at the top level alongside
//     employeeCode: { "employeeCode": "1001", "identificationType": "PASSPORT" }
//
// The PATCH body is passed straight through to BC, so the keys must match the
// employee entity's actual identification property names.
exports.updateIdentification = async (req, res) => {
    try {
        if (!bcConfigured()) {
            return res.status(400).json({ success: false, message: 'BC not configured (set BC_* env vars on the backend).' });
        }

        const { employeeCode, fields, ...rest } = req.body || {};
        if (!employeeCode) {
            return res.status(400).json({ success: false, message: 'employeeCode is required' });
        }

        // Accept either a nested `fields` object or top-level BC properties.
        const payload = (fields && typeof fields === 'object' && !Array.isArray(fields)) ? fields : rest;
        if (!payload || Object.keys(payload).length === 0) {
            return res.status(400).json({ success: false, message: 'No identification fields supplied to update.' });
        }

        // Step 1 — look up the BC systemId for this employee code.
        const systemId = await findEmployeeSystemId(employeeCode);
        if (!systemId) {
            return res.status(404).json({ success: false, message: `No BC employee found with code '${employeeCode}'.` });
        }

        // Step 2 — PATCH the employee record (update profile) with the identification fields.
        const updated = await updateEmployee(systemId, payload);

        res.json({
            success: true,
            message: `Identification updated for employee ${employeeCode} (systemId: ${systemId}).`,
            employeeCode,
            systemId,
            updated
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Identification update failed', error: err.message });
    }
};

exports.getAllInfo = async (req, res) => {
    try {
        const list = await EmployeeInfo.find()
            .populate('user', 'name email role')
            .sort({ createdAt: -1 });
        res.json({ success: true, count: list.length, employees: list });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};
