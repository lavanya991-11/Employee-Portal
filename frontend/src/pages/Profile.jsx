import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { authApi } from '../services/api';

const toDateInput = (d) => d ? new Date(d).toISOString().slice(0, 10) : '';

function Profile() {
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const [form, setForm] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const refresh = async () => {
        setLoading(true);
        try {
            const { data } = await authApi.me();
            const fresh = data.user || data;
            setUser(fresh);
            localStorage.setItem('user', JSON.stringify(fresh));
            setForm({
                businessEntity: fresh.businessEntity || '',
                employeeType: fresh.employeeType || '',
                dateOfBirth: toDateInput(fresh.dateOfBirth),
                dateOfJoining: toDateInput(fresh.dateOfJoining),
                confirmationDate: toDateInput(fresh.confirmationDate),
                reportingManager: fresh.reportingManager || '',
                grade: fresh.grade || '',
                contactNo: fresh.contactNo || '',
                service: fresh.service || '',
                nextShift: fresh.nextShift || '',
                designation: fresh.designation || '',
                department: fresh.department || '',
                role: fresh.role || 'employee'
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Could not load profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { refresh(); }, []);

    const onChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setSuccess('');
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setSaving(true);
        try {
            const { data } = await authApi.updateProfile(form);
            const updated = data.user || { ...user, ...form };
            setUser(updated);
            localStorage.setItem('user', JSON.stringify(updated));
            setSuccess('Profile updated successfully');
        } catch (err) {
            setError(err.response?.data?.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="card">
                    <h2>My Profile</h2>
                    {error && <div className="error">{error}</div>}
                    {success && <div className="success">{success}</div>}
                    {loading && <p style={{ color: '#666' }}>Loading…</p>}

                    <form onSubmit={onSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 20px' }}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input value={user.name || ''} disabled />
                            </div>
                            <div className="form-group">
                                <label>Employee ID</label>
                                <input value={user.empId || ''} disabled />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input value={user.email || ''} disabled />
                            </div>

                            <div className="form-group">
                                <label>Business Entity</label>
                                <input name="businessEntity" value={form.businessEntity || ''} onChange={onChange} />
                            </div>
                            <div className="form-group">
                                <label>Employee Type</label>
                                <input name="employeeType" value={form.employeeType || ''} onChange={onChange} />
                            </div>
                            <div className="form-group">
                                <label>Date of Birth</label>
                                <input type="date" name="dateOfBirth" value={form.dateOfBirth || ''} onChange={onChange} />
                            </div>
                            <div className="form-group">
                                <label>Date of Joining</label>
                                <input type="date" name="dateOfJoining" value={form.dateOfJoining || ''} onChange={onChange} />
                            </div>
                            <div className="form-group">
                                <label>Confirmation Date</label>
                                <input type="date" name="confirmationDate" value={form.confirmationDate || ''} onChange={onChange} />
                            </div>
                            <div className="form-group">
                                <label>Reporting Manager</label>
                                <input name="reportingManager" value={form.reportingManager || ''} onChange={onChange} />
                            </div>
                            <div className="form-group">
                                <label>Grade</label>
                                <input name="grade" value={form.grade || ''} onChange={onChange} />
                            </div>
                            <div className="form-group">
                                <label>Contact No</label>
                                <input name="contactNo" value={form.contactNo || ''} onChange={onChange} />
                            </div>
                            <div className="form-group">
                                <label>Service</label>
                                <input name="service" value={form.service || ''} onChange={onChange} />
                            </div>
                            <div className="form-group">
                                <label>Next Shift</label>
                                <input name="nextShift" value={form.nextShift || ''} onChange={onChange} />
                            </div>
                            <div className="form-group">
                                <label>Department</label>
                                <input name="department" value={form.department || ''} onChange={onChange} />
                            </div>
                            <div className="form-group">
                                <label>Designation</label>
                                <input name="designation" value={form.designation || ''} onChange={onChange} />
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select name="role" value={form.role || 'employee'} onChange={onChange}>
                                    <option value="employee">Employee</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="btn" disabled={saving}>
                            {saving ? 'Updating…' : 'Update'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default Profile;
