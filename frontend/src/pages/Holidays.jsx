import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { holidayApi } from '../services/api';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
const toInputDate = (d) => d ? new Date(d).toISOString().slice(0, 10) : '';

function Holidays() {
    const navigate = useNavigate();
    const [year, setYear] = useState(new Date().getFullYear());
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ fromDate: '', toDate: '', description: '' });
    const [saving, setSaving] = useState(false);

    const yearOptions = useMemo(() => {
        const current = new Date().getFullYear();
        return [current - 1, current, current + 1, current + 2, current + 3];
    }, []);

    const load = (y) => {
        setLoading(true);
        setError('');
        holidayApi.list(y).then(({ data }) => {
            setHolidays(data.holidays || []);
        }).catch((err) => {
            setError(err.response?.data?.message || 'Failed to load holidays');
            setHolidays([]);
        }).finally(() => setLoading(false));
    };

    useEffect(() => { load(year); }, [year]);

    const onNew = () => {
        setEditingId(null);
        setForm({ fromDate: '', toDate: '', description: '' });
        setFormOpen(true);
        setError(''); setSuccess('');
    };

    const onEdit = (h) => {
        setEditingId(h._id);
        setForm({
            fromDate: toInputDate(h.fromDate),
            toDate: toInputDate(h.toDate),
            description: h.description || ''
        });
        setFormOpen(true);
        setError(''); setSuccess('');
    };

    const onSave = async () => {
        if (!form.fromDate || !form.toDate || !form.description.trim()) {
            setError('From Date, To Date and Description are required.');
            return;
        }
        if (new Date(form.toDate) < new Date(form.fromDate)) {
            setError('To Date cannot be before From Date.');
            return;
        }
        setSaving(true); setError('');
        try {
            if (editingId) {
                await holidayApi.update(editingId, form);
                setSuccess('Holiday updated.');
            } else {
                await holidayApi.create(form);
                setSuccess('Holiday added.');
            }
            setFormOpen(false);
            setEditingId(null);
            load(year);
        } catch (err) {
            setError(err.response?.data?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async (h) => {
        if (!window.confirm(`Delete "${h.description}" (${fmtDate(h.fromDate)})?`)) return;
        try {
            await holidayApi.remove(h._id);
            setSuccess('Deleted.');
            load(year);
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName="Holidays" />
                <div className="erp-page">
                    <div className="erp-titlebar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <div className="erp-title">Holidays</div>
                        <div className="erp-titlebar-actions">
                            <label style={{ fontSize: 12, color: '#6b7280', marginRight: 6 }}>Year:</label>
                            <select
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                style={{ padding: '6px 10px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 4 }}
                            >
                                {yearOptions.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <button className="erp-action-btn" onClick={() => navigate(-1)}>← Back</button>
                            <button className="erp-action-btn" onClick={onNew}>📄 New</button>
                            <button className="erp-action-btn" onClick={() => load(year)}>🔄 Refresh</button>
                        </div>
                    </div>

                    <div className="erp-body">
                        <div className="erp-list-card" style={{ width: '100%' }}>
                            {error && <div className="error">{error}</div>}
                            {success && <div className="success">{success}</div>}
                            {loading && <p style={{ padding: 16 }}>Loading…</p>}
                            {!loading && !error && holidays.length === 0 && (
                                <p style={{ padding: 16, color: '#888' }}>No holidays for {year}. Click <b>New</b> to add one.</p>
                            )}
                            {holidays.length > 0 && (
                                <table className="erp-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 60 }}>#</th>
                                            <th>From Date</th>
                                            <th>To Date</th>
                                            <th>Description</th>
                                            <th style={{ width: 160 }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {holidays.map((h, i) => (
                                            <tr key={h._id}>
                                                <td>{i + 1}</td>
                                                <td>{fmtDate(h.fromDate)}</td>
                                                <td>{fmtDate(h.toDate)}</td>
                                                <td>{h.description}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        onClick={() => onEdit(h)}
                                                        style={{ background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe', padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12, marginRight: 6 }}
                                                    >✏️ Edit</button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onDelete(h)}
                                                        style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                                                    >🗑 Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {formOpen && (
                    <div
                        onClick={() => !saving && setFormOpen(false)}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'white', borderRadius: 8, padding: 24,
                                width: 480, maxWidth: '90vw', boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                            }}
                        >
                            <h3 style={{ margin: '0 0 14px', color: '#1e3a8a' }}>
                                {editingId ? 'Edit Holiday' : 'New Holiday'}
                            </h3>
                            {error && <div className="error">{error}</div>}
                            <div className="erp-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <div className="erp-field">
                                    <label>From Date *</label>
                                    <input
                                        type="date"
                                        value={form.fromDate}
                                        onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                                    />
                                </div>
                                <div className="erp-field">
                                    <label>To Date *</label>
                                    <input
                                        type="date"
                                        value={form.toDate}
                                        onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                                    />
                                </div>
                                <div className="erp-field" style={{ gridColumn: 'span 2' }}>
                                    <label>Description *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Republic Day"
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
                                <button
                                    type="button"
                                    onClick={() => setFormOpen(false)}
                                    disabled={saving}
                                    className="erp-action-btn"
                                >Cancel</button>
                                <button
                                    type="button"
                                    onClick={onSave}
                                    disabled={saving}
                                    className="erp-action-btn"
                                    style={{ background: '#1e3a8a', color: 'white', borderColor: '#1e3a8a' }}
                                >{saving ? 'Saving…' : (editingId ? '💾 Update' : '💾 Save')}</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Holidays;
