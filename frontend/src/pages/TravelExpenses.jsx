import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { employeeInfoApi, expenseApi, travelApi } from '../services/api';

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';
const STATUS_COLOR = { Pending: '#f59e0b', Approved: '#22c55e', Rejected: '#ef4444' };

const CLAIM_TYPES = ['Lodging', 'Meals', 'Local Transport', 'Air Fare', 'Train/Bus', 'Telecom', 'Miscellaneous'];

const emptyItem = () => ({
    id: Math.random().toString(36).slice(2),
    claimType: '',
    amount: 0,
    attachment: '',
    remarks: '',
    refNo: ''
});

const initialItems = () => Array.from({ length: 5 }, () => emptyItem());

function TravelExpenses() {
    const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
    const [info, setInfo] = useState(null);
    const [myTravels, setMyTravels] = useState([]);

    const [form, setForm] = useState({
        docDate: today(),
        docSeries: 'FDM/24',
        docNumber: 1,
        narration: '',
        clientName: '',
        travelType: 'Domestic',
        purpose: 'Business Meeting',
        travelDesk: '',
        isBillable: 'YES',
        estimatedExpenses: 0,
        travelRef: ''
    });
    const [items, setItems] = useState(initialItems());
    const [expenses, setExpenses] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        employeeInfoApi.getMy().then(({ data }) => setInfo(data.employeeInfo || null)).catch(() => {});
        travelApi.myTravels().then(({ data }) => setMyTravels(data.travels || [])).catch(() => {});
        load();
    }, []);

    const load = async () => {
        try {
            const { data } = await expenseApi.myExpenses('Travel');
            setExpenses(data.expenses || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load expenses');
        }
    };

    const adm = info?.administration || {};

    const onChange = (e) => {
        const { name, value, type } = e.target;
        setForm({ ...form, [name]: type === 'number' ? Number(value) : value });
        setError(''); setSuccess('');
    };

    const onItemChange = (id, field, value) => {
        setItems(items.map((it) => (it.id === id ? { ...it, [field]: field === 'amount' ? Number(value) : value } : it)));
    };
    const addItem = () => setItems([...items, emptyItem()]);
    const removeItem = (id) => setItems(items.length > 1 ? items.filter((it) => it.id !== id) : items);

    const netTotal = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);

    const onSubmit = async (e) => {
        e?.preventDefault?.();
        setError(''); setSuccess('');
        const valid = items.filter((it) => it.claimType && Number(it.amount) > 0);
        if (valid.length === 0) {
            setError('Add at least one expense item with Claim Type and Amount.');
            return;
        }
        setSaving(true);
        try {
            const baseRemarks = [
                form.narration && `Narration: ${form.narration}`,
                form.clientName && `Client: ${form.clientName}`,
                form.travelType && `Type: ${form.travelType}`,
                form.purpose && `Purpose: ${form.purpose}`,
                form.travelDesk && `Desk: ${form.travelDesk}`,
                form.isBillable && `Billable: ${form.isBillable}`,
                form.estimatedExpenses && `Est: ${form.estimatedExpenses}`
            ].filter(Boolean).join(' | ');
            await Promise.all(
                valid.map((it) => expenseApi.apply({
                    expenseType: 'Travel',
                    claimType: it.claimType,
                    amount: Number(it.amount),
                    attachment: it.attachment,
                    remarks: [
                        it.remarks,
                        it.refNo && `RefNO: ${it.refNo}`,
                        baseRemarks
                    ].filter(Boolean).join(' || '),
                    travelRef: form.travelRef || undefined
                }))
            );
            setSuccess(`Submitted ${valid.length} expense item(s).`);
            setItems([emptyItem()]);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit');
        } finally {
            setSaving(false);
        }
    };

    const onNew = () => {
        setForm({
            docDate: today(), docSeries: 'FDM/24', docNumber: 1, narration: '',
            clientName: '', travelType: 'Domestic', purpose: 'Business Meeting',
            travelDesk: '', isBillable: 'YES', estimatedExpenses: 0, travelRef: ''
        });
        setItems(initialItems());
        setError(''); setSuccess('');
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName="Travel Expenses" />
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">Travel Expenses <span className="erp-badge">Draft</span></div>
                        <div className="erp-titlebar-actions">
                            <button type="button" className="erp-action-btn" onClick={onNew}>📄 New</button>
                            <button type="button" className="erp-action-btn" onClick={onSubmit} disabled={saving}>
                                {saving ? 'Posting…' : '📤 Post'}
                            </button>
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
                                        <label>Employee *</label>
                                        <div className="erp-emp-split">
                                            <input value={info?.employeeCode || user.empId || ''} readOnly className="erp-readonly erp-emp-code" />
                                            <input value={`${info?.firstName || ''}${info?.lastName ? '.' + info.lastName.charAt(0) : ''}` || user.name || ''}
                                                readOnly className="erp-readonly" />
                                        </div>
                                    </div>
                                    <div className="erp-field">
                                        <label>Emp. Reporting Manager</label>
                                        <input value={info?.reportingManager || ''} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Emp. Location</label>
                                        <input value={adm.location || adm.city || ''} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Emp. Department</label>
                                        <input value={info?.department || user.department || ''} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Emp. Designation</label>
                                        <input value={info?.designation || info?.jobTitle || user.designation || ''} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Client Name *</label>
                                        <select name="clientName" value={form.clientName} onChange={onChange}
                                            className={form.clientName ? '' : 'erp-required'}>
                                            <option value="">— Select —</option>
                                            <option>Internal</option>
                                            <option>Client A</option>
                                            <option>Client B</option>
                                            <option>External</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div className="erp-field">
                                        <label>Travel Type *</label>
                                        <select name="travelType" value={form.travelType} onChange={onChange}>
                                            <option>Domestic</option>
                                            <option>International</option>
                                        </select>
                                    </div>
                                    <div className="erp-field">
                                        <label>Purpose of Travel *</label>
                                        <select name="purpose" value={form.purpose} onChange={onChange}>
                                            <option>Business Meeting</option>
                                            <option>Client Visit</option>
                                            <option>Training</option>
                                            <option>Conference</option>
                                            <option>Site Inspection</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div className="erp-field">
                                        <label>Travel Desk</label>
                                        <select name="travelDesk" value={form.travelDesk} onChange={onChange}>
                                            <option value="">— Select —</option>
                                            <option>Self Booked</option>
                                            <option>Travel Agent A</option>
                                            <option>Travel Agent B</option>
                                            <option>Corporate Travel</option>
                                        </select>
                                    </div>
                                    <div className="erp-field">
                                        <label>Is Billable *</label>
                                        <select name="isBillable" value={form.isBillable} onChange={onChange}>
                                            <option>YES</option>
                                            <option>NO</option>
                                        </select>
                                    </div>
                                    <div className="erp-field">
                                        <label>Estimated Travel Expenses</label>
                                        <input type="number" name="estimatedExpenses" value={form.estimatedExpenses} onChange={onChange} min="0" step="0.01" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Travel Reference (optional)</label>
                                        <select name="travelRef" value={form.travelRef} onChange={onChange}>
                                            <option value="">— None —</option>
                                            {myTravels.map((t) => (
                                                <option key={t._id} value={t._id}>
                                                    {t.travelType} · {t.fromLocation} → {t.toLocation} · {fmtDate(t.fromDate)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="erp-section">
                                <div className="erp-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Details</span>
                                    <span style={{ display: 'flex', gap: 6 }}>
                                        <button type="button" onClick={addItem} title="Add row"
                                            style={{ background: 'white', color: '#1e3a8a', border: 'none', borderRadius: 3, padding: '2px 8px', cursor: 'pointer', fontWeight: 700 }}>+</button>
                                        <button type="button" title="Expand" disabled
                                            style={{ background: 'white', color: '#1e3a8a', border: 'none', borderRadius: 3, padding: '2px 8px' }}>⛶</button>
                                    </span>
                                </div>
                                <table className="erp-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 30 }}>#</th>
                                            <th>Claim Type</th>
                                            <th style={{ width: 100 }}>Amount</th>
                                            <th>Attachment</th>
                                            <th>Remarks</th>
                                            <th style={{ width: 120 }}>RefNO</th>
                                            <th style={{ width: 40 }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((it, i) => (
                                            <tr key={it.id}>
                                                <td>{i + 1}</td>
                                                <td>
                                                    <select value={it.claimType} onChange={(e) => onItemChange(it.id, 'claimType', e.target.value)}
                                                        style={{ width: '100%', border: 'none', padding: 4 }}>
                                                        <option value="">— Select —</option>
                                                        {CLAIM_TYPES.map((c) => <option key={c}>{c}</option>)}
                                                    </select>
                                                </td>
                                                <td>
                                                    <input type="number" value={it.amount} onChange={(e) => onItemChange(it.id, 'amount', e.target.value)}
                                                        style={{ width: '100%', border: 'none', padding: 4, textAlign: 'right' }} min="0" step="0.01" />
                                                </td>
                                                <td>
                                                    <input value={it.attachment} onChange={(e) => onItemChange(it.id, 'attachment', e.target.value)}
                                                        placeholder="URL / file ref"
                                                        style={{ width: '100%', border: 'none', padding: 4 }} />
                                                </td>
                                                <td>
                                                    <input value={it.remarks} onChange={(e) => onItemChange(it.id, 'remarks', e.target.value)}
                                                        style={{ width: '100%', border: 'none', padding: 4 }} />
                                                </td>
                                                <td>
                                                    <input value={it.refNo} onChange={(e) => onItemChange(it.id, 'refNo', e.target.value)}
                                                        placeholder="REF-…"
                                                        style={{ width: '100%', border: 'none', padding: 4 }} />
                                                </td>
                                                <td>
                                                    <button type="button" onClick={() => removeItem(it.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div style={{ padding: 10, textAlign: 'right', background: '#a7f3d0', fontWeight: 600 }}>
                                    Net Total : {netTotal.toFixed(2)}
                                </div>
                            </div>

                            <div className="erp-list-card">
                                <div style={{ padding: 10, fontWeight: 600, borderBottom: '1px solid #e5e7eb', color: '#1e3a8a' }}>
                                    My Travel Expenses
                                </div>
                                {expenses.length === 0 && <p style={{ padding: 12, color: '#888' }}>No travel expense claims yet.</p>}
                                {expenses.length > 0 && (
                                    <table className="erp-table">
                                        <thead>
                                            <tr><th>Date</th><th>Claim Type</th><th>Amount</th><th>Remarks</th><th>Status</th></tr>
                                        </thead>
                                        <tbody>
                                            {expenses.map((e) => (
                                                <tr key={e._id}>
                                                    <td>{fmtDate(e.createdAt)}</td>
                                                    <td>{e.claimType}</td>
                                                    <td>{Number(e.amount).toFixed(2)}</td>
                                                    <td style={{ fontSize: 11 }}>{e.remarks}</td>
                                                    <td><span style={{ color: STATUS_COLOR[e.status], fontWeight: 600 }}>{e.status}</span></td>
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
                                <li onClick={addItem}>➕ Add Item</li>
                                <li onClick={load}>🔄 Refresh</li>
                            </ul>
                            <div className="erp-side-tabs">
                                <span>Actions</span><span>Info</span><span>Reports</span><span>ShortCut</span><span>Link</span>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default TravelExpenses;
