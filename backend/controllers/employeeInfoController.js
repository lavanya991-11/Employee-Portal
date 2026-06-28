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
    const idd = info.identityDocuments || {};
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
        oldEmployeeCode: adm.oldEmployeeCode || '',

        // Identity Documents → BC employee entity (names match BC exactly)
        primaryVisaNumber: idd.primaryVisaNumber || '',
        visaNumber: idd.visaNumber || '',
        visaType: idd.visaType || '',
        visaDesignation: idd.visaDesignation || '',
        visaIssueFrom: idd.visaIssueFrom || '',
        visaIssueDate: ymd(idd.visaIssueDate),
        visaExpiryDate: ymd(idd.visaExpiryDate),
        primaryPassportNumber: idd.primaryPassportNumber || '',
        passportNumber: idd.passportNumber || '',
        passportIssueFrom: idd.passportIssueFrom || '',
        passportName: idd.passportName || '',
        passportIssueDate: ymd(idd.passportIssueDate),
        passportExpiryDate: ymd(idd.passportExpiryDate),
        primaryResidencyId: idd.primaryResidencyId || '',
        civilId: idd.civilId || '',
        residencyNumber: idd.residencyNumber || '',
        residencyIssueDate: ymd(idd.residencyIssueDate),
        residencyExpiryDate: ymd(idd.residencyExpiryDate),
        residencyPermitStatus: idd.residencyPermitStatus || ''
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

// PATCH /api/employee-info/my — update the PORTAL (local) employee record only.
// Unlike POST/PUT (saveMyInfo) this does NOT sync to Business Central; it just
// persists the changes to the portal's own database. Backs the
// "Update Portal Data" button.
exports.patchMyInfo = async (req, res) => {
    try {
        const data = { ...req.body };
        delete data.user;
        delete data._id;

        const existing = await EmployeeInfo.findOne({ user: req.user.id });

        // Upsert: if this user has no portal record yet, create one (needs
        // employeeCode); otherwise update the existing record.
        if (!existing) {
            if (!data.employeeCode) {
                return res.status(400).json({
                    success: false,
                    message: 'No portal record exists yet for this user. Include "employeeCode" to create one.'
                });
            }
            const codeExists = await EmployeeInfo.findOne({ employeeCode: data.employeeCode });
            if (codeExists) {
                return res.status(400).json({ success: false, message: 'Employee Code already in use by another user.' });
            }
            const created = await EmployeeInfo.create({ ...data, user: req.user.id });
            return res.status(201).json({ success: true, message: 'Portal data created', employeeInfo: created });
        }

        // The form submits complete `administration` / `identityDocuments`
        // objects, so a shallow assign updates the whole record cleanly.
        Object.assign(existing, data);
        await existing.save();

        res.json({ success: true, message: 'Portal data updated', employeeInfo: existing });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
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
