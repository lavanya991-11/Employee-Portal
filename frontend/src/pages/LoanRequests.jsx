import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { loanRequestApi } from '../services/api';

const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB') : '';

const COLUMNS = [
    { key: 'requestNo', header: 'Request No.' },
    { key: 'status', header: 'Status' },
    { key: 'documentNo', header: 'Document No.' },
    { key: 'employeeCode', header: 'Employee Code' },
    { key: 'loanPayCode', header: 'Loan Pay Code' },
    { key: 'loanAmount', header: 'Amount' },
    { key: 'installmentCalculation', header: 'Installment Calculation' },
    { key: 'noOfInstallments', header: 'No. of Installments' },
    { key: 'comments', header: 'Comments' },
    { key: 'createdAt', header: 'Created Date/Time', type: 'datetime' }
];

function LoanRequests() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true); setError('');
        try {
            const { data } = await loanRequestApi.my();
            setItems(data.items || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load loan requests');
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const t = search.trim().toLowerCase();
        if (!t) return items;
        return items.filter((x) =>
            [x.requestNo, x.status, x.documentNo, x.employeeCode, x.loanPayCode, x.comments]
                .filter((v) => v != null).join(' ').toLowerCase().includes(t)
        );
    }, [items, search]);

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName="Loan Requests" />
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">Loan Requests</div>
                        <div className="erp-titlebar-actions">
                            <button className="erp-action-btn" onClick={() => navigate('/loans/apply')}>➕ Apply Loan</button>
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
                                    style={{ flex: 1, padding: '4px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 3 }}
                                />
                                <span style={{ fontSize: 11, color: '#6b7280' }}>{filtered.length} records</span>
                            </div>

                            {loading && <p style={{ padding: 16 }}>Loading…</p>}
                            <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <table className="erp-table">
                                    <thead>
                                        <tr>{COLUMNS.map((c) => <th key={c.key}>{c.header}</th>)}</tr>
                                    </thead>
                                    <tbody>
                                        {!loading && filtered.length === 0 && (
                                            <tr><td colSpan={COLUMNS.length} style={{ padding: 20, color: '#888' }}>
                                                No loan requests yet. Click <b>Apply Loan</b> to submit one.
                                            </td></tr>
                                        )}
                                        {filtered.map((it) => (
                                            <tr key={it._id}>
                                                {COLUMNS.map((c) => (
                                                    <td key={c.key}>{c.type === 'datetime' ? fmtDateTime(it[c.key]) : (it[c.key] ?? '')}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default LoanRequests;
