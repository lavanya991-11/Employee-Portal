import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { employeeInfoApi, travelApi } from '../services/api';

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';
const STATUS_COLOR = { Pending: '#f59e0b', Approved: '#22c55e', Rejected: '#ef4444' };

const emptyLeg = () => ({
    id: Math.random().toString(36).slice(2),
    fromDate: today(),
    toDate: today(),
    modeOfTravel: 'Flight',
    fromLocation: '',
    toLocation: ''
});

function TravelRequest() {
    const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
    const [info, setInfo] = useState(null);

    const [tab, setTab] = useState('General');
    const [form, setForm] = useState({
        travelType: 'Domestic',
        purpose: 'Business Meeting',
        isBillable: 'YES',
        estimatedExpenses: 0,
        extraNotes: ''
    });
    const [legs, setLegs] = useState([emptyLeg()]);
    const [travels, setTravels] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    const [showAddTravel, setShowAddTravel] = useState(false);
    const [newLegMode, setNewLegMode] = useState('');
    const [newLegLocation, setNewLegLocation] = useState('');

    useEffect(() => {
        employeeInfoApi.getMy().then(({ data }) => setInfo(data.employeeInfo || null)).catch(() => {});
        load();
    }, []);

    const load = async () => {
        try {
            const { data } = await travelApi.myTravels();
            setTravels(data.travels || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load');
        }
    };

    const adm = info?.administration || {};

    const onChange = (e) => {
        const { name, value, type } = e.target;
        setForm({ ...form, [name]: type === 'number' ? Number(value) : value });
        setError(''); setSuccess('');
    };

    const onLegChange = (id, field, value) => {
        setLegs(legs.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
    };
    const removeLeg = (id) => setLegs(legs.length > 1 ? legs.filter((l) => l.id !== id) : legs);

    const openAddTravel = () => {
        setNewLegMode('');
        setNewLegLocation(adm.location || adm.city || '');
        setShowAddTravel(true);
    };

    const confirmAddTravel = () => {
        if (!newLegMode) { setError('Pick a Mode of Travel first.'); return; }
        const fresh = {
            ...emptyLeg(),
            modeOfTravel: newLegMode,
            fromLocation: newLegLocation || ''
        };
        // If the table has only an empty default row, replace it; else append.
        const onlyEmpty = legs.length === 1 && !legs[0].fromLocation && !legs[0].toLocation;
        setLegs(onlyEmpty ? [fresh] : [...legs, fresh]);
        setShowAddTravel(false);
        setError('');
    };

    const totalLegs = legs.filter((l) => l.fromLocation && l.toLocation).length;

    const onSubmit = async (e) => {
        e?.preventDefault?.();
        setError(''); setSuccess('');
        const valid = legs.filter((l) => l.fromLocation && l.toLocation && l.fromDate && l.toDate);
        if (valid.length === 0) {
            setError('Add at least one travel leg with From Location, To Location and dates.');
            return;
        }
        setSaving(true);
        try {
            await Promise.all(
                valid.map((l) => travelApi.apply({
                    travelType: form.travelType,
                    purpose: form.purpose,
                    fromDate: l.fromDate,
                    toDate: l.toDate,
                    modeOfTravel: l.modeOfTravel,
                    fromLocation: l.fromLocation,
                    toLocation: l.toLocation,
                    estimatedCost: Number(form.estimatedExpenses) || 0
                }))
            );
            setSuccess(`Submitted ${valid.length} travel leg(s).`);
            setLegs([emptyLeg()]);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit');
        } finally {
            setSaving(false);
        }
    };

    const onNew = () => {
        setForm({ travelType: 'Domestic', purpose: 'Business Meeting', isBillable: 'YES', estimatedExpenses: 0, extraNotes: '' });
        setLegs([emptyLeg()]);
        setError(''); setSuccess('');
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">Travel Request <span className="erp-badge">Draft</span></div>
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
                                <div className="erp-section-header erp-tabs-header">
                                    <span
                                        className={tab === 'General' ? 'erp-tab erp-tab-active' : 'erp-tab'}
                                        onClick={() => setTab('General')}
                                    >General</span>
                                    <span
                                        className={tab === 'Extra' ? 'erp-tab erp-tab-active' : 'erp-tab'}
                                        onClick={() => setTab('Extra')}
                                    >Extra Fields</span>
                                </div>

                                {tab === 'General' && (
                                    <div className="erp-grid">
                                        <div className="erp-field">
                                            <label>Employee *</label>
                                            <input value={`${info?.employeeCode || user.empId || ''} - ${info?.firstName || user.name || ''}`.trim().replace(/^- /, '')}
                                                readOnly className="erp-required-display" />
                                        </div>
                                        <div className="erp-field">
                                            <label>Emp. Reporting Manager</label>
                                            <input value={info?.reportingManager || ''} readOnly className="erp-required-display" />
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
                                            <input value={info?.designation || info?.jobTitle || user.designation || ''} readOnly className="erp-required-display" />
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
                                    </div>
                                )}

                                {tab === 'Extra' && (
                                    <div className="erp-grid">
                                        <div className="erp-field erp-field-wide">
                                            <label>Extra Notes</label>
                                            <input name="extraNotes" value={form.extraNotes} onChange={onChange} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="erp-section">
                                <div className="erp-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Travel Details</span>
                                    <span style={{ display: 'flex', gap: 6 }}>
                                        <button type="button" onClick={openAddTravel} title="Add Travel"
                                            style={{ background: 'white', color: '#1e3a8a', border: 'none', borderRadius: 3, padding: '2px 8px', cursor: 'pointer', fontWeight: 700 }}>+</button>
                                        <button type="button" title="Grid" disabled
                                            style={{ background: 'white', color: '#1e3a8a', border: 'none', borderRadius: 3, padding: '2px 8px' }}>▦</button>
                                        <button type="button" title="Expand" disabled
                                            style={{ background: 'white', color: '#1e3a8a', border: 'none', borderRadius: 3, padding: '2px 8px' }}>⛶</button>
                                    </span>
                                </div>
                                <table className="erp-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 30 }}>#</th>
                                            <th>From Date</th>
                                            <th>To Date</th>
                                            <th>Mode</th>
                                            <th>From Location</th>
                                            <th>To Location</th>
                                            <th style={{ width: 50 }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {legs.map((l, i) => (
                                            <tr key={l.id}>
                                                <td>{i + 1}</td>
                                                <td><input type="date" value={l.fromDate} onChange={(e) => onLegChange(l.id, 'fromDate', e.target.value)} style={{ width: '100%', border: 'none', padding: 4 }} /></td>
                                                <td><input type="date" value={l.toDate} onChange={(e) => onLegChange(l.id, 'toDate', e.target.value)} style={{ width: '100%', border: 'none', padding: 4 }} /></td>
                                                <td>
                                                    <select value={l.modeOfTravel} onChange={(e) => onLegChange(l.id, 'modeOfTravel', e.target.value)} style={{ width: '100%', border: 'none', padding: 4 }}>
                                                        <option>Flight</option>
                                                        <option>Train</option>
                                                        <option>Bus</option>
                                                        <option>Car</option>
                                                        <option>Other</option>
                                                    </select>
                                                </td>
                                                <td><input value={l.fromLocation} onChange={(e) => onLegChange(l.id, 'fromLocation', e.target.value)} style={{ width: '100%', border: 'none', padding: 4 }} /></td>
                                                <td><input value={l.toLocation} onChange={(e) => onLegChange(l.id, 'toLocation', e.target.value)} style={{ width: '100%', border: 'none', padding: 4 }} /></td>
                                                <td>
                                                    <button type="button" onClick={() => removeLeg(l.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div style={{ padding: 10, textAlign: 'right', background: '#a7f3d0', fontWeight: 600 }}>
                                    Net Total : {totalLegs}
                                </div>
                            </div>

                            <div className="erp-list-card">
                                <div style={{ padding: 10, fontWeight: 600, borderBottom: '1px solid #e5e7eb', color: '#1e3a8a' }}>
                                    My Travel Requests
                                </div>
                                {travels.length === 0 && <p style={{ padding: 12, color: '#888' }}>No travel requests yet.</p>}
                                {travels.length > 0 && (
                                    <table className="erp-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th><th>Type</th><th>Purpose</th><th>Mode</th>
                                                <th>From → To</th><th>Cost</th><th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {travels.map((t) => (
                                                <tr key={t._id}>
                                                    <td>{fmtDate(t.createdAt)}</td>
                                                    <td>{t.travelType}</td>
                                                    <td>{t.purpose}</td>
                                                    <td>{t.modeOfTravel}</td>
                                                    <td>{t.fromLocation} → {t.toLocation}</td>
                                                    <td>{t.estimatedCost}</td>
                                                    <td><span style={{ color: STATUS_COLOR[t.status], fontWeight: 600 }}>{t.status}</span></td>
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
                                <li onClick={openAddTravel}>➕ Add Travel</li>
                                <li onClick={load}>🔄 Refresh</li>
                            </ul>
                            <div className="erp-side-tabs">
                                <span>Actions</span><span>Info</span><span>Reports</span><span>ShortCut</span>
                            </div>
                        </aside>
                    </div>
                </div>

                {showAddTravel && (
                    <div className="erp-modal-backdrop" onClick={() => setShowAddTravel(false)}>
                        <div className="erp-modal" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
                            <div className="erp-modal-header">
                                Add Travel
                                <button className="erp-actions-close" onClick={() => setShowAddTravel(false)}>×</button>
                            </div>
                            <div className="erp-modal-body">
                                <div className="erp-grid" style={{ gridTemplateColumns: '1fr' }}>
                                    <div className="erp-field">
                                        <label>Mode of Travel</label>
                                        <select value={newLegMode} onChange={(e) => setNewLegMode(e.target.value)}>
                                            <option value="">— Select —</option>
                                            <option>Flight</option>
                                            <option>Train</option>
                                            <option>Bus</option>
                                            <option>Car</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div className="erp-field">
                                        <label>Location</label>
                                        <input value={newLegLocation} onChange={(e) => setNewLegLocation(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div className="erp-modal-footer">
                                <button type="button" className="erp-action-btn" onClick={() => setShowAddTravel(false)}>Close</button>
                                <button type="button" className="btn" onClick={confirmAddTravel}>OK</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default TravelRequest;
