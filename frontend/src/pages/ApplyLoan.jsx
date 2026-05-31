import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { loanApi } from '../services/api';

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';

const STATUS_COLOR = { Pending: '#f59e0b', Approved: '#22c55e', Rejected: '#ef4444' };

function ApplyLoan() {
    const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);

    const [form, setForm] = useState({
        docDate: today(),
        docSeries: 'FDM/24-25',
        docNumber: 1,
        narration: '',
        employee: user.name || '',
        loanType: 'Salary Advance',
        loanAmount: 0,
        approvedAmount: 0,
        instAmount: 0,
        noOfInstallments: 0,
        deductionMonth: today().slice(0, 7) + '-01'
    });
    const [loans, setLoans] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const { data } = await loanApi.myLoans();
            setLoans(data.loans || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load loans');
        }
    };

    const onChange = (e) => {
        const { name, value, type } = e.target;
        setForm({ ...form, [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value });
        setError(''); setSuccess('');
    };

    const netTotal = useMemo(() => {
        const n = Number(form.instAmount) * Number(form.noOfInstallments);
        return isNaN(n) ? 0 : n;
    }, [form.instAmount, form.noOfInstallments]);

    const onSubmit = async (e) => {
        e?.preventDefault?.();
        setError(''); setSuccess('');
        if (!form.loanType || !form.loanAmount) {
            setError('Loan Type and Loan Amount are required.');
            return;
        }
        if (!form.instAmount || !form.noOfInstallments) {
            setError('Inst Amount and No Of Installments are required.');
            return;
        }
        setSaving(true);
        try {
            const reason = `Narration: ${form.narration || '-'} | InstAmount: ${form.instAmount} | NoOfInstallments: ${form.noOfInstallments} | DeductionMonth: ${form.deductionMonth}`;
            await loanApi.apply({
                loanType: form.loanType,
                amount: Number(form.loanAmount),
                reason
            });
            setSuccess('Loan request submitted.');
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to apply loan');
        } finally {
            setSaving(false);
        }
    };

    const onNew = () => {
        setForm({
            docDate: today(), docSeries: 'FDM/24-25', docNumber: 1, narration: '',
            employee: user.name || '', loanType: 'Salary Advance',
            loanAmount: 0, approvedAmount: 0, instAmount: 0, noOfInstallments: 0,
            deductionMonth: today().slice(0, 7) + '-01'
        });
        setError(''); setSuccess('');
    };

    const onDistribute = () => {
        if (!form.loanAmount || !form.noOfInstallments) {
            setError('Enter Loan Amount and No Of Installments to distribute.');
            return;
        }
        const inst = +(Number(form.loanAmount) / Number(form.noOfInstallments)).toFixed(2);
        setForm({ ...form, instAmount: inst });
        setSuccess(`Distributed: ${inst} per installment.`);
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">Apply Loan <span className="erp-badge">Draft</span></div>
                        <div className="erp-titlebar-actions">
                            <button type="button" className="erp-action-btn" onClick={onNew}>📄 New</button>
                            <button type="button" className="erp-action-btn" onClick={onSubmit} disabled={saving}>
                                {saving ? 'Posting…' : '📤 Post'}
                            </button>
                            <button type="button" className="erp-action-btn" onClick={onDistribute}>🧮 Distribute</button>
                        </div>
                    </div>

                    <div className="erp-body">
                        <form className="erp-form" onSubmit={onSubmit}>
                            {error && <div className="error">{error}</div>}
                            {success && <div className="success">{success}</div>}

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
                                            <input value={form.docSeries} readOnly className="erp-readonly" style={{ width: 100 }} />
                                            <input type="number" name="docNumber" value={form.docNumber} onChange={onChange} className="erp-docno-num" min="1" />
                                        </div>
                                    </div>
                                    <div className="erp-field erp-field-wide">
                                        <label>Narration</label>
                                        <input name="narration" value={form.narration} onChange={onChange} />
                                    </div>
                                </div>
                            </div>

                            <div className="erp-section">
                                <div className="erp-section-header">General</div>
                                <div className="erp-grid">
                                    <div className="erp-field">
                                        <label>Employee</label>
                                        <input name="employee" value={form.employee} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Loan Type</label>
                                        <select name="loanType" value={form.loanType} onChange={onChange}>
                                            <option>Salary Advance</option>
                                            <option>Personal</option>
                                            <option>Medical</option>
                                            <option>Education</option>
                                        </select>
                                    </div>
                                    <div className="erp-field">
                                        <label>Loan Amount</label>
                                        <input type="number" name="loanAmount" value={form.loanAmount} onChange={onChange} min="0" step="0.01" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Approved Amount</label>
                                        <input type="number" name="approvedAmount" value={form.approvedAmount} onChange={onChange} min="0" step="0.01" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Inst Amount *</label>
                                        <input type="number" name="instAmount" value={form.instAmount} onChange={onChange} min="0" step="0.01"
                                            className={form.instAmount ? '' : 'erp-required'} />
                                    </div>
                                    <div className="erp-field">
                                        <label>No Of Installments *</label>
                                        <input type="number" name="noOfInstallments" value={form.noOfInstallments} onChange={onChange} min="0"
                                            className={form.noOfInstallments ? '' : 'erp-required'} />
                                    </div>
                                    <div className="erp-field">
                                        <label>Deduction Month</label>
                                        <input type="date" name="deductionMonth" value={form.deductionMonth} onChange={onChange} />
                                    </div>
                                    <div className="erp-field" style={{ alignSelf: 'end' }}>
                                        <label style={{ visibility: 'hidden' }}>Net Total</label>
                                        <div style={{ background: '#a7f3d0', padding: '6px 10px', borderRadius: 3, fontWeight: 600, textAlign: 'right' }}>
                                            Net Total : {netTotal}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="erp-list-card" style={{ marginTop: 0 }}>
                                <div style={{ padding: 10, fontWeight: 600, borderBottom: '1px solid #e5e7eb', color: '#1e3a8a' }}>
                                    My Loan Requests
                                </div>
                                {loans.length === 0 && <p style={{ padding: 12, color: '#888' }}>No loan requests yet.</p>}
                                {loans.length > 0 && (
                                    <table className="erp-table">
                                        <thead>
                                            <tr><th>Doc Date</th><th>Type</th><th>Amount</th><th>Reason</th><th>Status</th></tr>
                                        </thead>
                                        <tbody>
                                            {loans.map((l) => (
                                                <tr key={l._id}>
                                                    <td>{fmtDate(l.createdAt)}</td>
                                                    <td>{l.loanType}</td>
                                                    <td>{l.amount}</td>
                                                    <td style={{ fontSize: 11 }}>{l.reason}</td>
                                                    <td><span style={{ color: STATUS_COLOR[l.status], fontWeight: 600 }}>{l.status}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </form>

                        <aside className="erp-actions-panel">
                            <div className="erp-actions-header"><span>Actions</span></div>
                            <ul className="erp-actions-list">
                                <li onClick={() => window.print()}>🖨️ Print</li>
                                <li onClick={onDistribute}>🧮 Distribute</li>
                                <li onClick={load}>🔄 Refresh</li>
                            </ul>
                            <div className="erp-side-tabs">
                                <span>Actions</span><span>Info</span><span>Reports</span><span>Shortcut</span>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ApplyLoan;
