import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { leaveApi } from '../services/api';

function ApplyLeave() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        leaveType: 'Paid',
        fromDate: '',
        toDate: '',
        reason: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await leaveApi.apply(form);
            navigate('/leaves/my');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to apply leave');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="card" style={{ maxWidth: 600 }}>
                    <h2>Apply for Leave</h2>
                    {error && <div className="error">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Leave Type</label>
                            <select name="leaveType" value={form.leaveType} onChange={handleChange}>
                                <option>Paid</option>
                                <option>Unpaid</option>
                                <option>Sick</option>
                                <option>Casual</option>
                                <option>Earned</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>From Date</label>
                            <input type="date" name="fromDate" value={form.fromDate} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>To Date</label>
                            <input type="date" name="toDate" value={form.toDate} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Reason</label>
                            <textarea name="reason" value={form.reason} onChange={handleChange} rows={4} required />
                        </div>
                        <button type="submit" className="btn" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default ApplyLeave;
