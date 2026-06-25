import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { travelRequestApi, employeeInfoApi } from '../services/api';

const today = () => new Date().toISOString().slice(0, 10);

const statusColor = (s) => {
    const v = (s || '').toLowerCase();
    if (v.includes('reject')) return '#ef4444';
    if (v.includes('pending')) return '#f59e0b';
    if (v.includes('approv')) return '#22c55e';
    return undefined;
};

const emptyLine = () => ({
    id: Math.random().toString(36).slice(2),
    earningPayCode: '',
    amount: '',
    unitCount: 1,
    earningDate: today()
});
const initialLines = () => [emptyLine()];

// Strip the "data:<mime>;base64," prefix so BC receives raw base64.
const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

function ApplyTravel() {
    const navigate = useNavigate();

    const [employeeCode, setEmployeeCode] = useState('');
    const [payCodes, setPayCodes] = useState([]);
    const [comments, setComments] = useState('');
    const [lines, setLines] = useState(initialLines());
    const [attachments, setAttachments] = useState([]); // { fileName, mimeType, contentBase64 }
    const [posted, setPosted] = useState(null); // { requestNo, status, totalAmount }
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        employeeInfoApi.getMy()
            .then(({ data }) => setEmployeeCode(data.employeeInfo?.employeeCode || ''))
            .catch(() => {});
        travelRequestApi.earningPayCodes()
            .then(({ data }) => setPayCodes(data.items || []))
            .catch(() => {});
    }, []);

    const onLineChange = (id, field, value) => {
        setLines(lines.map((l) => (l.id === id
            ? { ...l, [field]: (field === 'amount' || field === 'unitCount') ? (value === '' ? '' : Number(value)) : value }
            : l)));
        setError(''); setSuccess('');
    };
    const addLine = () => setLines([...lines, emptyLine()]);
    const removeLine = (id) => setLines(lines.length > 1 ? lines.filter((l) => l.id !== id) : lines);

    const netTotal = useMemo(
        () => lines.reduce((s, l) => s + (Number(l.amount) || 0) * (Number(l.unitCount) || 1), 0),
        [lines]
    );

    const onFiles = async (e) => {
        const files = Array.from(e.target.files || []);
        try {
            const encoded = await Promise.all(files.map(async (f) => ({
                fileName: f.name,
                mimeType: f.type || 'application/octet-stream',
                contentBase64: await readFileAsBase64(f)
            })));
            setAttachments((prev) => [...prev, ...encoded]);
        } catch {
            setError('Failed to read attachment.');
        }
        e.target.value = '';
    };
    const removeAttachment = (i) => setAttachments(attachments.filter((_, idx) => idx !== i));

    const onNew = () => {
        setComments('');
        setLines(initialLines());
        setAttachments([]);
        setPosted(null);
        setError(''); setSuccess('');
    };

    const onPost = async (e) => {
        e?.preventDefault?.();
        setError(''); setSuccess('');
        const valid = lines.filter((l) => l.earningPayCode !== '' && Number(l.amount) > 0);
        if (valid.length === 0) {
            setError('Add at least one line with an Earning Pay Code and a positive Amount.');
            return;
        }
        setSaving(true);
        try {
            const { data } = await travelRequestApi.submit({
                comments,
                lines: valid.map((l) => {
                    const pc = payCodes.find((p) => String(p.finId) === String(l.earningPayCode));
                    return {
                        earningPayCode: Number(l.earningPayCode),
                        earningPayCodeDesc: pc?.description || '',
                        amount: Number(l.amount),
                        unitCount: Number(l.unitCount) || 1,
                        earningDate: l.earningDate
                    };
                }),
                attachments
            });
            setPosted({ requestNo: data.requestNo, status: data.status, totalAmount: data.totalAmount });
            setSuccess(data.message || `Request No: ${data.requestNo} (${data.status}).`);
            setComments('');
            setLines(initialLines());
            setAttachments([]);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to submit travel request');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName="Apply Travel" />
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">Apply Travel <span className="erp-badge">Draft</span></div>
                        <div className="erp-titlebar-actions">
                            <button type="button" className="erp-action-btn" onClick={() => navigate('/travels')}>← Back</button>
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
                                            <input value={posted.status || ''} readOnly className="erp-readonly" style={{ color: statusColor(posted.status), fontWeight: 600 }} />
                                        </div>
                                        <div className="erp-field">
                                            <label>Total Amount</label>
                                            <input value={(Number(posted.totalAmount) || 0).toFixed(2)} readOnly className="erp-readonly" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="erp-section">
                                <div className="erp-section-header">Travel Request</div>
                                <div className="erp-grid">
                                    <div className="erp-field">
                                        <label>Employee Code</label>
                                        <input value={employeeCode} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field erp-field-wide">
                                        <label>Comments</label>
                                        <input value={comments} onChange={(e) => { setComments(e.target.value); setError(''); setSuccess(''); }} placeholder="Purpose of travel / remarks" />
                                    </div>
                                </div>
                            </div>

                            <div className="erp-section">
                                <div className="erp-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Details</span>
                                    <button type="button" onClick={addLine}
                                        style={{ background: 'white', color: '#1e3a8a', border: 'none', borderRadius: 3, padding: '2px 8px', cursor: 'pointer', fontWeight: 700 }}>+</button>
                                </div>
                                <table className="erp-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 30 }}>#</th>
                                            <th>Earning Pay Code</th>
                                            <th style={{ width: 120 }}>Amount</th>
                                            <th style={{ width: 80 }}>Units</th>
                                            <th style={{ width: 150 }}>Date</th>
                                            <th style={{ width: 40 }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lines.map((l, i) => (
                                            <tr key={l.id}>
                                                <td>{i + 1}</td>
                                                <td>
                                                    <select value={l.earningPayCode} onChange={(e) => onLineChange(l.id, 'earningPayCode', e.target.value)}
                                                        style={{ width: '100%', border: 'none', padding: 4 }}>
                                                        <option value="">— Select pay code —</option>
                                                        {payCodes.map((p) => (
                                                            <option key={p._id || p.finId} value={p.finId}>{p.finId} — {p.description}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td>
                                                    <input type="number" value={l.amount} onChange={(e) => onLineChange(l.id, 'amount', e.target.value)}
                                                        style={{ width: '100%', border: 'none', padding: 4, textAlign: 'right' }} min="0" step="0.01" />
                                                </td>
                                                <td>
                                                    <input type="number" value={l.unitCount} onChange={(e) => onLineChange(l.id, 'unitCount', e.target.value)}
                                                        style={{ width: '100%', border: 'none', padding: 4, textAlign: 'right' }} min="1" step="1" />
                                                </td>
                                                <td>
                                                    <input type="date" value={l.earningDate} onChange={(e) => onLineChange(l.id, 'earningDate', e.target.value)}
                                                        style={{ width: '100%', border: 'none', padding: 4 }} />
                                                </td>
                                                <td>
                                                    <button type="button" onClick={() => removeLine(l.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div style={{ padding: 10, textAlign: 'right', background: '#a7f3d0', fontWeight: 600 }}>
                                    Net Total : {netTotal.toFixed(2)}
                                </div>
                            </div>

                            <div className="erp-section">
                                <div className="erp-section-header">Attachments</div>
                                <div style={{ padding: 12 }}>
                                    <input type="file" multiple onChange={onFiles} />
                                    {attachments.length > 0 && (
                                        <ul style={{ marginTop: 10, paddingLeft: 18 }}>
                                            {attachments.map((a, i) => (
                                                <li key={i} style={{ fontSize: 12, marginBottom: 4 }}>
                                                    {a.fileName} <span style={{ color: '#9ca3af' }}>({a.mimeType})</span>
                                                    <button type="button" onClick={() => removeAttachment(i)} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </form>

                        <aside className="erp-actions-panel">
                            <div className="erp-actions-header"><span>Actions</span></div>
                            <ul className="erp-actions-list">
                                <li onClick={onPost}>📤 Post</li>
                                <li onClick={onNew}>📄 New</li>
                                <li onClick={addLine}>➕ Add Line</li>
                                <li onClick={() => navigate('/travels')}>← Back to List</li>
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

export default ApplyTravel;
