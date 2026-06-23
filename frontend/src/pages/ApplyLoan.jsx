import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { loanProductApi, loanRequestApi, employeeInfoApi } from '../services/api';

const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB') : '';

const blankForm = {
    loanPayCode: '',
    loanAmount: '',
    installmentCalculation: 0,
    noOfInstallments: '',
    comments: ''
};

function ApplyLoan() {
    const navigate = useNavigate();

    const [employeeCode, setEmployeeCode] = useState('');
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState(blankForm);
    const [requests, setRequests] = useState([]);
    const [posted, setPosted] = useState(null); // { requestNo, status, documentNo }
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        employeeInfoApi.getMy()
            .then(({ data }) => setEmployeeCode(data.employeeInfo?.employeeCode || ''))
            .catch(() => {});
        loanProductApi.lookup()
            .then(({ data }) => setProducts(data.items || []))
            .catch(() => {});
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            const { data } = await loanRequestApi.my();
            setRequests(data.items || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load loan requests');
        }
    };

    const onChange = (e) => {
        const { name, value, type } = e.target;
        setForm({ ...form, [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value });
        setError(''); setSuccess('');
    };

    const onNew = () => {
        setForm(blankForm);
        setPosted(null);
        setError(''); setSuccess('');
    };

    const onPost = async (e) => {
        e?.preventDefault?.();
        setError(''); setSuccess('');
        if (form.loanPayCode === '' || form.loanAmount === '' || !Number(form.loanAmount)) {
            setError('Loan Pay Code and Amount are required.');
            return;
        }
        setSaving(true);
        try {
            const { data } = await loanRequestApi.submit({
                loanPayCode: Number(form.loanPayCode),
                loanAmount: Number(form.loanAmount),
                installmentCalculation: Number(form.installmentCalculation) || 0,
                noOfInstallments: Number(form.noOfInstallments) || 0,
                comments: form.comments || ''
            });
            setPosted({ requestNo: data.requestNo, status: data.status, documentNo: data.request?.documentNo });
            setSuccess(data.message || `Request No: ${data.requestNo} (${data.status}).`);
            setForm(blankForm);
            loadRequests();
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to submit loan request');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName="Apply Loan" />
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">Apply Loan <span className="erp-badge">Draft</span></div>
                        <div className="erp-titlebar-actions">
                            <button type="button" className="erp-action-btn" onClick={onNew}>📄 New</button>
                            <button type="button" className="erp-action-btn" onClick={onPost} disabled={saving}>
                                {saving ? 'Posting…' : '📤 Post'}
                            </button>
                            <button type="button" className="erp-action-btn" onClick={() => navigate('/loan-requests')}>📋 Loan Requests</button>
                        </div>
                    </div>

                    <div className="erp-body">
                        <form className="erp-form" onSubmit={onPost}>
                            {error && <div className="error">{error}</div>}
                            {success && <div className="success">{success}</div>}

                            {posted && (
                                <div className="erp-section">
                                    <div className="erp-section-header">Submission Result</div>
                                    <div className="erp-grid">
                                        <div className="erp-field">
                                            <label>Request No.</label>
                                            <input value={posted.requestNo || ''} readOnly className="erp-readonly" />
                                        </div>
                                        <div className="erp-field">
                                            <label>Status</label>
                                            <input value={posted.status || ''} readOnly className="erp-readonly" />
                                        </div>
                                        <div className="erp-field">
                                            <label>Document No.</label>
                                            <input value={posted.documentNo || ''} readOnly className="erp-readonly" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="erp-section">
                                <div className="erp-section-header">Loan Request</div>
                                <div className="erp-grid">
                                    <div className="erp-field">
                                        <label>Document No.</label>
                                        <input value="(auto-generated on Post)" readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Employee Code</label>
                                        <input value={employeeCode} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Loan Pay Code</label>
                                        <select name="loanPayCode" value={form.loanPayCode} onChange={onChange}>
                                            <option value="">-- Select loan product --</option>
                                            {products.map((p) => (
                                                <option key={p._id || p.finId} value={p.finId}>
                                                    {p.finId} — {p.description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="erp-field">
                                        <label>Amount</label>
                                        <input type="number" name="loanAmount" value={form.loanAmount} onChange={onChange} min="0" step="0.01" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Installment Calculation</label>
                                        <input type="number" name="installmentCalculation" value={form.installmentCalculation} onChange={onChange} min="0" />
                                    </div>
                                    <div className="erp-field">
                                        <label>No. of Installments</label>
                                        <input type="number" name="noOfInstallments" value={form.noOfInstallments} onChange={onChange} min="0" />
                                    </div>
                                    <div className="erp-field erp-field-wide">
                                        <label>Comments</label>
                                        <input name="comments" value={form.comments} onChange={onChange} placeholder="Additional remarks" />
                                    </div>
                                </div>
                            </div>

                            <div className="erp-list-card" style={{ marginTop: 0 }}>
                                <div style={{ padding: 10, fontWeight: 600, borderBottom: '1px solid #e5e7eb', color: '#1e3a8a' }}>
                                    My Loan Requests
                                </div>
                                {requests.length === 0 && <p style={{ padding: 12, color: '#888' }}>No loan requests yet.</p>}
                                {requests.length > 0 && (
                                    <table className="erp-table">
                                        <thead>
                                            <tr><th>Request No.</th><th>Status</th><th>Loan Pay Code</th><th>Amount</th><th>Created</th></tr>
                                        </thead>
                                        <tbody>
                                            {requests.slice(0, 5).map((r) => (
                                                <tr key={r._id}>
                                                    <td>{r.requestNo}</td>
                                                    <td>{r.status}</td>
                                                    <td>{r.loanPayCode}</td>
                                                    <td>{r.loanAmount}</td>
                                                    <td style={{ fontSize: 11 }}>{fmtDateTime(r.createdAt)}</td>
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
                                <li onClick={onPost}>📤 Post</li>
                                <li onClick={onNew}>📄 New</li>
                                <li onClick={() => navigate('/loan-requests')}>📋 Loan Requests</li>
                                <li onClick={loadRequests}>🔄 Refresh</li>
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
