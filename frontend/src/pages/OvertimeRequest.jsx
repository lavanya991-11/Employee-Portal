import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { employeeInfoApi, overtimeApi } from '../services/api';

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';
const STATUS_COLOR = { Pending: '#f59e0b', Approved: '#22c55e', Rejected: '#ef4444' };

const emptyLine = (defaults = {}) => ({
    id: Math.random().toString(36).slice(2),
    earningOn: today(),
    employeeCode: defaults.employeeCode || '',
    employeeName: defaults.employeeName || '',
    currency: 'AED',
    fromDate: today(),
    toDate: today(),
    amount: 0,
    normalHours: 1,
    publicHolidays: 0,
    weekend: 0,
    projectRef: '',
    justification: ''
});

function OvertimeRequest() {
    const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
    const [info, setInfo] = useState(null);
    const [sideTab, setSideTab] = useState('actions'); // actions | info | reports | shortcuts

    const txnNumber = useMemo(() => 'PR' + Math.floor(100000 + Math.random() * 900000), []);
    const glDocNo = useMemo(() => 'PVN' + String(Math.floor(1000 + Math.random() * 9000)), []);

    const [form, setForm] = useState({
        transactionNumber: txnNumber,
        transactionDate: today(),
        type: 'Over Time',
        payCode: 8,
        payCodeDescription: 'OverTime',
        description: 'OverTime',
        createdBy: (user.name || 'Employee').toUpperCase(),
        glDocumentNo: glDocNo
    });

    const [lines, setLines] = useState([emptyLine()]);
    const [overtimes, setOvertimes] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        employeeInfoApi.getMy().then(({ data }) => {
            const i = data.employeeInfo || null;
            setInfo(i);
            if (i) {
                setLines((curr) => curr.map((l, idx) => idx === 0 ? {
                    ...l,
                    employeeCode: i.employeeCode || user.empId || '',
                    employeeName: `${i.firstName || ''} ${i.lastName || ''}`.trim() || user.name || ''
                } : l));
            }
        }).catch(() => {});
        load();
    }, []);

    const load = async () => {
        try {
            const { data } = await overtimeApi.myOvertimes();
            setOvertimes(data.overtimes || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load overtimes');
        }
    };

    const onChange = (e) => {
        const { name, value, type } = e.target;
        setForm({ ...form, [name]: type === 'number' ? Number(value) : value });
        setError(''); setSuccess('');
    };

    const onLineChange = (id, field, value) => {
        setLines(lines.map((l) => (l.id === id ? {
            ...l,
            [field]: ['amount', 'normalHours', 'publicHolidays', 'weekend'].includes(field) ? Number(value) : value
        } : l)));
    };
    const addLine = () => setLines([...lines, emptyLine({
        employeeCode: info?.employeeCode || user.empId || '',
        employeeName: `${info?.firstName || ''} ${info?.lastName || ''}`.trim() || user.name || ''
    })]);
    const removeLine = (id) => setLines(lines.length > 1 ? lines.filter((l) => l.id !== id) : lines);

    const totalAmount = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
    const totalHours = lines.reduce((s, l) => s + (Number(l.normalHours) || 0) + (Number(l.publicHolidays) || 0) + (Number(l.weekend) || 0), 0);

    const onCalculate = () => {
        // Simple rule: amount = (normal hours * 25) + (public holidays * 50) + (weekend * 40)
        setLines(lines.map((l) => ({
            ...l,
            amount: Number(l.normalHours || 0) * 25 + Number(l.publicHolidays || 0) * 50 + Number(l.weekend || 0) * 40
        })));
        setSuccess('Amounts recalculated.');
    };

    const onSubmit = async (e) => {
        e?.preventDefault?.();
        setError(''); setSuccess('');
        const valid = lines.filter((l) => (Number(l.normalHours) + Number(l.publicHolidays) + Number(l.weekend)) > 0);
        if (valid.length === 0) {
            setError('Enter at least one line with hours > 0.');
            return;
        }
        setSaving(true);
        try {
            await Promise.all(
                valid.map((l) => {
                    const hours = Number(l.normalHours) + Number(l.publicHolidays) + Number(l.weekend);
                    const justification = [
                        l.justification,
                        `Txn: ${form.transactionNumber}`,
                        `Pay Code: ${form.payCode} (${form.payCodeDescription})`,
                        `Amount: ${l.amount} ${l.currency}`,
                        `Public Holidays: ${l.publicHolidays}h`,
                        `Weekend: ${l.weekend}h`
                    ].filter(Boolean).join(' | ');
                    return overtimeApi.apply({
                        date: l.earningOn,
                        hoursRequested: hours,
                        projectRef: l.projectRef,
                        justification
                    });
                })
            );
            setSuccess(`Submitted ${valid.length} overtime line(s).`);
            setLines([emptyLine({
                employeeCode: info?.employeeCode || user.empId || '',
                employeeName: `${info?.firstName || ''} ${info?.lastName || ''}`.trim() || user.name || ''
            })]);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit');
        } finally {
            setSaving(false);
        }
    };

    const onNew = () => {
        setForm({
            transactionNumber: 'PR' + Math.floor(100000 + Math.random() * 900000),
            transactionDate: today(), type: 'Over Time', payCode: 8,
            payCodeDescription: 'OverTime', description: 'OverTime',
            createdBy: (user.name || 'Employee').toUpperCase(),
            glDocumentNo: 'PVN' + String(Math.floor(1000 + Math.random() * 9000))
        });
        setLines([emptyLine({
            employeeCode: info?.employeeCode || user.empId || '',
            employeeName: `${info?.firstName || ''} ${info?.lastName || ''}`.trim() || user.name || ''
        })]);
        setError(''); setSuccess('');
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName="Time off Request" />
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div>
                            <div style={{ fontSize: 13, color: '#6b7280' }}>OverTime Transactions</div>
                            <div className="erp-title" style={{ fontSize: 26 }}>{form.transactionNumber}</div>
                        </div>
                        <div className="erp-titlebar-actions">
                            <button type="button" className="erp-action-btn" onClick={onNew}>📄 New</button>
                            <button type="button" className="erp-action-btn" onClick={onCalculate}>🧮 Calculate</button>
                            <button type="button" className="erp-action-btn" onClick={load}>🔄 Refresh</button>
                            <button type="button" className="erp-action-btn" onClick={onSubmit} disabled={saving}>
                                {saving ? 'Posting…' : '📤 Post'}
                            </button>
                            <button type="button" className="erp-action-btn" onClick={() => window.print()}>🖨️ Print</button>
                        </div>
                    </div>

                    <div className="erp-body">
                        <form className="erp-form" onSubmit={onSubmit}>
                            {error && <div className="error">{error}</div>}
                            {success && <div className="success">{success}</div>}

                            <div className="erp-section">
                                <div className="erp-section-header">OVERTIME TRANSACTIONS</div>
                                <div className="erp-grid">
                                    <div className="erp-field">
                                        <label>Transaction Number</label>
                                        <input value={form.transactionNumber} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Transaction Date</label>
                                        <input type="date" name="transactionDate" value={form.transactionDate} onChange={onChange} />
                                    </div>
                                    <div className="erp-field">
                                        <label>Type</label>
                                        <input value={form.type} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Description</label>
                                        <input name="description" value={form.description} onChange={onChange} />
                                    </div>
                                    <div className="erp-field">
                                        <label>Pay Code</label>
                                        <input type="number" name="payCode" value={form.payCode} onChange={onChange} />
                                    </div>
                                    <div className="erp-field">
                                        <label>Pay Code Description</label>
                                        <input name="payCodeDescription" value={form.payCodeDescription} onChange={onChange} />
                                    </div>
                                    <div className="erp-field">
                                        <label>Created By</label>
                                        <input value={form.createdBy} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field">
                                        <label>GL Document No.</label>
                                        <input value={form.glDocumentNo} readOnly className="erp-readonly" />
                                    </div>
                                </div>
                            </div>

                            <div className="erp-section">
                                <div className="erp-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Lines</span>
                                    <span style={{ display: 'flex', gap: 6 }}>
                                        <button type="button" onClick={addLine}
                                            style={{ background: 'white', color: '#1e3a8a', border: 'none', borderRadius: 3, padding: '2px 10px', cursor: 'pointer', fontWeight: 700 }}>+ New Line</button>
                                    </span>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="erp-table">
                                        <thead>
                                            <tr>
                                                <th>Earning On Date</th>
                                                <th>Employee Code</th>
                                                <th>Employee Name</th>
                                                <th>Currency</th>
                                                <th>From Date</th>
                                                <th>To Date</th>
                                                <th style={{ textAlign: 'right' }}>Amount</th>
                                                <th style={{ textAlign: 'right' }}>Normal Hours</th>
                                                <th style={{ textAlign: 'right' }}>Public Holidays</th>
                                                <th style={{ textAlign: 'right' }}>Weekend</th>
                                                <th>Project</th>
                                                <th>Justification</th>
                                                <th style={{ width: 30 }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lines.map((l) => (
                                                <tr key={l.id}>
                                                    <td><input type="date" value={l.earningOn} onChange={(e) => onLineChange(l.id, 'earningOn', e.target.value)} style={{ border: 'none', padding: 4 }} /></td>
                                                    <td><input value={l.employeeCode} onChange={(e) => onLineChange(l.id, 'employeeCode', e.target.value)} style={{ width: 80, border: 'none', padding: 4 }} /></td>
                                                    <td><input value={l.employeeName} onChange={(e) => onLineChange(l.id, 'employeeName', e.target.value)} style={{ width: 130, border: 'none', padding: 4 }} /></td>
                                                    <td>
                                                        <select value={l.currency} onChange={(e) => onLineChange(l.id, 'currency', e.target.value)} style={{ border: 'none', padding: 4 }}>
                                                            <option>AED</option><option>USD</option><option>INR</option><option>EUR</option>
                                                        </select>
                                                    </td>
                                                    <td><input type="date" value={l.fromDate} onChange={(e) => onLineChange(l.id, 'fromDate', e.target.value)} style={{ border: 'none', padding: 4 }} /></td>
                                                    <td><input type="date" value={l.toDate} onChange={(e) => onLineChange(l.id, 'toDate', e.target.value)} style={{ border: 'none', padding: 4 }} /></td>
                                                    <td><input type="number" value={l.amount} onChange={(e) => onLineChange(l.id, 'amount', e.target.value)} step="0.01" style={{ width: 80, border: 'none', padding: 4, textAlign: 'right' }} /></td>
                                                    <td><input type="number" value={l.normalHours} onChange={(e) => onLineChange(l.id, 'normalHours', e.target.value)} step="0.25" style={{ width: 60, border: 'none', padding: 4, textAlign: 'right' }} /></td>
                                                    <td><input type="number" value={l.publicHolidays} onChange={(e) => onLineChange(l.id, 'publicHolidays', e.target.value)} step="0.25" style={{ width: 60, border: 'none', padding: 4, textAlign: 'right' }} /></td>
                                                    <td><input type="number" value={l.weekend} onChange={(e) => onLineChange(l.id, 'weekend', e.target.value)} step="0.25" style={{ width: 60, border: 'none', padding: 4, textAlign: 'right' }} /></td>
                                                    <td><input value={l.projectRef} onChange={(e) => onLineChange(l.id, 'projectRef', e.target.value)} placeholder="task/proj" style={{ width: 90, border: 'none', padding: 4 }} /></td>
                                                    <td><input value={l.justification} onChange={(e) => onLineChange(l.id, 'justification', e.target.value)} style={{ width: 130, border: 'none', padding: 4 }} /></td>
                                                    <td><button type="button" onClick={() => removeLine(l.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div style={{ padding: 10, textAlign: 'right', background: '#a7f3d0', fontWeight: 600 }}>
                                    Total Hours : {totalHours} · Total Amount : {totalAmount.toFixed(2)}
                                </div>
                            </div>

                            <div className="erp-list-card">
                                <div style={{ padding: 10, fontWeight: 600, borderBottom: '1px solid #e5e7eb', color: '#1e3a8a' }}>
                                    My Overtime Requests
                                </div>
                                {overtimes.length === 0 && <p style={{ padding: 12, color: '#888' }}>No overtime requests yet.</p>}
                                {overtimes.length > 0 && (
                                    <table className="erp-table">
                                        <thead><tr><th>Date</th><th>Hours</th><th>Project</th><th>Justification</th><th>Status</th></tr></thead>
                                        <tbody>
                                            {overtimes.map((o) => (
                                                <tr key={o._id}>
                                                    <td>{fmtDate(o.date)}</td>
                                                    <td>{o.hoursRequested}</td>
                                                    <td>{o.projectRef || '—'}</td>
                                                    <td style={{ fontSize: 11 }}>{o.justification}</td>
                                                    <td><span style={{ color: STATUS_COLOR[o.status], fontWeight: 600 }}>{o.status}</span></td>
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
                                    <li onClick={onCalculate}>🧮 Calculate</li>
                                    <li onClick={addLine}>➕ New Line</li>
                                    <li onClick={() => window.print()}>🖨️ Print</li>
                                    <li onClick={load}>🔄 Refresh</li>
                                </ul>
                            )}
                            {sideTab === 'info' && (
                                <div style={{ padding: 14, fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>
                                    Add overtime lines and use <b>Calculate</b>, then submit to post to Business Central. The <b>Actions</b> tab has Print and Refresh.
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

export default OvertimeRequest;
