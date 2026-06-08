import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { leaveApi } from '../services/api';

const STATUS_LABEL = {
    Pending: 'UnApproved',
    Approved: 'Posted',
    Rejected: 'Rejected'
};
const STATUS_COLOR = {
    Pending: '#f59e0b',
    Approved: '#22c55e',
    Rejected: '#ef4444',
    Cancelled: '#6b7280'
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';
const docNo = (l) =>
    `AYL-${new Date(l.createdAt || Date.now()).getFullYear()}/${(l._id || '').slice(-3).toUpperCase()}`;

function MyLeaves() {
    const navigate = useNavigate();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);
    const [message, setMessage] = useState('');
    const tableRef = useRef(null);

    // Deselect when clicking outside the table or toolbar.
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (tableRef.current && !tableRef.current.contains(e.target)) {
                setSelected(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const onEdit = () => {
        if (!selected) { alert('Select a row first.'); return; }
        if (selected.status !== 'Pending') {
            alert(`Cannot edit a ${selected.status.toLowerCase()} leave.`);
            return;
        }
        navigate(`/leaves/apply?edit=${selected._id}`);
    };

    const onRegenerate = async () => {
        setMessage('Regenerating from server…');
        try {
            await load();
            setMessage(`Regenerated · ${leaves.length} record(s) refreshed at ${new Date().toLocaleTimeString('en-GB')}`);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Regenerate failed');
        }
    };

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await leaveApi.myLeaves();
            setLeaves(data.leaves || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load leaves');
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const total = leaves.length;
        const counts = leaves.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {});
        return {
            total,
            items: [
                { key: 'Pending', label: 'UnApproved', count: counts.Pending || 0, color: STATUS_COLOR.Pending },
                { key: 'Rejected', label: 'Rejected', count: counts.Rejected || 0, color: STATUS_COLOR.Rejected },
                { key: 'Approved', label: 'Posted', count: counts.Approved || 0, color: STATUS_COLOR.Approved }
            ].map((s) => ({ ...s, pct: total ? Math.round((s.count / total) * 100) : 0 }))
        };
    }, [leaves]);

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">Apply Leave</div>
                        <div className="erp-titlebar-actions">
                            <button className="erp-action-btn" onClick={() => navigate('/leaves/apply')}>📄 New</button>
                            <button className="erp-action-btn" onClick={onEdit} disabled={!selected}>✏️ Edit</button>
                            <button className="erp-action-btn" onClick={load}>🔄 Refresh</button>
                            <button className="erp-action-btn" onClick={onRegenerate}>⚙️ Regenerate</button>
                        </div>
                    </div>

                    <div className="erp-body">
                        <div className="erp-list-card" ref={tableRef}>
                            {error && <div className="error">{error}</div>}
                            {message && <div className="success">{message}</div>}
                            {loading && <p style={{ padding: 16 }}>Loading…</p>}
                            {!loading && leaves.length === 0 && (
                                <p style={{ padding: 16, color: '#888' }}>No leave requests yet. Click <b>New</b> to apply.</p>
                            )}
                            {leaves.length > 0 && (
                                <table className="erp-table">
                                    <thead>
                                        <tr>
                                            <th>Select</th>
                                            <th>Doc Date</th>
                                            <th>Doc No</th>
                                            <th>Ref No</th>
                                            <th>Type</th>
                                            <th>From</th>
                                            <th>To</th>
                                            <th>Days</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaves.map((l) => {
                                            const isSel = selected?._id === l._id;
                                            return (
                                                <tr
                                                    key={l._id}
                                                    className={isSel ? 'erp-row-selected' : ''}
                                                    onClick={() => setSelected(isSel ? null : l)}
                                                >
                                                    <td onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSel}
                                                            onChange={() => setSelected(isSel ? null : l)}
                                                        />
                                                    </td>
                                                    <td>{fmtDate(l.createdAt)}</td>
                                                    <td className="erp-doc-link">{docNo(l)}</td>
                                                    <td style={{ fontWeight: 600, color: l.leaveReferenceNumber ? '#1e3a8a' : '#9ca3af' }}>
                                                        {l.leaveReferenceNumber || '—'}
                                                    </td>
                                                    <td>{l.leaveType}</td>
                                                    <td>{fmtDate(l.fromDate)}</td>
                                                    <td>{fmtDate(l.toDate)}</td>
                                                    <td>{l.totalDays}</td>
                                                    <td>
                                                        <span style={{ color: STATUS_COLOR[l.status] || '#374151', fontWeight: 600 }}>
                                                            {STATUS_LABEL[l.status] || l.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <aside className="erp-actions-panel">
                            <div className="erp-actions-header">
                                <span>Document Status</span>
                                <span style={{ color: '#1e3a8a', fontWeight: 700 }}>{stats.total}</span>
                            </div>
                            <div style={{ padding: 14 }}>
                                {stats.items.map((s) => (
                                    <div key={s.key} style={{ marginBottom: 14 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151', marginBottom: 4 }}>
                                            <span>{s.label} <span style={{ color: '#9ca3af' }}>{s.pct}%</span></span>
                                            <span style={{ fontWeight: 600 }}>{s.count}</span>
                                        </div>
                                        <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${s.pct}%`, background: s.color }} />
                                        </div>
                                    </div>
                                ))}
                                {selected && (
                                    <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                                        <div style={{ fontWeight: 600, color: '#1e3a8a', marginBottom: 8 }}>{docNo(selected)}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                                            <span>Bill Amount</span><span>0.000</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' }}>
                                            <span>Adjusted Amount</span><span>0.000</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default MyLeaves;
