import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { employeeInfoApi, travelApi } from '../services/api';

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';
const STATUS_COLOR = { Pending: '#f59e0b', Approved: '#22c55e', Rejected: '#ef4444' };
const MODE_ICON = { Flight: '✈️', Train: '🚆', Bus: '🚌', Car: '🚗', Other: '🧭' };

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
        clientName: '',
        travelDesk: '',
        extraNotes: ''
    });
    const [legs, setLegs] = useState([emptyLeg()]);
    const [travels, setTravels] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    const [showAddTravel, setShowAddTravel] = useState(false);
    const [newLeg, setNewLeg] = useState({
        mode: '',
        fromLocation: '',
        toLocation: '',
        departureOn: today(),
        departureTime: '09:00',
        remarks: '',
        classOfTravel: 'Economy',
        preferredAirlines: '',
        seating: 'Window',
        meal: 'Veg',
        frequentFlyerNo: '',
        issueDate: today(),
        validUpto: today(),
        location: ''
    });

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
        const loc = adm.location || adm.city || '';
        setNewLeg({
            mode: '', fromLocation: loc, toLocation: '',
            departureOn: today(), departureTime: '09:00', remarks: '',
            classOfTravel: 'Economy', preferredAirlines: '', seating: 'Window', meal: 'Veg',
            frequentFlyerNo: '', issueDate: today(), validUpto: today(), location: loc
        });
        setShowAddTravel(true);
    };

    const onNewLegChange = (e) => {
        setNewLeg({ ...newLeg, [e.target.name]: e.target.value });
    };

    const confirmAddTravel = () => {
        if (!newLeg.mode) { setError('Pick a Mode of Travel first.'); return; }
        if (!newLeg.fromLocation || !newLeg.toLocation) {
            setError('From Location and To Location are required.');
            return;
        }
        const extras = [
            newLeg.classOfTravel && `Class: ${newLeg.classOfTravel}`,
            newLeg.preferredAirlines && `Airline: ${newLeg.preferredAirlines}`,
            newLeg.seating && `Seat: ${newLeg.seating}`,
            newLeg.meal && `Meal: ${newLeg.meal}`,
            newLeg.frequentFlyerNo && `FF#: ${newLeg.frequentFlyerNo}`,
            newLeg.departureTime && `Dep: ${newLeg.departureTime}`,
            newLeg.remarks && `Notes: ${newLeg.remarks}`
        ].filter(Boolean).join(' | ');
        const fresh = {
            id: Math.random().toString(36).slice(2),
            modeOfTravel: newLeg.mode,
            fromLocation: newLeg.fromLocation,
            toLocation: newLeg.toLocation,
            fromDate: newLeg.departureOn,
            toDate: newLeg.validUpto || newLeg.departureOn,
            remarks: extras
        };
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
        setForm({
            travelType: 'Domestic', purpose: 'Business Meeting', isBillable: 'YES',
            estimatedExpenses: 0, clientName: '', travelDesk: '', extraNotes: ''
        });
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
                                <div className="erp-leg-cards">
                                    {legs.filter((l) => l.fromLocation || l.toLocation).length === 0 && (
                                        <div className="erp-leg-empty">No travel legs yet. Click <b>+</b> to add one.</div>
                                    )}
                                    {legs.filter((l) => l.fromLocation || l.toLocation).map((l) => (
                                        <div className="erp-leg-card" key={l.id} title={`${l.fromLocation} → ${l.toLocation}${l.remarks ? '\n' + l.remarks : ''}`}>
                                            <div className="erp-leg-card-top">
                                                <span className="erp-leg-icon">{MODE_ICON[l.modeOfTravel] || '✈️'}</span>
                                                <button type="button" onClick={() => removeLeg(l.id)} className="erp-leg-delete" title="Remove">🗑️</button>
                                            </div>
                                            <div className="erp-leg-card-body">
                                                <div className="erp-leg-mode">{l.modeOfTravel}</div>
                                                <div className="erp-leg-date">{fmtDate(l.fromDate)}</div>
                                                <div className="erp-leg-route">{l.fromLocation} → {l.toLocation || '—'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
                        <div className="erp-modal" style={{ width: 720 }} onClick={(e) => e.stopPropagation()}>
                            <div className="erp-modal-header">
                                Add Travel
                                <button className="erp-actions-close" onClick={() => setShowAddTravel(false)}>×</button>
                            </div>
                            <div className="erp-modal-body">
                                {error && <div className="error" style={{ marginBottom: 10 }}>{error}</div>}
                                <div className="erp-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                                    <div className="erp-field erp-field-wide">
                                        <label>Mode of Travel</label>
                                        <select name="mode" value={newLeg.mode} onChange={onNewLegChange}>
                                            <option value="">— Select —</option>
                                            <option>Flight</option>
                                            <option>Train</option>
                                            <option>Bus</option>
                                            <option>Car</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div className="erp-field erp-field-wide"></div>

                                    <div className="erp-field erp-field-wide">
                                        <label>From Location</label>
                                        <input name="fromLocation" value={newLeg.fromLocation} onChange={onNewLegChange} list="travel-locations" />
                                    </div>
                                    <div className="erp-field erp-field-wide">
                                        <label>To Location</label>
                                        <input name="toLocation" value={newLeg.toLocation} onChange={onNewLegChange} list="travel-locations" />
                                    </div>
                                    <datalist id="travel-locations">
                                        <option value="Dubai" />
                                        <option value="Abu Dhabi" />
                                        <option value="Sharjah" />
                                        <option value="Chennai" />
                                        <option value="Bangalore" />
                                        <option value="Mumbai" />
                                        <option value="Delhi" />
                                        <option value="London" />
                                        <option value="Singapore" />
                                        <option value="G N Chetty Road" />
                                    </datalist>

                                    <div className="erp-field erp-field-wide">
                                        <label>Departure On</label>
                                        <input type="date" name="departureOn" value={newLeg.departureOn} onChange={onNewLegChange} />
                                    </div>
                                    <div className="erp-field erp-field-wide">
                                        <label>Departure Time</label>
                                        <input type="time" name="departureTime" value={newLeg.departureTime} onChange={onNewLegChange} />
                                    </div>

                                    <div className="erp-field" style={{ gridColumn: 'span 4' }}>
                                        <label>Remarks</label>
                                        <input name="remarks" value={newLeg.remarks} onChange={onNewLegChange} />
                                    </div>

                                    <div className="erp-field">
                                        <label>Class Of Travel</label>
                                        <select name="classOfTravel" value={newLeg.classOfTravel} onChange={onNewLegChange}>
                                            <option>Economy</option>
                                            <option>Premium Economy</option>
                                            <option>Business</option>
                                            <option>First</option>
                                        </select>
                                    </div>
                                    <div className="erp-field">
                                        <label>Preferred Airlines</label>
                                        <select name="preferredAirlines" value={newLeg.preferredAirlines} onChange={onNewLegChange}>
                                            <option value="">— Select —</option>
                                            <option>Emirates</option>
                                            <option>Etihad</option>
                                            <option>Air India</option>
                                            <option>IndiGo</option>
                                            <option>British Airways</option>
                                            <option>Singapore Airlines</option>
                                        </select>
                                    </div>
                                    <div className="erp-field">
                                        <label>Seating</label>
                                        <select name="seating" value={newLeg.seating} onChange={onNewLegChange}>
                                            <option>Window</option>
                                            <option>Aisle</option>
                                            <option>Middle</option>
                                            <option>No Preference</option>
                                        </select>
                                    </div>
                                    <div className="erp-field">
                                        <label>Meal</label>
                                        <select name="meal" value={newLeg.meal} onChange={onNewLegChange}>
                                            <option>Veg</option>
                                            <option>Non-Veg</option>
                                            <option>Vegan</option>
                                            <option>None</option>
                                        </select>
                                    </div>

                                    <div className="erp-field">
                                        <label>Frequent Flyer No</label>
                                        <input name="frequentFlyerNo" value={newLeg.frequentFlyerNo} onChange={onNewLegChange} />
                                    </div>
                                    <div className="erp-field">
                                        <label>Issue Date</label>
                                        <input type="date" name="issueDate" value={newLeg.issueDate} onChange={onNewLegChange} />
                                    </div>
                                    <div className="erp-field">
                                        <label>Valid Upto</label>
                                        <input type="date" name="validUpto" value={newLeg.validUpto} onChange={onNewLegChange} />
                                    </div>
                                    <div className="erp-field"></div>

                                    <div className="erp-field erp-field-wide">
                                        <label>Location</label>
                                        <input name="location" value={newLeg.location} onChange={onNewLegChange} className="erp-readonly" readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="erp-modal-footer">
                                <div style={{ flex: 1 }} />
                                <button type="button" className="erp-action-btn" onClick={() => setShowAddTravel(false)}>Close</button>
                                <button type="button" className="btn" onClick={confirmAddTravel}>📅 OK</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default TravelRequest;
