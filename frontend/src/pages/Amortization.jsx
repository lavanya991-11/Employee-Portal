import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { amortizationApi } from '../services/api';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';
const num = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
const bool = (v) => (v ? '✓' : '');

const COLUMNS = [
    { key: 'serialNumber', header: 'Serial No.' },
    { key: 'transactionNo', header: 'Transaction No.' },
    { key: 'payCodeDescription', header: 'Pay Code Description' },
    { key: 'dueDate', header: 'Due Date', type: 'date' },
    { key: 'deductionDate', header: 'Deduction Date', type: 'date' },
    { key: 'amount', header: 'Amount', type: 'num' },
    { key: 'isPaid', header: 'Paid', type: 'bool' },
    { key: 'isShifted', header: 'Shifted', type: 'bool' }
];

const cell = (c, it) => {
    if (c.type === 'date') return fmtDate(it[c.key]);
    if (c.type === 'num') return num(it[c.key]);
    if (c.type === 'bool') return bool(it[c.key]);
    return it[c.key] ?? '';
};

function Amortization() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true); setError('');
        try {
            const { data } = await amortizationApi.list();
            setItems(data.items || []);
            setSummary(data.summary || null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load amortization');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName="Amortization" />
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">Amortization <span style={{ fontSize: 12, color: '#6b7280' }}>(inquiry)</span></div>
                        <div className="erp-titlebar-actions">
                            <button className="erp-action-btn" onClick={() => navigate('/loan-requests')}>← Loan Requests</button>
                            <button className="erp-action-btn" onClick={load} disabled={loading}>🔄 Refresh</button>
                        </div>
                    </div>

                    <div className="erp-body">
                        <div className="erp-list-card" style={{ width: '100%' }}>
                            {error && <div className="error">{error}</div>}

                            {summary && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, padding: '12px 14px', borderBottom: '1px solid #e5e7eb', fontSize: 13 }}>
                                    <span><b>Employee Code:</b> {summary.employeeCode}</span>
                                    <span><b>Transaction No.:</b> {summary.transactionNo}</span>
                                    <span><b>Loan Pay Code:</b> {summary.finId}</span>
                                    <span><b>Total:</b> {num(summary.totalAmount)}</span>
                                    <span><b>Paid:</b> {num(summary.paidAmount)}</span>
                                    <span><b>Remaining:</b> {num(summary.remainingAmount)}</span>
                                </div>
                            )}

                            <div style={{ padding: '8px 10px', fontSize: 11, color: '#9ca3af', borderBottom: '1px solid #f3f4f6' }}>
                                Read-only inquiry. Data is refreshed each time the Amortization action is run. · {items.length} installment(s)
                            </div>

                            {loading && <p style={{ padding: 16 }}>Loading…</p>}
                            <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <table className="erp-table">
                                    <thead>
                                        <tr>{COLUMNS.map((c) => <th key={c.key}>{c.header}</th>)}</tr>
                                    </thead>
                                    <tbody>
                                        {!loading && items.length === 0 && (
                                            <tr><td colSpan={COLUMNS.length} style={{ padding: 20, color: '#888' }}>
                                                No amortization data. Open a loan in <b>Loan Requests</b> and click <b>Amortization</b>.
                                            </td></tr>
                                        )}
                                        {items.map((it) => (
                                            <tr key={it._id}>
                                                {COLUMNS.map((c) => <td key={c.key}>{cell(c, it)}</td>)}
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

export default Amortization;
