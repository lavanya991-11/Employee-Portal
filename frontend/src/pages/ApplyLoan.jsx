import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { loanProductApi, loanRequestApi, employeeInfoApi } from '../services/api';
import { statusLabel, statusColor } from '../utils/status';

const blankForm = {
    loanPayCode: '',
    loanAmount: '',
    installmentCalculation: 0,
    noOfInstallments: '',
    comments: ''
};

function ApplyLoan() {
    const navigate = useNavigate();
    const [sideTab, setSideTab] = useState('actions'); // actions | info | reports | shortcuts

    const [employeeCode, setEmployeeCode] = useState('');
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState(blankForm);
    const [posted, setPosted] = useState(null); // { requestNo, status }
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
    }, []);

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
            setPosted({ requestNo: data.requestNo, status: data.status });
            setSuccess(data.message || `Request No: ${data.requestNo} (${data.status}).`);
            setForm(blankForm);
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
                            <button type="button" className="erp-action-btn" onClick={() => navigate('/loan-requests')}>← Back</button>
                            <button type="button" className="erp-action-btn" onClick={onNew}>📄 New</button>
                            <button type="button" className="erp-action-btn" onClick={onPost} disabled={saving}>
                                {saving ? 'Posting…' : '📤 Post'}
                            </button>
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
                                            <input value={statusLabel(posted.status)} readOnly className="erp-readonly" style={{ color: statusColor(posted.status), fontWeight: 600 }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="erp-section">
                                <div className="erp-section-header">Loan Request</div>
                                <div className="erp-grid">
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
                                        <label>No. of Installments</label>
                                        <input type="number" name="noOfInstallments" value={form.noOfInstallments} onChange={onChange} min="0" />
                                    </div>
                                    <div className="erp-field erp-field-wide">
                                        <label>Comments</label>
                                        <input name="comments" value={form.comments} onChange={onChange} placeholder="Additional remarks" />
                                    </div>
                                </div>
                            </div>
                        </form>

                        <aside className="erp-actions-panel">
                            <div className="erp-actions-header"><span>{{ actions: 'Actions', info: 'Info', reports: 'Reports', shortcuts: 'Shortcuts' }[sideTab]}</span></div>
                            {sideTab === 'actions' && (
                                <ul className="erp-actions-list">
                                    <li onClick={onPost}>📤 Post</li>
                                    <li onClick={onNew}>📄 New</li>
                                    <li onClick={() => navigate('/loan-requests')}>← Back to List</li>
                                </ul>
                            )}
                            {sideTab === 'info' && (
                                <div style={{ padding: 14, fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>
                                    Fill in the loan request and use <b>Post</b> to submit it to Business Central. The <b>Actions</b> tab has New and Back to List.
                                </div>
                            )}
                            {sideTab === 'reports' && (
                                <div style={{ padding: 14, fontSize: 13, color: 'var(--muted)' }}>Reports for this document will appear here.</div>
                            )}
                            {sideTab === 'shortcuts' && (
                                <ul className="erp-actions-list">
                                    <li>⌨️ Ctrl + S — Save</li>
                                    <li>🖨️ Ctrl + P — Print</li>
                                    <li>⎋ Esc — Close</li>
                                </ul>
                            )}
                            <div className="erp-side-tabs">
                                <span className={sideTab === 'actions' ? 'active' : ''} onClick={() => setSideTab('actions')}>Actions</span>
                                <span className={sideTab === 'info' ? 'active' : ''} onClick={() => setSideTab('info')}>Info</span>
                                <span className={sideTab === 'reports' ? 'active' : ''} onClick={() => setSideTab('reports')}>Reports</span>
                                <span className={sideTab === 'shortcuts' ? 'active' : ''} onClick={() => setSideTab('shortcuts')}>Shortcuts</span>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ApplyLoan;
