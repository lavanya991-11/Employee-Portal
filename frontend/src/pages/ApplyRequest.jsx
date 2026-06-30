import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import ActionButton from '../components/ActionButton';
import PageHeader from '../components/PageHeader';
import { assetApi } from '../services/api';

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';
const STATUS_COLOR = { Pending: '#f59e0b', Approved: '#22c55e', Rejected: '#ef4444' };

const emptyRow = () => ({ id: Math.random().toString(36).slice(2), assetCode: '', assetName: '', remarks: '' });

function ApplyRequest() {
    const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);

    const [form, setForm] = useState({
        docDate: today(),
        docSeries: 'FDM/24',
        docNumber: 1,
        narration: '',
        employee: user.name || ''
    });
    const [rows, setRows] = useState([emptyRow()]);
    const [sideTab, setSideTab] = useState('actions'); // actions | info | reports | shortcuts
    const [assets, setAssets] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const { data } = await assetApi.myAssets();
            setAssets(data.assets || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load requests');
        }
    };

    const onChange = (e) => {
        const { name, value, type } = e.target;
        setForm({ ...form, [name]: type === 'number' ? Number(value) : value });
        setError(''); setSuccess('');
    };

    const onRowChange = (id, field, value) => {
        setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    };

    const addRow = () => setRows([...rows, emptyRow()]);
    const removeRow = (id) => setRows(rows.length > 1 ? rows.filter((r) => r.id !== id) : rows);

    const netTotal = rows.filter((r) => r.assetCode && r.assetName).length;

    const onSubmit = async (e) => {
        e?.preventDefault?.();
        setError(''); setSuccess('');
        const valid = rows.filter((r) => r.assetCode && r.assetName);
        if (valid.length === 0) {
            setError('Add at least one row with Asset Code and Asset Name.');
            return;
        }
        setSaving(true);
        try {
            await Promise.all(
                valid.map((r) => assetApi.apply({
                    assetCode: r.assetCode,
                    assetName: r.assetName,
                    remarks: r.remarks || form.narration
                }))
            );
            setSuccess(`Submitted ${valid.length} request(s).`);
            setRows([emptyRow()]);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit');
        } finally {
            setSaving(false);
        }
    };

    const onNew = () => {
        setForm({ docDate: today(), docSeries: 'FDM/24', docNumber: 1, narration: '', employee: user.name || '' });
        setRows([emptyRow()]);
        setError(''); setSuccess('');
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName="Apply Request" />
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">Apply Request <span className="erp-badge">Draft</span></div>
                        <div className="erp-titlebar-actions">
                            <ActionButton kind="add" tint="primary" onClick={onNew}>New</ActionButton>
                            <ActionButton kind="send" onClick={onSubmit} disabled={saving}>
                                {saving ? 'Posting…' : 'Post'}
                            </ActionButton>
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
                                        <label>Doc Date *</label>
                                        <input type="date" name="docDate" value={form.docDate} onChange={onChange} />
                                    </div>
                                    <div className="erp-field">
                                        <label>Doc No *</label>
                                        <div className="erp-docno">
                                            <input value={form.docSeries} readOnly className="erp-readonly" style={{ width: 80 }} />
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
                                        <input value={form.employee} readOnly className="erp-readonly" />
                                    </div>
                                </div>
                            </div>

                            <div className="erp-section">
                                <div className="erp-section-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Details</span>
                                    <button type="button" onClick={addRow}
                                        style={{ background: 'white', color: '#1e3a8a', border: 'none', borderRadius: 3, padding: '2px 10px', cursor: 'pointer', fontWeight: 700 }}>
                                        + Add Row
                                    </button>
                                </div>
                                <table className="erp-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 30 }}>#</th>
                                            <th>Asset Code</th>
                                            <th>Asset Name</th>
                                            <th>Remarks</th>
                                            <th style={{ width: 50 }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((r, i) => (
                                            <tr key={r.id}>
                                                <td>{i + 1}</td>
                                                <td><input value={r.assetCode} onChange={(e) => onRowChange(r.id, 'assetCode', e.target.value)} style={{ width: '100%', border: 'none', padding: 4 }} /></td>
                                                <td><input value={r.assetName} onChange={(e) => onRowChange(r.id, 'assetName', e.target.value)} style={{ width: '100%', border: 'none', padding: 4 }} /></td>
                                                <td><input value={r.remarks} onChange={(e) => onRowChange(r.id, 'remarks', e.target.value)} style={{ width: '100%', border: 'none', padding: 4 }} /></td>
                                                <td>
                                                    <button type="button" onClick={() => removeRow(r.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div style={{ padding: 10, textAlign: 'right', background: '#a7f3d0', fontWeight: 600 }}>
                                    Net Total : {netTotal}
                                </div>
                            </div>

                            <div className="erp-list-card">
                                <div style={{ padding: 10, fontWeight: 600, borderBottom: '1px solid #e5e7eb', color: '#1e3a8a' }}>
                                    My Asset Requests
                                </div>
                                {assets.length === 0 && <p style={{ padding: 12, color: '#888' }}>No asset requests yet.</p>}
                                {assets.length > 0 && (
                                    <table className="erp-table">
                                        <thead>
                                            <tr><th>Doc Date</th><th>Asset Code</th><th>Asset Name</th><th>Remarks</th><th>Status</th></tr>
                                        </thead>
                                        <tbody>
                                            {assets.map((a) => (
                                                <tr key={a._id}>
                                                    <td>{fmtDate(a.createdAt)}</td>
                                                    <td>{a.assetCode}</td>
                                                    <td>{a.assetName}</td>
                                                    <td>{a.remarks}</td>
                                                    <td><span style={{ color: STATUS_COLOR[a.status], fontWeight: 600 }}>{a.status}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </form>

                        <aside className="erp-actions-panel">
                            <div className="erp-actions-header"><span>{{ actions: 'Actions', info: 'Info', reports: 'Reports', shortcuts: 'Shortcuts' }[sideTab]}</span></div>
                            {sideTab === 'actions' && (
                                <ul className="erp-actions-list">
                                    <li onClick={() => window.print()}>🖨️ Print</li>
                                    <li onClick={addRow}>➕ Add Row</li>
                                    <li onClick={load}>🔄 Refresh</li>
                                </ul>
                            )}
                            {sideTab === 'info' && (
                                <div style={{ padding: 14, fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>
                                    Fill in the request and submit it for approval. The <b>Actions</b> tab has Print, Add Row and Refresh.
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

export default ApplyRequest;
