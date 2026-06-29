import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { travelRequestApi } from '../services/api';
import { statusLabel, statusColor } from '../utils/status';

const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB') : '';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';
const fmtMoney = (n) => (Number(n) || 0).toFixed(2);

const COLUMNS = [
    { key: 'requestNo', header: 'Request No.' },
    { key: 'status', header: 'Status' },
    { key: 'documentNo', header: 'Document No.' },
    { key: 'transactionNo', header: 'Transaction No.' },
    { key: 'employeeCode', header: 'Employee Code' },
    { key: 'totalAmount', header: 'Total Amount', type: 'money' },
    { key: 'lines', header: 'Lines', type: 'lines' },
    { key: 'comments', header: 'Comments' },
    { key: 'approvedBy', header: 'Approved By' },
    { key: 'approvedDate', header: 'Approved Date', type: 'date' },
    { key: 'createdAt', header: 'Created Date/Time', type: 'datetime' }
];

const cellValue = (c, it) => {
    if (c.type === 'date') return fmtDate(it[c.key]);
    if (c.type === 'datetime') return fmtDateTime(it[c.key]);
    if (c.type === 'money') return fmtMoney(it[c.key]);
    if (c.type === 'lines') return (it.lines || []).length;
    if (c.key === 'status') return statusLabel(it[c.key]);
    return it[c.key] ?? '';
};

// Managers/admins see every employee's requests; employees see only their own.
const isAdmin = () => ['manager', 'admin', 'super-admin'].includes(JSON.parse(localStorage.getItem('user') || '{}').role);

function TravelRequests() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [showView, setShowView] = useState(false);

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true); setError('');
        try {
            const { data } = await (isAdmin() ? travelRequestApi.all() : travelRequestApi.my());
            setItems(data.items || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load travel requests');
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const t = search.trim().toLowerCase();
        if (!t) return items;
        return items.filter((x) =>
            [x.requestNo, x.status, x.documentNo, x.employeeCode, x.comments]
                .filter((v) => v != null).join(' ').toLowerCase().includes(t)
        );
    }, [items, search]);

    const onView = () => {
        if (!selected) { alert('Select a travel request row first.'); return; }
        setShowView(true);
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName="Travel Requests" />
                <div className="erp-page" onClick={() => setSelected(null)}>
                    <div className="erp-titlebar">
                        <div className="erp-title">Travel Requests</div>
                        <div className="erp-titlebar-actions">
                            <button className="erp-action-btn" onClick={() => navigate('/travels/apply')}>➕ Apply Travel</button>
                            <button className="erp-action-btn" onClick={(e) => { e.stopPropagation(); onView(); }} disabled={!selected}>👁️ View</button>
                            <button className="erp-action-btn" onClick={load} disabled={loading}>🔄 Refresh</button>
                        </div>
                    </div>

                    <div className="erp-body">
                        <div className="erp-list-card" style={{ width: '100%' }}>
                            {error && <div className="error">{error}</div>}

                            <div style={{ display: 'flex', gap: 12, padding: 10, borderBottom: '1px solid #e5e7eb', alignItems: 'center' }}>
                                <input
                                    placeholder="Search by request no, status, comments…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ flex: 1, padding: '9px 12px', fontSize: 13, border: '1px solid var(--input-border)', borderRadius: 'var(--radius-control)' }}
                                />
                                <span style={{ fontSize: 11, color: '#6b7280' }}>{filtered.length} records</span>
                            </div>

                            {loading && <p style={{ padding: 16 }}>Loading…</p>}
                            <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <table className="erp-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 50 }}>Select</th>
                                            {COLUMNS.map((c) => <th key={c.key}>{c.header}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {!loading && filtered.length === 0 && (
                                            <tr><td colSpan={COLUMNS.length + 1} style={{ padding: 20, color: '#888' }}>
                                                No travel requests yet. Click <b>Apply Travel</b> to submit one.
                                            </td></tr>
                                        )}
                                        {filtered.map((it) => {
                                            const isSel = selected?._id === it._id;
                                            return (
                                                <tr key={it._id}
                                                    className={isSel ? 'erp-row-selected' : ''}
                                                    onClick={(e) => { e.stopPropagation(); setSelected(isSel ? null : it); }}
                                                    onDoubleClick={(e) => { e.stopPropagation(); setSelected(it); setShowView(true); }}>
                                                    <td><input type="checkbox" checked={isSel} readOnly /></td>
                                                    {COLUMNS.map((c) => (
                                                        <td key={c.key}>
                                                            {c.key === 'status'
                                                                ? <span style={{ color: statusColor(it.status), fontWeight: 600 }}>{statusLabel(it.status)}</span>
                                                                : cellValue(c, it)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Read-only view of a single request — existing requests cannot be edited. */}
                {showView && selected && (
                    <div className="erp-modal-backdrop" onClick={() => setShowView(false)}>
                        <div className="erp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
                            <div className="erp-modal-header">
                                Travel Request — {selected.requestNo || selected.documentNo}
                                <button className="erp-actions-close" onClick={() => setShowView(false)}>×</button>
                            </div>
                            <div className="erp-modal-body">
                                <div className="erp-grid">
                                    {COLUMNS.filter((c) => c.type !== 'lines').map((c) => (
                                        <div className="erp-field" key={c.key}>
                                            <label>{c.header}</label>
                                            <input
                                                value={cellValue(c, selected)}
                                                readOnly
                                                className="erp-readonly"
                                                style={c.key === 'status' ? { color: statusColor(selected.status), fontWeight: 600 } : undefined}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="erp-section" style={{ marginTop: 16 }}>
                                    <div className="erp-section-header">Lines</div>
                                    <table className="erp-table">
                                        <thead>
                                            <tr><th>#</th><th>Earning Pay Code</th><th>Description</th><th>Amount</th><th>Units</th><th>Date</th></tr>
                                        </thead>
                                        <tbody>
                                            {(selected.lines || []).length === 0 && (
                                                <tr><td colSpan={6} style={{ padding: 12, color: '#888' }}>No lines.</td></tr>
                                            )}
                                            {(selected.lines || []).map((l, i) => (
                                                <tr key={i}>
                                                    <td>{i + 1}</td>
                                                    <td>{l.earningPayCode}</td>
                                                    <td>{l.earningPayCodeDesc}</td>
                                                    <td style={{ textAlign: 'right' }}>{fmtMoney(l.amount)}</td>
                                                    <td>{l.unitCount}</td>
                                                    <td>{l.earningDate}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {(selected.attachments || []).length > 0 && (
                                    <div className="erp-section" style={{ marginTop: 12 }}>
                                        <div className="erp-section-header">Attachments</div>
                                        <ul style={{ margin: 0, padding: '8px 20px' }}>
                                            {selected.attachments.map((a, i) => (
                                                <li key={i} style={{ fontSize: 12 }}>{a.fileName} <span style={{ color: '#9ca3af' }}>({a.mimeType})</span></li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            <div className="erp-modal-footer">
                                <div style={{ flex: 1 }} />
                                <button className="btn" onClick={() => setShowView(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default TravelRequests;
