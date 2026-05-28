import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        // user account
        name: '',
        email: '',
        password: '',
        empId: '',
        department: '',
        designation: '',
        role: 'employee',
        // employee info
        employeeCode: '',
        firstName: '',
        lastName: '',
        gender: 'Male',
        jobTitle: '',
        dateOfJoining: '',
        // insurance details
        insuranceType: 'Health',
        insurancePolicyNumber: '',
        insuranceProvider: '',
        coverageAmount: 0,
        issueDate: '',
        expiryDate: '',
        insuranceStatus: 'Active',
        // administration
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
        }
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleAdminChange = (e) => {
        const { name, value, type } = e.target;
        const next = type === 'number' ? Number(value) : value;
        setForm({ ...form, administration: { ...form.administration, [name]: next } });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const tokenResponse = await authApi.getRegisterToken();
            const registerToken = tokenResponse.data.registerToken;

            const employeeInfo = {
                employeeCode: form.employeeCode,
                firstName: form.firstName,
                lastName: form.lastName,
                gender: form.gender,
                jobTitle: form.jobTitle || form.designation,
                department: form.department,
                designation: form.designation,
                insuranceDetails: {
                    insuranceType: form.insuranceType,
                    insurancePolicyNumber: form.insurancePolicyNumber,
                    insuranceProvider: form.insuranceProvider,
                    coverageAmount: Number(form.coverageAmount) || 0,
                    insuranceStatus: form.insuranceStatus
                }
            };
            if (form.dateOfJoining) employeeInfo.dateOfJoining = form.dateOfJoining;
            if (form.issueDate) employeeInfo.insuranceDetails.issueDate = form.issueDate;
            if (form.expiryDate) employeeInfo.insuranceDetails.expiryDate = form.expiryDate;

            const adm = form.administration;
            const administration = {
                employmentType: adm.employmentType,
                probationInMonths: Number(adm.probationInMonths) || 0,
                noticePeriodInMonths: Number(adm.noticePeriodInMonths) || 0,
                religion: adm.religion,
                maritalStatus: adm.maritalStatus,
                sponsor: adm.sponsor,
                nationality: adm.nationality,
                nationalityName: adm.nationalityName,
                location: adm.location,
                language: adm.language,
                languageName: adm.languageName,
                address: adm.address,
                address2: adm.address2,
                city: adm.city,
                county: adm.county,
                altAddressCode: adm.altAddressCode,
                email: adm.email,
                oldEmployeeCode: adm.oldEmployeeCode
            };
            ['birthDate', 'probationDate', 'employmentDate', 'seniorityDate', 'terminationDate', 'altAddressStartDate', 'altAddressEndDate']
                .forEach((d) => { if (adm[d]) administration[d] = adm[d]; });
            employeeInfo.administration = administration;

            const payload = {
                name: form.name,
                email: form.email,
                password: form.password,
                empId: form.empId,
                department: form.department,
                designation: form.designation,
                role: form.role,
                employeeInfo
            };

            await authApi.register(registerToken, payload);

            setSuccess('Registration successful! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>Register</h1>
                {error && <div className="error">{error}</div>}
                {success && <div className="success">{success}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-section-title">ACCOUNT</div>
                    <div className="form-group">
                        <label>Full Name *</label>
                        <input name="name" value={form.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Email *</label>
                        <input type="email" name="email" value={form.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Password *</label>
                        <input type="password" name="password" value={form.password} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Employee ID</label>
                        <input name="empId" value={form.empId} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Department</label>
                        <input name="department" value={form.department} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Designation</label>
                        <input name="designation" value={form.designation} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Role</label>
                        <select name="role" value={form.role} onChange={handleChange}>
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="form-section-title" style={{ marginTop: 16 }}>EMPLOYEE INFORMATION</div>
                    <div className="form-group">
                        <label>Employee Code *</label>
                        <input name="employeeCode" value={form.employeeCode} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>First Name</label>
                        <input name="firstName" value={form.firstName} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Last Name</label>
                        <input name="lastName" value={form.lastName} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Gender</label>
                        <select name="gender" value={form.gender} onChange={handleChange}>
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Job Title</label>
                        <input name="jobTitle" value={form.jobTitle} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Date of Joining</label>
                        <input type="date" name="dateOfJoining" value={form.dateOfJoining} onChange={handleChange} />
                    </div>

                    <div className="form-section-title" style={{ marginTop: 16 }}>INSURANCE DETAILS</div>
                    <div className="form-group">
                        <label>Insurance Type</label>
                        <select name="insuranceType" value={form.insuranceType} onChange={handleChange}>
                            <option>Health</option>
                            <option>Life</option>
                            <option>Vehicle</option>
                            <option>Travel</option>
                            <option>Property</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Insurance Policy Number</label>
                        <input name="insurancePolicyNumber" value={form.insurancePolicyNumber} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Insurance Provider</label>
                        <input name="insuranceProvider" value={form.insuranceProvider} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Coverage Amount</label>
                        <input type="number" name="coverageAmount" value={form.coverageAmount} onChange={handleChange} step="0.01" />
                    </div>
                    <div className="form-group">
                        <label>Issue Date</label>
                        <input type="date" name="issueDate" value={form.issueDate} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Expiry Date</label>
                        <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Insurance Status</label>
                        <select name="insuranceStatus" value={form.insuranceStatus} onChange={handleChange}>
                            <option>Active</option>
                            <option>Inactive</option>
                            <option>Expired</option>
                            <option>Cancelled</option>
                        </select>
                    </div>

                    <div className="form-section-title" style={{ marginTop: 16 }}>ADMINISTRATION</div>
                    <div className="form-group">
                        <label>Employment Type</label>
                        <select name="employmentType" value={form.administration.employmentType} onChange={handleAdminChange}>
                            <option>Employee</option>
                            <option>Contract</option>
                            <option>Consultant</option>
                            <option>Trainee</option>
                            <option>Intern</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Birth Date</label>
                        <input type="date" name="birthDate" value={form.administration.birthDate} onChange={handleAdminChange} />
                    </div>
                    <div className="form-group">
                        <label>Probation Date</label>
                        <input type="date" name="probationDate" value={form.administration.probationDate} onChange={handleAdminChange} />
                    </div>
                    <div className="form-group">
                        <label>Probation in (Months)</label>
                        <input type="number" name="probationInMonths" value={form.administration.probationInMonths} onChange={handleAdminChange} />
                    </div>
                    <div className="form-group">
                        <label>Employment Date</label>
                        <input type="date" name="employmentDate" value={form.administration.employmentDate} onChange={handleAdminChange} />
                    </div>
                    <div className="form-group">
                        <label>Seniority Date</label>
                        <input type="date" name="seniorityDate" value={form.administration.seniorityDate} onChange={handleAdminChange} />
                    </div>
                    <div className="form-group">
                        <label>Termination Date</label>
                        <input type="date" name="terminationDate" value={form.administration.terminationDate} onChange={handleAdminChange} />
                    </div>
                    <div className="form-group">
                        <label>Notice Period in (Months)</label>
                        <input type="number" name="noticePeriodInMonths" value={form.administration.noticePeriodInMonths} onChange={handleAdminChange} step="0.01" />
                    </div>
                    <div className="form-group">
                        <label>Religion</label>
                        <input name="religion" value={form.administration.religion} onChange={handleAdminChange} />
                    </div>
                    <div className="form-group">
                        <label>Marital Status</label>
                        <select name="maritalStatus" value={form.administration.maritalStatus} onChange={handleAdminChange}>
                            <option value="">—</option>
                            <option>Single</option>
                            <option>Married</option>
                            <option>Divorced</option>
                            <option>Widowed</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Sponsor</label>
                        <input name="sponsor" value={form.administration.sponsor} onChange={handleAdminChange} />
                    </div>
                    <div className="form-group">
                        <label>Nationality (code)</label>
                        <input name="nationality" value={form.administration.nationality} onChange={handleAdminChange} placeholder="JO" />
                    </div>
                    <div className="form-group">
                        <label>Nationality (name)</label>
                        <input name="nationalityName" value={form.administration.nationalityName} onChange={handleAdminChange} placeholder="Jordan" />
                    </div>
                    <div className="form-group">
                        <label>Location</label>
                        <input name="location" value={form.administration.location} onChange={handleAdminChange} />
                    </div>
                    <div className="form-group">
                        <label>Language (code)</label>
                        <input name="language" value={form.administration.language} onChange={handleAdminChange} placeholder="ENG" />
                    </div>
                    <div className="form-group">
                        <label>Language (name)</label>
                        <input name="languageName" value={form.administration.languageName} onChange={handleAdminChange} placeholder="ENGLISH" />
                    </div>

                    <div className="form-section-title" style={{ marginTop: 16 }}>ADDRESS</div>
                    <div className="form-group">
                        <label>Address</label>
                        <input name="address" value={form.administration.address} onChange={handleAdminChange} />
                    </div>
                    <div className="form-group">
                        <label>Address 2</label>
                        <input name="address2" value={form.administration.address2} onChange={handleAdminChange} />
                    </div>
                    <div className="form-group">
                        <label>City</label>
                        <input name="city" value={form.administration.city} onChange={handleAdminChange} />
                    </div>
                    <div className="form-group">
                        <label>County</label>
                        <input name="county" value={form.administration.county} onChange={handleAdminChange} />
                    </div>
                    <div className="form-group">
                        <label>Alt. Address Code</label>
                        <input name="altAddressCode" value={form.administration.altAddressCode} onChange={handleAdminChange} />
                    </div>
                    <div className="form-group">
                        <label>Alt. Address Start Date</label>
                        <input type="date" name="altAddressStartDate" value={form.administration.altAddressStartDate} onChange={handleAdminChange} />
                    </div>
                    <div className="form-group">
                        <label>Alt. Address End Date</label>
                        <input type="date" name="altAddressEndDate" value={form.administration.altAddressEndDate} onChange={handleAdminChange} />
                    </div>
                    <div className="form-group">
                        <label>Administration Email</label>
                        <input type="email" name="email" value={form.administration.email} onChange={handleAdminChange} />
                    </div>
                    <div className="form-group">
                        <label>Old Employee Code</label>
                        <input name="oldEmployeeCode" value={form.administration.oldEmployeeCode} onChange={handleAdminChange} />
                    </div>

                    <button type="submit" className="btn" disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                <div className="link">
                    Already have an account? <Link to="/login">Login</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;
