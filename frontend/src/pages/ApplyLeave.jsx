import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { leaveApi } from '../services/api';

const TYPE_LIMITS = {
    Sick: 21,
    Casual: 12,
    Paid: 18,
    Unpaid: 0,
    Earned: 15
};

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';

function ApplyLeave() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialType = searchParams.get('type') || 'Casual';

    const [form, setForm] = useState({
        leaveType: initialType,
        fromDate: '',
        toDate: '',
        session: 'Full Day',
        reason: '',
        attachment: '',
        docDate: today(),
        docSeries: '2',
        docNumber: 9
    });
    const [availed, setAvailed] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        leaveApi.myLeaves().then(({ data }) => {
            const used = (data.leaves || [])
                .filter((l) => l.leaveType === form.leaveType && l.status === 'Approved')
                .reduce((s, l) => s + (l.totalDays || 0), 0);
            setAvailed(used);
        }).catch(() => {});
    }, [form.leaveType]);

    const assigned = TYPE_LIMITS[form.leaveType] ?? 0;
    const available = Math.max(0, assigned - availed);

    const noOfDays = useMemo(() => {
        if (!form.fromDate || !form.toDate) return 0;
        const diff = new Date(form.toDate) - new Date(form.fromDate);
        if (diff < 0) return 0;
        const days = Math.floor(diff / 86400000) + 1;
        return form.session === 'Full Day' ? days : days * 0.5;
    }, [form.fromDate, form.toDate, form.session]);

    const balance = Math.max(0, available - noOfDays);

    const onChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError(''); setSuccess('');
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!form.fromDate || !form.toDate || !form.reason) {
            setError('Leave From Date, Leave To Date and Reasons are required.');
            return;
        }
        if (new Date(form.toDate) < new Date(form.fromDate)) {
            setError('LeaveToDate cannot be before LeaveFromDate.');
            return;
        }
        if (noOfDays > available) {
            setError(`Not enough balance. Available: ${available}, requested: ${noOfDays}.`);
            return;
        }
        setSaving(true);
        try {
            await leaveApi.apply({
                leaveType: form.leaveType,
                fromDate: form.fromDate,
                toDate: form.toDate,
                reason: form.reason
            });
            setSuccess('Leave application submitted.');
            setTimeout(() => navigate('/leaves/my'), 1200);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to apply leave');
        } finally {
            setSaving(false);
        }
    };

    const onNew = () => {
        setForm({
            leaveType: initialType, fromDate: '', toDate: '', session: 'Full Day',
            reason: '', attachment: '', docDate: today(), docSeries: '2', docNumber: 9
        });
        setError(''); setSuccess('');
    };

    const onDocSearch = () => {
        // placeholder: would look up a doc by series/number
        alert(`Searching for doc ${form.docSeries} / ${form.docNumber}`);
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">
                            Apply Leave <span className="erp-badge">Draft</span>
                        </div>
                        <div className="erp-titlebar-actions">
                            <button type="button" className="erp-action-btn" onClick={onNew}>📄 New</button>
                            <button type="button" className="erp-action-btn" onClick={onSubmit} disabled={saving}>
                                {saving ? 'Posting…' : '📤 Post'}
                            </button>
                            <button type="button" className="erp-action-btn" onClick={() => { onSubmit({ preventDefault: () => {} }); window.print(); }} disabled={saving}>
                                🖨️ Post & Print
                            </button>
                        </div>
                    </div>

                    <div className="erp-body">
                        <form className="erp-form" onSubmit={onSubmit}>
                            {error && <div className="error">{error}</div>}
                            {success && <div className="success">{success}</div>}

                            <div className="erp-section">
                                <div className="erp-section-header">Details</div>
                                <div className="erp-grid">
                                    <div className="erp-field">
                                        <label>Leave Types *</label>
                                        <select name="leaveType" value={form.leaveType} onChange={onChange}>
                                            <option>Sick</option>
                                            <option>Casual</option>
                                            <option>Paid</option>
                                            <option>Unpaid</option>
                                            <option>Earned</option>
                                        </select>
                                    </div>
                                    <div className="erp-field">
                                        <label>Assigned Leaves</label>
                                        <input value={assigned} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Available Leaves</label>
                                        <input value={available} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Leave From Date *</label>
                                        <input type="date" name="fromDate" value={form.fromDate} onChange={onChange} required />
                                    </div>
                                    <div className="erp-field">
                                        <label>Leave To Date *</label>
                                        <input type="date" name="toDate" value={form.toDate} onChange={onChange} required />
                                    </div>
                                    <div className="erp-field">
                                        <label>Session *</label>
                                        <select name="session" value={form.session} onChange={onChange}>
                                            <option>Full Day</option>
                                            <option>Half Day - Morning</option>
                                            <option>Half Day - Afternoon</option>
                                        </select>
                                    </div>
                                    <div className="erp-field">
                                        <label>No Of Days *</label>
                                        <input value={noOfDays} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Balance Leaves</label>
                                        <input value={balance} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field erp-field-wide">
                                        <label>Reasons *</label>
                                        <input name="reason" value={form.reason} onChange={onChange} required
                                            className={form.reason ? '' : 'erp-required'} />
                                    </div>
                                    <div className="erp-field erp-field-wide">
                                        <label>Leave Attach</label>
                                        <div className="erp-attach">
                                            <span className="erp-attach-actions">
                                                <a href="#" onClick={(e) => e.preventDefault()}>Upload</a>{' '}
                                                <a href="#" onClick={(e) => e.preventDefault()}>View</a>{' '}
                                                <a href="#" onClick={(e) => e.preventDefault()}>Delete</a>
                                            </span>
                                            <input name="attachment" value={form.attachment} onChange={onChange} placeholder="" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="erp-section">
                                <div className="erp-section-header">Primary Information</div>
                                <div className="erp-grid">
                                    <div className="erp-field">
                                        <label>Doc Date</label>
                                        <input type="date" name="docDate" value={form.docDate} onChange={onChange} />
                                    </div>
                                    <div className="erp-field">
                                        <label>Doc No</label>
                                        <div className="erp-docno">
                                            <select name="docSeries" value={form.docSeries} onChange={onChange} className="erp-docno-series">
                                                {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => (
                                                    <option key={n} value={String(n)}>{n}</option>
                                                ))}
                                            </select>
                                            <input type="number" name="docNumber" value={form.docNumber} onChange={onChange} className="erp-docno-num" min="1" />
                                            <button type="button" className="erp-docno-search" onClick={onDocSearch} title="Search">🔍</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        <aside className="erp-actions-panel">
                            <div className="erp-actions-header">Actions</div>
                            <ul className="erp-actions-list">
                                <li>🖨️ Print</li>
                                <li>👁️ Print Preview</li>
                                <li>⏸️ Suspend</li>
                                <li>📤 Export</li>
                                <li>📋 Copy</li>
                                <li>🔍 Search</li>
                                <li>🗺️ Map</li>
                                <li>📨 EInv</li>
                            </ul>
                            <div className="erp-side-tabs">
                                <span>Actions</span>
                                <span>Info</span>
                                <span>Reports</span>
                                <span>Shortcuts</span>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ApplyLeave;
