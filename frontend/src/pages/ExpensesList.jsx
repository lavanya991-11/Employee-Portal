import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { expenseApi } from '../services/api';

const STATUS_LABEL = { Pending: 'UnApproved', Approved: 'Posted', Rejected: 'Rejected' };
const STATUS_COLOR = { Pending: '#f59e0b', Approved: '#22c55e', Rejected: '#ef4444' };
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';
const docNo = (e) =>
    `EXP-${new Date(e.createdAt || Date.now()).getFullYear()}/${(e._id || '').slice(-3).toUpperCase()}`;

const PAGE_SIZE = 10;

function ExpensesList() {
    const navigate = useNavigate();
    const location = useLocation();
    const isNonTravel = location.pathname.includes('non-travel');
    const type = isNonTravel ? 'Non-Travel' : 'Travel';
    const formPath = isNonTravel ? '/expenses/non-travel/new' : '/expenses/travel/new';
    const title = isNonTravel ? 'Non-Travel Expenses' : 'Travel Expenses';

    const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selected, setSelected] = useState(null);
    const [page, setPage] = useState(1);

    useEffect(() => { setPage(1); load(); }, [type]);

    const load = async () => {
        setLoading(true); setError('');
        try {
            const { data } = await expenseApi.myExpenses(type);
            setRows(data.expenses || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load expenses');
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const total = rows.length;
        const counts = rows.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});
        return {
            total,
            items: [
                { key: 'Pending', label: 'UnApproved', count: counts.Pending || 0, color: STATUS_COLOR.Pending },
                { key: 'Rejected', label: 'Rejected', count: counts.Rejected || 0, color: STATUS_COLOR.Rejected },
                { key: 'Approved', label: 'Posted', count: counts.Approved || 0, color: STATUS_COLOR.Approved }
            ].map((s) => ({ ...s, pct: total ? Math.round((s.count / total) * 100) : 0 }))
        };
    }, [rows]);

    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName={title} />
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">{title} <span style={{ fontSize: 12, color: '#6b7280' }}>▼</span></div>
                        <div className="erp-titlebar-actions">
                            <button className="erp-action-btn" onClick={() => navigate(formPath)}>📄 New</button>
                            <button className="erp-action-btn" onClick={() => selected && navigate(formPath)}>✎ Edit</button>
                            <button className="erp-action-btn" onClick={load}>🔄 Refresh</button>
                            <button className="erp-action-btn" onClick={() => { setSuccess('Regenerated.'); load(); }}>♻️ Regenerate</button>
                        </div>
                    </div>

                    <div className="erp-body">
                        <div className="erp-list-card">
                            {error && <div className="error">{error}</div>}
                            {success && <div className="success">{success}</div>}
                            {loading && <p style={{ padding: 16 }}>Loading…</p>}
                            <table className="erp-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: 60 }}>Select</th>
                                        <th style={{ width: 50 }}>View</th>
                                        <th>Doc Date</th>
                                        <th>Doc No</th>
                                        <th>Status</th>
                                        <th>Code</th>
                                        <th>Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!loading && rows.length === 0 && (
                                        <tr><td colSpan={7} style={{ padding: 20, color: '#888' }}>
                                            No {title.toLowerCase()} yet. Click <b>New</b> to add one.
                                        </td></tr>
                                    )}
                                    {paged.map((e) => {
                                        const isSel = selected?._id === e._id;
                                        return (
                                            <tr key={e._id}
                                                className={isSel ? 'erp-row-selected' : ''}
                                                onClick={() => setSelected(e)}>
                                                <td><input type="checkbox" checked={isSel} readOnly /></td>
                                                <td><button type="button" className="erp-action-btn" style={{ padding: '2px 8px', fontSize: 11 }} onClick={(ev) => { ev.stopPropagation(); setSelected(e); }}>👁️</button></td>
                                                <td>{fmtDate(e.createdAt)}</td>
                                                <td className="erp-doc-link">{docNo(e)}</td>
                                                <td><span style={{ color: STATUS_COLOR[e.status], fontWeight: 600 }}>{STATUS_LABEL[e.status] || e.status}</span></td>
                                                <td>{user.empId || '—'}</td>
                                                <td>{user.name || '—'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <div className="erp-pagination">
                                <span>Records : {rows.length}</span>
                                <div className="erp-pager">
                                    <button onClick={() => setPage(1)} disabled={page === 1}>|◀</button>
                                    <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>◀</button>
                                    <span style={{ padding: '0 10px' }}>{page} of {totalPages}</span>
                                    <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>▶</button>
                                    <button onClick={() => setPage(totalPages)} disabled={page === totalPages}>▶|</button>
                                </div>
                            </div>
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
                                        <div style={{ fontWeight: 600, color: '#1e3a8a', marginBottom: 6 }}>{docNo(selected)}</div>
                                        <div style={{ fontSize: 12, color: '#6b7280' }}>{selected.claimType} · {Number(selected.amount).toFixed(2)}</div>
                                        {selected.remarks && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{selected.remarks}</div>}
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

export default ExpensesList;
