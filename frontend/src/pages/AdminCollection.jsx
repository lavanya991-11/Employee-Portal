import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { adminApi } from '../services/api';
import { statusLabel, statusColor } from '../utils/status';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';
const fmtMoney = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
const STATUS_COLOR = { Pending: '#f59e0b', Approved: '#22c55e', Rejected: '#ef4444' };

// Each entry: title, fetcher (returns array key on response), columns
const COLLECTIONS = {
    users: {
        title: 'All Users',
        fetcher: () => adminApi.users(),
        rowsKey: 'users',
        columns: [
            { header: 'Name', get: (r) => r.name },
            { header: 'Email', get: (r) => r.email },
            { header: 'Emp ID', get: (r) => r.empId || '—' },
            { header: 'Department', get: (r) => r.department || '—' },
            { header: 'Designation', get: (r) => r.designation || '—' },
            { header: 'Role', get: (r) => r.role }
        ]
    },
    employees: {
        title: 'All Employees',
        fetcher: () => adminApi.employees(),
        rowsKey: 'employees',
        columns: [
            { header: 'Code', get: (r) => r.employeeCode },
            { header: 'Name', get: (r) => `${r.firstName || ''} ${r.lastName || ''}`.trim() },
            { header: 'Job Title', get: (r) => r.jobTitle || '—' },
            { header: 'Department', get: (r) => r.department || '—' },
            { header: 'Designation', get: (r) => r.designation || '—' },
            { header: 'Date of Joining', get: (r) => fmtDate(r.dateOfJoining) },
            { header: 'Status', get: (r) => r.status || '—' }
        ]
    },
    leaves: {
        title: 'All Leaves',
        fetcher: () => adminApi.leaves(),
        rowsKey: 'leaves',
        columns: [
            { header: 'Date', get: (r) => fmtDate(r.createdAt) },
            { header: 'Employee', get: (r) => r.employee?.name || '—' },
            { header: 'Type', get: (r) => r.leaveType },
            { header: 'From', get: (r) => fmtDate(r.fromDate) },
            { header: 'To', get: (r) => fmtDate(r.toDate) },
            { header: 'Days', get: (r) => r.totalDays },
            { header: 'Reason', get: (r) => r.reason },
            { header: 'Status', get: (r) => r.status, color: (r) => STATUS_COLOR[r.status] }
        ]
    },
    loans: {
        title: 'All Loans',
        fetcher: () => adminApi.loans(),
        rowsKey: 'loans',
        columns: [
            { header: 'Date', get: (r) => fmtDate(r.createdAt) },
            { header: 'Employee', get: (r) => r.employee?.name || '—' },
            { header: 'Type', get: (r) => r.loanType },
            { header: 'Amount', get: (r) => fmtMoney(r.amount) },
            { header: 'Reason', get: (r) => r.reason },
            { header: 'Status', get: (r) => r.status, color: (r) => STATUS_COLOR[r.status] }
        ]
    },
    expenses: {
        title: 'All Expenses',
        fetcher: () => adminApi.expenses(),
        rowsKey: 'expenses',
        columns: [
            { header: 'Date', get: (r) => fmtDate(r.createdAt) },
            { header: 'Employee', get: (r) => r.employee?.name || '—' },
            { header: 'Type', get: (r) => r.expenseType },
            { header: 'Claim', get: (r) => r.claimType },
            { header: 'Amount', get: (r) => fmtMoney(r.amount) },
            { header: 'Remarks', get: (r) => r.remarks },
            { header: 'Status', get: (r) => r.status, color: (r) => STATUS_COLOR[r.status] }
        ]
    },
    travels: {
        title: 'All Travel Expenses',
        fetcher: () => adminApi.travels(),
        rowsKey: 'items',
        columns: [
            { header: 'Date', get: (r) => fmtDate(r.createdAt) },
            { header: 'Employee', get: (r) => r.employee?.name || '—' },
            { header: 'Request No.', get: (r) => r.requestNo || '—' },
            { header: 'Document No.', get: (r) => r.documentNo || '—' },
            { header: 'Transaction No.', get: (r) => r.transactionNo || '—' },
            { header: 'Total Amount', get: (r) => fmtMoney(r.totalAmount) },
            { header: 'Lines', get: (r) => (r.lines || []).length },
            { header: 'Comments', get: (r) => r.comments || '—' },
            { header: 'Status', get: (r) => statusLabel(r.status), color: (r) => statusColor(r.status) },
            { header: 'Approved By', get: (r) => r.approvedBy || '—' },
            { header: 'Approved Date', get: (r) => fmtDate(r.approvedDate) }
        ]
    },
    overtimes: {
        title: 'All Overtime Requests',
        fetcher: () => adminApi.overtimes(),
        rowsKey: 'overtimes',
        columns: [
            { header: 'Date', get: (r) => fmtDate(r.date) },
            { header: 'Employee', get: (r) => r.employee?.name || '—' },
            { header: 'Hours', get: (r) => r.hoursRequested },
            { header: 'Project', get: (r) => r.projectRef || '—' },
            { header: 'Justification', get: (r) => r.justification },
            { header: 'Status', get: (r) => r.status, color: (r) => STATUS_COLOR[r.status] }
        ]
    },
    assets: {
        title: 'All Asset Requests',
        fetcher: () => adminApi.assets(),
        rowsKey: 'assets',
        columns: [
            { header: 'Date', get: (r) => fmtDate(r.createdAt) },
            { header: 'Employee', get: (r) => r.employee?.name || '—' },
            { header: 'Asset Code', get: (r) => r.assetCode },
            { header: 'Asset Name', get: (r) => r.assetName },
            { header: 'Remarks', get: (r) => r.remarks || '—' },
            { header: 'Status', get: (r) => r.status, color: (r) => STATUS_COLOR[r.status] }
        ]
    }
};

const PAGE_SIZE = 20;

function AdminCollection() {
    const { collection } = useParams();
    const navigate = useNavigate();
    const config = COLLECTIONS[collection];

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (!config) return;
        setLoading(true);
        setPage(1);
        config.fetcher()
            .then(({ data }) => setRows(data[config.rowsKey] || []))
            .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
            .finally(() => setLoading(false));
    }, [collection]);

    const filtered = useMemo(() => {
        if (!config) return [];
        const t = search.trim().toLowerCase();
        if (!t) return rows;
        return rows.filter((r) =>
            config.columns.some((c) => String(c.get(r) ?? '').toLowerCase().includes(t))
        );
    }, [rows, search, config]);

    // Keep all hooks above this early return so hook order stays stable (Rules of Hooks).
    if (!config) {
        return (
            <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                    <p style={{ padding: 20 }}>Unknown collection: <b>{collection}</b></p>
                </main>
            </div>
        );
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const onExport = () => {
        const headers = config.columns.map((c) => c.header);
        const escape = (v) => {
            const s = String(v ?? '');
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const lines = [
            headers.join(','),
            ...filtered.map((r) => config.columns.map((c) => escape(c.get(r))).join(','))
        ];
        const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${collection}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">{config.title}</div>
                        <div className="erp-titlebar-actions">
                            <button className="erp-action-btn" onClick={() => navigate('/admin')}>↩ Admin Home</button>
                            <button className="erp-action-btn" onClick={onExport}>📤 Export CSV</button>
                            <button className="erp-action-btn" onClick={() => {
                                setLoading(true);
                                config.fetcher()
                                    .then(({ data }) => setRows(data[config.rowsKey] || []))
                                    .finally(() => setLoading(false));
                            }}>🔄 Refresh</button>
                        </div>
                    </div>

                    <div className="erp-body">
                        <div className="erp-list-card">
                            {error && <div className="error">{error}</div>}

                            <div style={{ display: 'flex', gap: 12, padding: 10, borderBottom: '1px solid #e5e7eb', alignItems: 'center' }}>
                                <input
                                    placeholder="Search across all columns…"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    style={{ flex: 1, padding: '4px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 3 }}
                                />
                                <span style={{ fontSize: 11, color: '#6b7280' }}>{filtered.length} records</span>
                            </div>

                            {loading && <p style={{ padding: 16 }}>Loading…</p>}
                            {!loading && filtered.length === 0 && <p style={{ padding: 16, color: '#888' }}>No records.</p>}
                            {filtered.length > 0 && (
                                <table className="erp-table">
                                    <thead>
                                        <tr>{config.columns.map((c) => <th key={c.header}>{c.header}</th>)}</tr>
                                    </thead>
                                    <tbody>
                                        {paged.map((r, i) => (
                                            <tr key={r._id || i}>
                                                {config.columns.map((c) => (
                                                    <td key={c.header} style={c.color ? { color: c.color(r), fontWeight: 600 } : undefined}>
                                                        {c.get(r) ?? '—'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {filtered.length > PAGE_SIZE && (
                                <div className="erp-pagination">
                                    <span>Records : {filtered.length}</span>
                                    <div className="erp-pager">
                                        <button onClick={() => setPage(1)} disabled={page === 1}>|◀</button>
                                        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>◀</button>
                                        <span style={{ padding: '0 10px' }}>{page} of {totalPages}</span>
                                        <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>▶</button>
                                        <button onClick={() => setPage(totalPages)} disabled={page === totalPages}>▶|</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default AdminCollection;
