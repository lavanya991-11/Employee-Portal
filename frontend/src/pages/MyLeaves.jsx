import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ActionButton from '../components/ActionButton';
import PageHeader from '../components/PageHeader';
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
    `AYL-${new Date(l.createdAt || Date.now()).getFullYear()}/${String(l._id || '').slice(-3).toUpperCase()}`;

const PAGE_SIZE = 20; // max leave records shown per page

// Pager button styles — numbered pages + prev/next chevrons.
const pagerNum = (active) => ({
    minWidth: 32, height: 32, padding: '0 8px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    border: active ? '1px solid var(--accent)' : '1px solid var(--input-border)',
    background: active ? 'var(--accent)' : 'var(--surface)',
    color: active ? '#fff' : '#374151', cursor: active ? 'default' : 'pointer'
});
const pagerArrow = (disabled) => ({
    width: 32, height: 32, borderRadius: 8, fontSize: 16, lineHeight: 1,
    border: '1px solid var(--input-border)', background: 'var(--surface)',
    color: disabled ? '#cbd5e1' : '#64748b', cursor: disabled ? 'default' : 'pointer'
});

// Line icons + gradient helper for the Document Status KPI cards.
const sIc = (paths) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);
const STAT_ICONS = {
    total: sIc(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" /></>),
    approved: sIc(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></>),
    pending: sIc(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
    rejected: sIc(<><circle cx="12" cy="12" r="9" /><path d="m15 9-6 6M9 9l6 6" /></>)
};
const darken = (hex, amt = 0.2) => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * (1 - amt));
    const g = Math.round(((n >> 8) & 255) * (1 - amt));
    const b = Math.round((n & 255) * (1 - amt));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

function MyLeaves() {
    const navigate = useNavigate();
    const userRole = JSON.parse(localStorage.getItem('user') || '{}').role;
    const isManager = ['manager', 'admin', 'super-admin'].includes(userRole);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [message, setMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [menuOpen, setMenuOpen] = useState(false); // "more actions" dropdown
    const tableRef = useRef(null);

    // Note: selection is kept while scrolling — it only changes when you click a
    // row again or toggle its checkbox (no click-outside / scrollbar deselect).

    const onEdit = () => {
        if (!selected) { alert('Select a row first.'); return; }
        if (selected.isPosted) {
            alert('Cannot edit a leave already posted to Business Central.');
            return;
        }
        if (selected.status !== 'Pending') {
            alert(`Cannot edit a ${selected.status.toLowerCase()} leave.`);
            return;
        }
        navigate(`/leaves/apply?edit=${selected._id}`);
    };

    const onDelete = async () => {
        if (!selected) return;
        if (selected.isPosted || selected.status !== 'Pending') return;
        setConfirmDelete(true);
    };

    const doDelete = async () => {
        setConfirmDelete(false);
        if (!selected) return;
        try {
            await leaveApi.remove(selected._id);
            setSelected(null);
            setMessage('Leave request deleted.');
            setTimeout(() => setMessage(''), 2500);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    const onRegenerate = async () => {
        setMessage('Regenerating from server…');
        try {
            const list = await load();
            setMessage(`Regenerated · ${list.length} record(s) refreshed at ${new Date().toLocaleTimeString('en-GB')}`);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Regenerate failed');
        }
    };

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true);
        try {
            // Admins / managers / super-admin see ALL employees' leaves; everyone else sees own.
            const role = JSON.parse(localStorage.getItem('user') || '{}').role;
            const isManager = ['manager', 'admin', 'super-admin'].includes(role);
            const { data } = await (isManager ? leaveApi.allLeaves() : leaveApi.myLeaves());
            const list = data.leaves || [];
            setLeaves(list);
            setPage(1);
            return list;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load leaves');
            return [];
        } finally {
            setLoading(false);
        }
    };

    const filteredLeaves = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return leaves;
        return leaves.filter((l) => {
            const hay = [
                docNo(l), l.leaveReferenceNumber, l.leaveType, l.payType,
                l.reason, l.status, l.approvedByName,
                l.fromDate, l.toDate, l.employee?.name
            ].filter(Boolean).join(' ').toLowerCase();
            return hay.includes(q);
        });
    }, [leaves, searchQuery]);

    // Pagination — show at most PAGE_SIZE rows per page of the filtered list.
    const pageCount = Math.max(1, Math.ceil(filteredLeaves.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const pageStart = (currentPage - 1) * PAGE_SIZE;
    const pageLeaves = filteredLeaves.slice(pageStart, pageStart + PAGE_SIZE);

    // Reset to the first page whenever the search query changes.
    useEffect(() => { setPage(1); }, [searchQuery]);

    const stats = useMemo(() => {
        const total = leaves.length;
        let approved = 0, rejected = 0, pending = 0;
        for (const l of leaves) {
            if (l.isApproved) approved++;
            else if (l.status === 'Rejected') rejected++;
            else pending++;
        }
        return {
            total,
            items: [
                { key: 'Pending', label: 'UnApproved', count: pending, color: STATUS_COLOR.Pending },
                { key: 'Rejected', label: 'Rejected', count: rejected, color: STATUS_COLOR.Rejected },
                { key: 'Approved', label: 'Approved', count: approved, color: STATUS_COLOR.Approved }
            ].map((s) => ({ ...s, pct: total ? Math.round((s.count / total) * 100) : 0 }))
        };
    }, [leaves]);

    // Document Status as modern KPI cards (shown under the header).
    const sc = Object.fromEntries(stats.items.map((s) => [s.key, s]));
    const statusCards = [
        { label: 'Total Requests', count: stats.total, color: '#2563eb', icon: STAT_ICONS.total, sub: 'All requests' },
        { label: 'Approved', count: sc.Approved?.count || 0, color: '#22c55e', icon: STAT_ICONS.approved, sub: `${sc.Approved?.pct || 0}% of total` },
        { label: 'Unapproved', count: sc.Pending?.count || 0, color: '#f59e0b', icon: STAT_ICONS.pending, sub: `${sc.Pending?.pct || 0}% of total` },
        { label: 'Rejected', count: sc.Rejected?.count || 0, color: '#ef4444', icon: STAT_ICONS.rejected, sub: `${sc.Rejected?.pct || 0}% of total` }
    ];

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName="Leave Request" />
                <div className="erp-page" ref={tableRef}>
                    <div className="erp-titlebar" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ flexShrink: 0 }}>
                            <div className="erp-title">Leave Request</div>
                            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Manage and track employee leave requests</div>
                        </div>
                        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
                            <span style={{
                                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                                color: '#9ca3af', fontSize: 14, pointerEvents: 'none'
                            }}>🔍</span>
                            <input
                                type="text"
                                placeholder="Search by reference no, doc no, status, type..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    padding: '10px 14px 10px 38px', fontSize: 14,
                                    border: '1px solid var(--input-border)', borderRadius: 'var(--radius-control)',
                                    width: '100%', background: '#fff',
                                    color: '#111827', outline: 'none',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                }}
                            />
                        </div>
                        <div className="erp-titlebar-actions">
                            <ActionButton kind="back" onClick={() => navigate(-1)}>Back</ActionButton>
                            <ActionButton kind="plus" tint="solid" onClick={() => navigate('/leaves/apply')}>New Request</ActionButton>
                            <div style={{ position: 'relative' }}>
                                <button type="button" className="erp-action-btn" title="More actions"
                                    onClick={() => setMenuOpen((v) => !v)} style={{ padding: '9px 11px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569"
                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" />
                                        <circle cx="9" cy="7" r="2.2" fill="#fff" /><circle cx="15" cy="12" r="2.2" fill="#fff" /><circle cx="9" cy="17" r="2.2" fill="#fff" />
                                    </svg>
                                </button>
                                {menuOpen && (
                                    <>
                                        <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                                        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 41, background: '#fff', border: '1px solid var(--line-soft)', borderRadius: 12, boxShadow: 'var(--shadow-md)', minWidth: 190, padding: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <ActionButton kind="edit" disabled={!selected || selected.isPosted || selected.status !== 'Pending'}
                                                onClick={() => { setMenuOpen(false); onEdit(); }}
                                                style={{ width: '100%', justifyContent: 'flex-start', border: 'none', boxShadow: 'none' }}>Edit</ActionButton>
                                            <ActionButton kind="trash" tint="danger" disabled={!selected || selected.isPosted || selected.status !== 'Pending'}
                                                onClick={() => { setMenuOpen(false); onDelete(); }}
                                                style={{ width: '100%', justifyContent: 'flex-start', border: 'none', boxShadow: 'none' }}>Delete</ActionButton>
                                            <ActionButton kind="refresh" onClick={() => { setMenuOpen(false); load(); }}
                                                style={{ width: '100%', justifyContent: 'flex-start', border: 'none', boxShadow: 'none' }}>Refresh</ActionButton>
                                            <ActionButton kind="sparkles" onClick={() => { setMenuOpen(false); onRegenerate(); }}
                                                style={{ width: '100%', justifyContent: 'flex-start', border: 'none', boxShadow: 'none' }}>Regenerate</ActionButton>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 16 }}>
                        {statusCards.map((c) => (
                            <div key={c.label} style={{
                                border: '1px solid var(--line-soft)', borderRadius: 14, padding: 16,
                                background: 'var(--surface)', boxShadow: 'var(--shadow-sm)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 44, height: 44, borderRadius: 12, color: '#fff', flexShrink: 0,
                                        background: `linear-gradient(135deg, ${c.color}, ${darken(c.color)})`,
                                        boxShadow: `0 4px 10px ${c.color}40`,
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                    }}>{c.icon}</div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, letterSpacing: '.3px' }}>{c.label.toUpperCase()}</div>
                                        <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{c.count}</div>
                                    </div>
                                </div>
                                <div style={{ marginTop: 10, fontSize: 12, color: '#6b7280' }}>{c.sub}</div>
                            </div>
                        ))}
                    </div>

                    <div className="erp-body">
                        <div className="erp-list-card">
                            {error && <div className="error">{error}</div>}
                            {message && <div className="success">{message}</div>}
                            {loading && <p style={{ padding: 16 }}>Loading…</p>}
                            {!loading && leaves.length === 0 && (
                                <p style={{ padding: 16, color: '#888' }}>No leave requests yet. Click <b>New</b> to apply.</p>
                            )}
                            {leaves.length > 0 && (
                                <div style={{ overflowX: 'auto' }}>
                                <table className="erp-table">
                                    <thead>
                                        <tr>
                                            <th>Select</th>
                                            <th>Doc Date</th>
                                            {isManager && <th>Employee</th>}
                                            <th>Doc No</th>
                                            <th>Ref No</th>
                                            <th>Type</th>
                                            <th>Pay Type</th>
                                            <th>From</th>
                                            <th>To</th>
                                            <th>Days</th>
                                            <th>Posted</th>
                                            <th>Status</th>
                                            <th>Approved Date</th>
                                            <th>Approved By</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pageLeaves.map((l) => {
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
                                                    {isManager && <td>{l.employee?.name || l.employee?.email || '—'}</td>}
                                                    <td className="erp-doc-link">{docNo(l)}</td>
                                                    <td style={{ fontWeight: 600, color: l.leaveReferenceNumber ? '#1e3a8a' : '#9ca3af' }}>
                                                        {l.leaveReferenceNumber || '—'}
                                                    </td>
                                                    <td>{l.leaveType}</td>
                                                    <td>
                                                        <span style={{
                                                            display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                                                            background: l.payType === 'Paid' ? '#dcfce7' : l.payType === 'Unpaid' ? '#fee2e2' : '#fef3c7',
                                                            color:      l.payType === 'Paid' ? '#15803d' : l.payType === 'Unpaid' ? '#b91c1c' : '#a16207'
                                                        }}>
                                                            {l.payType || '—'}
                                                        </span>
                                                    </td>
                                                    <td>{fmtDate(l.fromDate)}</td>
                                                    <td>{fmtDate(l.toDate)}</td>
                                                    <td>{l.totalDays}</td>
                                                    <td>
                                                        {l.isPosted ? (
                                                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: '#dbeafe', color: '#1e3a8a' }}>✓ Posted</span>
                                                        ) : (
                                                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: '#f3f4f6', color: '#6b7280' }}>Draft</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {l.isApproved ? (
                                                            <span style={{ color: '#15803d', fontWeight: 600 }}>✓ Approved</span>
                                                        ) : l.status === 'Rejected' ? (
                                                            <span style={{ color: '#b91c1c', fontWeight: 600 }}>✗ Rejected</span>
                                                        ) : (
                                                            <span style={{ color: '#a16207', fontWeight: 600 }}>⏳ UnApproved</span>
                                                        )}
                                                    </td>
                                                    <td>{l.approvedAt ? fmtDate(l.approvedAt) : '—'}</td>
                                                    <td>{l.approvedByName || '—'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                </div>
                            )}
                            {!loading && filteredLeaves.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderTop: '1px solid var(--line-soft)', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 13, color: '#6b7280' }}>
                                        Showing <b style={{ color: '#374151' }}>{pageStart + 1}–{pageStart + pageLeaves.length}</b> of <b style={{ color: '#374151' }}>{filteredLeaves.length}</b>
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}
                                            aria-label="Previous page" style={pagerArrow(currentPage <= 1)}>‹</button>
                                        {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                                            <button type="button" key={n} onClick={() => setPage(n)} style={pagerNum(n === currentPage)}>{n}</button>
                                        ))}
                                        <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= pageCount}
                                            aria-label="Next page" style={pagerArrow(currentPage >= pageCount)}>›</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {confirmDelete && selected && (
                    <div className="erp-modal-backdrop" onClick={() => setConfirmDelete(false)}>
                        <div className="erp-modal" onClick={(e) => e.stopPropagation()} style={{ width: 420 }}>
                            <div className="erp-modal-header">Delete leave request</div>
                            <div className="erp-modal-body">
                                <p style={{ margin: 0, color: '#374151' }}>
                                    Delete draft <b>{docNo(selected)}</b>?
                                </p>
                                <p style={{ margin: '8px 0 0', fontSize: 13, color: '#6b7280' }}>
                                    This action cannot be undone.
                                </p>
                            </div>
                            <div className="erp-modal-footer">
                                <button className="erp-action-btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
                                <button
                                    className="erp-action-btn"
                                    style={{ background: '#dc2626', color: '#fff', borderColor: '#dc2626' }}
                                    onClick={doDelete}
                                >Delete</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default MyLeaves;
