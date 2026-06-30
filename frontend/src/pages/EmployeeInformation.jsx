import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ActionButton from '../components/ActionButton';
import PageHeader from '../components/PageHeader';
import { employeeInfoApi, identificationTypeApi } from '../services/api';

const toDateInput = (d) => d ? new Date(d).toISOString().slice(0, 10) : '';

// Toggle the Identity Documents section on the employee details page.
// Set to true to show it again.
const SHOW_IDENTITY_DOCUMENTS = false;

const emptyForm = {
    employeeCode: '',
    firstName: '', middleName: '', lastName: '', initials: '',
    arabicFirstName: '', arabicMiddleName: '', arabicLastName: '', searchName: '',
    gender: 'Male', jobTitle: '', status: 'Active',
    emergencyContactNo: '',
    department: '', designation: '', dateOfJoining: '',
    reportingManager: '', grade: '', employmentType: '',
    bankId: '', bankAccountNo: '', iban: '', branch: '', swiftCode: '', companyBank: '',
    currency: 'AED',
    jobNumber: '',
    resourceNo: '',
    administration: {
        employmentType: 'Employee',
        birthDate: '',
        probationDate: '',
        probationInMonths: 0,
        employmentDate: '',
        seniorityDate: '',
        terminationDate: '',
        noticePeriodInMonths: 0,
        religion: '',
        maritalStatus: '',
        sponsor: '',
        nationality: '',
        nationalityName: '',
        location: '',
        language: 'ENG',
        languageName: 'ENGLISH',
        address: '',
        address2: '',
        city: '',
        county: '',
        altAddressCode: '',
        altAddressStartDate: '',
        altAddressEndDate: '',
        email: '',
        oldEmployeeCode: ''
    },
    identityDocuments: {
        // Visa Details
        primaryVisaNumber: '', visaNumber: '', visaType: '', visaDesignation: '',
        visaIssueFrom: '', visaIssueDate: '', visaExpiryDate: '',
        // Passport Details
        primaryPassportNumber: '', passportNumber: '', passportIssueFrom: '',
        passportName: '', passportIssueDate: '', passportExpiryDate: '',
        // Residence Details
        primaryResidencyId: '', civilId: '', residencyNumber: '',
        residencyIssueDate: '', residencyExpiryDate: '', residencyPermitStatus: ''
    }
};

const calcAge = (birthDate) => {
    if (!birthDate) return null;
    const diff = Date.now() - new Date(birthDate).getTime();
    const ageDate = new Date(diff);
    return +(Math.abs(ageDate.getUTCFullYear() - 1970) + (ageDate.getUTCMonth() / 12)).toFixed(2);
};

function Row({ children }) {
    return <div className="emp-row">{children}</div>;
}

function Field({ label, name, value, onChange, type = 'text', readOnly = false, options }) {
    if (options) {
        return (
            <div className="emp-field-row">
                <label>{label}</label>
                <select name={name} value={value ?? ''} onChange={onChange} disabled={readOnly}>
                    {options.map((o) => {
                        const val = typeof o === 'object' ? o.value : o;
                        const lbl = typeof o === 'object' ? o.label : o;
                        return <option key={val} value={val}>{lbl}</option>;
                    })}
                </select>
            </div>
        );
    }
    return (
        <div className="emp-field-row">
            <label>{label}</label>
            <input type={type} name={name} value={value ?? ''} onChange={onChange} readOnly={readOnly} />
        </div>
    );
}

function EmployeeInformation() {
    const navigate = useNavigate();
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [idTypes, setIdTypes] = useState([]);

    const refresh = async () => {
        setLoading(true);
        setError(''); setSuccess('');
        try {
            const { data } = await employeeInfoApi.getMy();
            if (data.employeeInfo) {
                const info = data.employeeInfo;
                setForm({
                    ...emptyForm,
                    ...info,
                    dateOfJoining: toDateInput(info.dateOfJoining),
                    administration: {
                        ...emptyForm.administration,
                        ...(info.administration || {}),
                        birthDate: toDateInput(info.administration?.birthDate),
                        probationDate: toDateInput(info.administration?.probationDate),
                        employmentDate: toDateInput(info.administration?.employmentDate),
                        seniorityDate: toDateInput(info.administration?.seniorityDate),
                        terminationDate: toDateInput(info.administration?.terminationDate),
                        altAddressStartDate: toDateInput(info.administration?.altAddressStartDate),
                        altAddressEndDate: toDateInput(info.administration?.altAddressEndDate)
                    },
                    identityDocuments: {
                        ...emptyForm.identityDocuments,
                        ...(info.identityDocuments || {}),
                        visaIssueDate: toDateInput(info.identityDocuments?.visaIssueDate),
                        visaExpiryDate: toDateInput(info.identityDocuments?.visaExpiryDate),
                        passportIssueDate: toDateInput(info.identityDocuments?.passportIssueDate),
                        passportExpiryDate: toDateInput(info.identityDocuments?.passportExpiryDate),
                        residencyIssueDate: toDateInput(info.identityDocuments?.residencyIssueDate),
                        residencyExpiryDate: toDateInput(info.identityDocuments?.residencyExpiryDate)
                    }
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Could not load');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
        // Identification Types feed the Visa "Type" dropdown.
        identificationTypeApi.list()
            .then(({ data }) => setIdTypes(data.items || []))
            .catch(() => {});
    }, []);

    // Filter visible fields by label text matching the search query.
    useEffect(() => {
        const root = document.querySelector('.card');
        if (!root) return;
        const q = searchQuery.trim().toLowerCase();
        const rows = root.querySelectorAll('.emp-field-row');
        rows.forEach((row) => {
            const lbl = row.querySelector('label')?.textContent?.toLowerCase() || '';
            row.style.display = !q || lbl.includes(q) ? '' : 'none';
        });
    }, [searchQuery]);

    const onChange = (e) => {
        const { name, value, type, checked } = e.target;
        const next = type === 'checkbox' ? checked : type === 'number' ? Number(value) : value;
        setForm({ ...form, [name]: next });
        setSuccess('');
    };

    const onAdministrationChange = (e) => {
        const { name, value, type } = e.target;
        const next = type === 'number' ? Number(value) : value;
        setForm({ ...form, administration: { ...form.administration, [name]: next } });
        setSuccess('');
    };

    const onIdentityChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, identityDocuments: { ...form.identityDocuments, [name]: value } });
        setSuccess('');
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setSaving(true);
        try {
            const { data } = await employeeInfoApi.save(form);
            setSuccess(data.message || 'Saved');
        } catch (err) {
            setError(err.response?.data?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    // Visa "Type" dropdown options, sourced from the Identification Types master.
    const typeOptions = [
        { value: '', label: '-- Select --' },
        ...idTypes.map((t) => ({
            value: t.identificationTypeCode,
            label: t.description || t.identificationType || t.identificationTypeCode
        }))
    ];

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName="Employee Information" />
                <div className="card">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', marginBottom: 12, gap: 10 }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <input
                                type="text"
                                placeholder="🔍 Search fields..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ padding: '6px 10px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, width: 160 }}
                            />
                            <ActionButton kind="back" onClick={() => navigate(-1)}>Back</ActionButton>
                            <ActionButton kind="refresh" onClick={refresh}>Refresh</ActionButton>
                        </div>
                        <h2 style={{ margin: 0 }}>EMPLOYEE INFORMATION</h2>
                    </div>
                    {error && <div className="error">{error}</div>}
                    {success && <div className="success">{success}</div>}
                    {loading && <p>Loading…</p>}

                    <form onSubmit={onSubmit}>
                        <div className="form-section-title">PERSONAL INFORMATION</div>
                        <div className="emp-grid">
                            <div className="emp-col">
                                <Field label="Employee Code" name="employeeCode" value={form.employeeCode} onChange={onChange} />
                                <Field label="First Name" name="firstName" value={form.firstName} onChange={onChange} />
                                <Field label="Middle Name" name="middleName" value={form.middleName} onChange={onChange} />
                                <Field label="Last Name" name="lastName" value={form.lastName} onChange={onChange} />
                                <Field label="Gender" name="gender" value={form.gender} onChange={onChange} options={['Male','Female','Other']} />
                                <Field label="Job Title" name="jobTitle" value={form.jobTitle} onChange={onChange} />
                            </div>
                            <div className="emp-col">
                                <Field label="Initials" name="initials" value={form.initials} onChange={onChange} />
                                <Field label="Arabic First Name" name="arabicFirstName" value={form.arabicFirstName} onChange={onChange} />
                                <Field label="Arabic Middle Name" name="arabicMiddleName" value={form.arabicMiddleName} onChange={onChange} />
                                <Field label="Arabic Last Name" name="arabicLastName" value={form.arabicLastName} onChange={onChange} />
                                <Field label="Search Name" name="searchName" value={form.searchName} onChange={onChange} />
                                <Field label="Status" name="status" value={form.status} onChange={onChange} options={['Active','Inactive','Suspended']} />
                                <Field label="Emergency Contact No." name="emergencyContactNo" value={form.emergencyContactNo} onChange={onChange} />
                            </div>
                        </div>

                        <div className="form-section-title" style={{ marginTop: 24 }}>EMPLOYMENT INFORMATION</div>
                        <div className="emp-grid">
                            <div className="emp-col">
                                <Field label="Department" name="department" value={form.department} onChange={onChange} />
                                <Field label="Designation" name="designation" value={form.designation} onChange={onChange} />
                                <Field label="Date of Joining" name="dateOfJoining" value={form.dateOfJoining} onChange={onChange} type="date" />
                            </div>
                            <div className="emp-col">
                                <Field label="Reporting Manager" name="reportingManager" value={form.reportingManager} onChange={onChange} />
                                <Field label="Grade" name="grade" value={form.grade} onChange={onChange} />
                                <Field label="Employment Type" name="employmentType" value={form.employmentType} onChange={onChange} />
                            </div>
                        </div>

                        <div className="form-section-title" style={{ marginTop: 24 }}>BANK INFORMATION</div>
                        <div className="emp-grid">
                            <div className="emp-col">
                                <Field label="Bank ID" name="bankId" value={form.bankId} onChange={onChange} />
                                <Field label="Bank Account No." name="bankAccountNo" value={form.bankAccountNo} onChange={onChange} />
                                <Field label="IBAN" name="iban" value={form.iban} onChange={onChange} />
                            </div>
                            <div className="emp-col">
                                <Field label="Branch" name="branch" value={form.branch} onChange={onChange} />
                                <Field label="SWIFT Code" name="swiftCode" value={form.swiftCode} onChange={onChange} />
                                <Field label="Company Bank" name="companyBank" value={form.companyBank} onChange={onChange} />
                            </div>
                        </div>

                        <div className="form-section-title" style={{ marginTop: 24 }}>ANNUAL LEAVE</div>
                        <div className="emp-grid">
                            <div className="emp-col">
                                <Field label="Currency" name="currency" value={form.currency} onChange={onChange} options={['AED','USD','INR','EUR','GBP']} />
                            </div>
                            <div className="emp-col">
                                <Field label="Job Number" name="jobNumber" value={form.jobNumber} onChange={onChange} />
                            </div>
                        </div>

                        <div className="form-section-title" style={{ marginTop: 24 }}>EMPLOYEE MAPPING</div>
                        <div className="emp-grid">
                            <div className="emp-col">
                                <Field label="Resource No." name="resourceNo" value={form.resourceNo} onChange={onChange} />
                            </div>
                            <div className="emp-col"></div>
                        </div>

                        <div className="form-section-title" style={{ marginTop: 24 }}>ADMINISTRATION</div>
                        <div className="emp-grid">
                            <div className="emp-col">
                                <Field label="Employment Type" name="employmentType" value={form.administration.employmentType} onChange={onAdministrationChange} options={['Employee','Contract','Consultant','Trainee','Intern']} />
                                <Field label="Birth Date" name="birthDate" value={form.administration.birthDate} onChange={onAdministrationChange} type="date" />
                                <Field label="Age (calculated)" name="age" value={calcAge(form.administration.birthDate) ?? ''} onChange={() => {}} readOnly />
                                <Field label="Probation Date" name="probationDate" value={form.administration.probationDate} onChange={onAdministrationChange} type="date" />
                                <Field label="Probation in (Months)" name="probationInMonths" value={form.administration.probationInMonths} onChange={onAdministrationChange} type="number" />
                                <Field label="Employment Date" name="employmentDate" value={form.administration.employmentDate} onChange={onAdministrationChange} type="date" />
                                <Field label="Seniority Date" name="seniorityDate" value={form.administration.seniorityDate} onChange={onAdministrationChange} type="date" />
                                <Field label="Termination Date" name="terminationDate" value={form.administration.terminationDate} onChange={onAdministrationChange} type="date" />
                                <Field label="Notice Period in (Months)" name="noticePeriodInMonths" value={form.administration.noticePeriodInMonths} onChange={onAdministrationChange} type="number" />
                                <Field label="Religion" name="religion" value={form.administration.religion} onChange={onAdministrationChange} />
                                <Field label="Marital Status" name="maritalStatus" value={form.administration.maritalStatus} onChange={onAdministrationChange} options={['','Single','Married','Divorced','Widowed']} />
                                <Field label="Sponsor" name="sponsor" value={form.administration.sponsor} onChange={onAdministrationChange} />
                                <Field label="Nationality (code)" name="nationality" value={form.administration.nationality} onChange={onAdministrationChange} />
                                <Field label="Nationality (name)" name="nationalityName" value={form.administration.nationalityName} onChange={onAdministrationChange} />
                                <Field label="Location" name="location" value={form.administration.location} onChange={onAdministrationChange} />
                                <Field label="Language (code)" name="language" value={form.administration.language} onChange={onAdministrationChange} />
                                <Field label="Language (name)" name="languageName" value={form.administration.languageName} onChange={onAdministrationChange} />
                            </div>
                            <div className="emp-col">
                                <Field label="Address" name="address" value={form.administration.address} onChange={onAdministrationChange} />
                                <Field label="Address 2" name="address2" value={form.administration.address2} onChange={onAdministrationChange} />
                                <Field label="City" name="city" value={form.administration.city} onChange={onAdministrationChange} />
                                <Field label="County" name="county" value={form.administration.county} onChange={onAdministrationChange} />
                                <Field label="Alt. Address Code" name="altAddressCode" value={form.administration.altAddressCode} onChange={onAdministrationChange} />
                                <Field label="Alt. Address Start Date" name="altAddressStartDate" value={form.administration.altAddressStartDate} onChange={onAdministrationChange} type="date" />
                                <Field label="Alt. Address End Date" name="altAddressEndDate" value={form.administration.altAddressEndDate} onChange={onAdministrationChange} type="date" />
                                <Field label="Email" name="email" value={form.administration.email} onChange={onAdministrationChange} type="email" />
                                <Field label="Old Employee Code" name="oldEmployeeCode" value={form.administration.oldEmployeeCode} onChange={onAdministrationChange} />
                            </div>
                        </div>

                        {/* Identity Documents — styled to match the BC "Identity Documents" card */}
                        {SHOW_IDENTITY_DOCUMENTS && (
                        <div className="id-docs-card" style={{ marginTop: 28, border: '1px solid #e5e7eb', borderRadius: 6, padding: '16px 20px', background: '#fff' }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', paddingBottom: 8, borderBottom: '1px solid #d1d5db', marginBottom: 16 }}>
                                Identity Documents
                            </div>
                            <div className="id-docs-grid">
                                <div className="emp-col" style={{ paddingRight: 24 }}>
                                    <div style={{ fontWeight: 700, color: '#111827', marginBottom: 12 }}>Visa Details</div>
                                    <Field label="Primary Visa Number" name="primaryVisaNumber" value={form.identityDocuments.primaryVisaNumber} onChange={onIdentityChange} />
                                    <Field label="Number" name="visaNumber" value={form.identityDocuments.visaNumber} onChange={onIdentityChange} />
                                    <Field label="Type" name="visaType" value={form.identityDocuments.visaType} onChange={onIdentityChange} options={typeOptions} />
                                    <Field label="Designation" name="visaDesignation" value={form.identityDocuments.visaDesignation} onChange={onIdentityChange} />
                                    <Field label="Issue From" name="visaIssueFrom" value={form.identityDocuments.visaIssueFrom} onChange={onIdentityChange} />
                                    <Field label="Issue Date" name="visaIssueDate" value={form.identityDocuments.visaIssueDate} onChange={onIdentityChange} type="date" />
                                    <Field label="Expiry Date" name="visaExpiryDate" value={form.identityDocuments.visaExpiryDate} onChange={onIdentityChange} type="date" />
                                </div>
                                <div className="emp-col" style={{ padding: '0 24px', borderLeft: '1px solid #e5e7eb' }}>
                                    <div style={{ fontWeight: 700, color: '#111827', marginBottom: 12 }}>Passport Details</div>
                                    <Field label="Primary Passport Number" name="primaryPassportNumber" value={form.identityDocuments.primaryPassportNumber} onChange={onIdentityChange} />
                                    <Field label="Number" name="passportNumber" value={form.identityDocuments.passportNumber} onChange={onIdentityChange} />
                                    <Field label="Issue From" name="passportIssueFrom" value={form.identityDocuments.passportIssueFrom} onChange={onIdentityChange} />
                                    <Field label="Passport Name" name="passportName" value={form.identityDocuments.passportName} onChange={onIdentityChange} />
                                    <Field label="Issue Date" name="passportIssueDate" value={form.identityDocuments.passportIssueDate} onChange={onIdentityChange} type="date" />
                                    <Field label="Expiry Date" name="passportExpiryDate" value={form.identityDocuments.passportExpiryDate} onChange={onIdentityChange} type="date" />
                                </div>
                                <div className="emp-col" style={{ paddingLeft: 24, borderLeft: '1px solid #e5e7eb' }}>
                                    <div style={{ fontWeight: 700, color: '#111827', marginBottom: 12 }}>Residence Details</div>
                                    <Field label="Primary Residency ID" name="primaryResidencyId" value={form.identityDocuments.primaryResidencyId} onChange={onIdentityChange} />
                                    <Field label="Civil ID" name="civilId" value={form.identityDocuments.civilId} onChange={onIdentityChange} />
                                    <Field label="Number" name="residencyNumber" value={form.identityDocuments.residencyNumber} onChange={onIdentityChange} />
                                    <Field label="Issue Date" name="residencyIssueDate" value={form.identityDocuments.residencyIssueDate} onChange={onIdentityChange} type="date" />
                                    <Field label="Expiry Date" name="residencyExpiryDate" value={form.identityDocuments.residencyExpiryDate} onChange={onIdentityChange} type="date" />
                                    <Field label="Permit Status" name="residencyPermitStatus" value={form.identityDocuments.residencyPermitStatus} onChange={onIdentityChange} options={['', 'Current', 'Expired', 'Cancelled', 'Under Process']} />
                                </div>
                            </div>
                        </div>
                        )}

                        <button type="submit" className="btn" disabled={saving} style={{ marginTop: 20 }}>
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default EmployeeInformation;
