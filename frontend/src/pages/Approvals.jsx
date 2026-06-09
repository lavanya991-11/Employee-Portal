import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { leaveApi, authApi } from '../services/api';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';
const docNo = (l) =>
    `AYL-${new Date(l.createdAt || Date.now()).getFullYear()}/${(l._id || '').slice(-3).toUpperCase()}`;

function Approvals() {
    const navigate = useNavigate();
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selected, setSelected] = useState(null);
    const [showAction, setShowAction] = useState(false);
    const [actionDate, setActionDate] = useState(new Date().toISOString().slice(0, 10));
    const [remarks, setRemarks] = useState('Approved');
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => { load(); }, []);

    const onSignOut = async () => {
        if (!window.confirm('Sign out?')) return;
        try { await authApi.logout(); } catch (e) {}
        localStorage.clear();
        navigate('/login');
    };

    const filteredPending = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return pending;
        return pending.filter((l) => {
            const haystack = [
                l.employee?.name,
                l.leaveType,
                l.reason,
                docNo(l),
                l.leaveReferenceNumber
            ].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(q);
        });
    }, [pending, searchQuery]);

    const load = async () => {
        setLoading(true); setError(''); setSuccess('');
        try {
            const { data } = await leaveApi.allLeaves();
            setPending((data.leaves || []).filter((l) => l.status === 'Pending'));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load approvals');
        } finally {
            setLoading(false);
        }
    };

    const openAction = () => {
        if (!selected) { setError('Select a row first.'); return; }
        setError('');
        setShowAction(true);
    };

    const decide = async (status) => {
        if (!selected) return;
        setSaving(true); setError('');
        try {
            await leaveApi.updateStatus(selected._id, { status, approverRemarks: remarks });
            setSuccess(`Leave ${status.toLowerCase()}.`);
            setShowAction(false);
            setSelected(null);
            setRemarks('Approved');
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Action failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">Approvals</div>
                        <div className="erp-titlebar-actions">
                            <input
                                type="text"
                                placeholder="🔍 Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ padding: '6px 10px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, width: 180 }}
                            />
                            <button className="erp-action-btn" onClick={openAction}>⚙ Actions</button>
                            <button className="erp-action-btn" onClick={() => navigate(-1)}>↩ Back</button>
                            <button className="erp-action-btn" onClick={load}>🔄 Refresh</button>
                            <button className="erp-action-btn" onClick={onSignOut} style={{ color: '#dc2626', borderColor: '#fecaca' }}>↪ Sign out</button>
                        </div>
                    </div>

                    <div className="erp-body">
                        <div className="erp-list-card">
                            {error && <div className="error">{error}</div>}
                            {success && <div className="success">{success}</div>}
                            {loading && <p style={{ padding: 16 }}>Loading…</p>}
                            {!loading && pending.length === 0 && (
                                <p style={{ padding: 16, color: '#888' }}>No pending leave requests. 🎉</p>
                            )}
                            {pending.length > 0 && filteredPending.length === 0 && (
                                <p style={{ padding: 16, color: '#888' }}>No results match "{searchQuery}".</p>
                            )}
                            {filteredPending.length > 0 && (
                                <table className="erp-table">
                                    <thead>
                                        <tr>
                                            <th>Select</th>
                                            <th>Doc Date</th>
                                            <th>Doc No</th>
                                            <th>Account Name</th>
                                            <th>From</th>
                                            <th>To</th>
                                            <th>Days</th>
                                            <th>Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPending.map((l) => {
                                            const isSel = selected?._id === l._id;
                                            return (
                                                <tr
                                                    key={l._id}
                                                    className={isSel ? 'erp-row-selected' : ''}
                                                    onClick={() => setSelected(l)}
                                                >
                                                    <td><input type="checkbox" checked={isSel} readOnly /></td>
                                                    <td>{fmtDate(l.createdAt)}</td>
                                                    <td className="erp-doc-link">{docNo(l)}</td>
                                                    <td>{l.employee?.name || '—'}</td>
                                                    <td>{fmtDate(l.fromDate)}</td>
                                                    <td>{fmtDate(l.toDate)}</td>
                                                    <td>{l.totalDays}</td>
                                                    <td>{l.reason}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {showAction && selected && (
                            <aside className="erp-actions-panel" style={{ width: 260 }}>
                                <div className="erp-actions-header">
                                    <span>Approve or Reject</span>
                                    <button
                                        type="button"
                                        className="erp-actions-close"
                                        onClick={() => setShowAction(false)}
                                        title="Close"
                                    >×</button>
                                </div>
                                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div className="erp-field">
                                        <label>Doc No</label>
                                        <input value={docNo(selected)} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Date</label>
                                        <input type="date" value={actionDate} onChange={(e) => setActionDate(e.target.value)} />
                                    </div>
                                    <div className="erp-field">
                                        <label>Remarks</label>
                                        <textarea
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            rows={3}
                                            style={{ border: '1px solid #d1d5db', borderRadius: 3, padding: 6, fontSize: 13 }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                            type="button"
                                            className="btn"
                                            onClick={() => decide('Approved')}
                                            disabled={saving}
                                            style={{ flex: 1 }}
                                        >
                                            {saving ? '…' : 'Approve'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn"
                                            onClick={() => decide('Rejected')}
                                            disabled={saving}
                                            style={{ flex: 1, background: 'white', color: '#1e3a8a', border: '1px solid #1e3a8a' }}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        className="erp-action-btn"
                                        onClick={() => setShowAction(false)}
                                    >× Cancel</button>
                                </div>
                            </aside>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Approvals;
