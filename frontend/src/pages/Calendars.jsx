import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { calendarApi } from '../services/api';

const COLUMNS = [
    { key: 'calendarCode', header: 'Calendar Code' },
    { key: 'description', header: 'Description' },
    { key: 'calendarYear', header: 'Calendar Year' },
    { key: 'payrollPeriod', header: 'Payroll Period' },
    { key: 'workingDaysPerMonth', header: 'Working Days / Month' },
    { key: 'calendarType', header: 'Calendar Type' }
];

function Calendars() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true); setError('');
        try {
            const { data } = await calendarApi.list();
            setItems(data.items || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load calendars');
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const t = search.trim().toLowerCase();
        if (!t) return items;
        return items.filter((x) =>
            [x.calendarCode, x.description, x.payrollPeriod, x.calendarType, String(x.calendarYear)]
                .filter(Boolean).join(' ').toLowerCase().includes(t)
        );
    }, [items, search]);

    // Scan Calendars: call BC, wipe the local table, re-insert the latest rows.
    const onScanCalendars = async () => {
        if (!window.confirm('Scan Calendars from Business Central?\n\nThis deletes all existing calendar records and replaces them with the latest data from BC.')) return;
        setError(''); setSuccess(''); setScanning(true);
        try {
            const { data } = await calendarApi.scan();
            setSelected(null);
            await load();
            setSuccess(data.message || `Scanned ${data.inserted} calendar(s) from BC.`);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Scan Calendars failed');
        } finally {
            setScanning(false);
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">Calendars</div>
                        <div className="erp-titlebar-actions">
                            <button className="erp-action-btn" onClick={() => navigate('/admin')}>↵ Admin Home</button>
                            <button className="erp-action-btn" onClick={onScanCalendars} disabled={scanning}>
                                {scanning ? 'Scanning…' : '📡 Scan Calendars'}
                            </button>
                            <button className="erp-action-btn" onClick={load} disabled={loading || scanning}>🔄 Refresh</button>
                        </div>
                    </div>

                    <div className="erp-body">
                        <div className="erp-list-card" style={{ width: '100%' }}>
                            {error && <div className="error">{error}</div>}
                            {success && <div className="success">{success}</div>}

                            <div style={{ display: 'flex', gap: 12, padding: 10, borderBottom: '1px solid #e5e7eb', alignItems: 'center' }}>
                                <input
                                    placeholder="Search by code, description, type…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ flex: 1, padding: '4px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 3 }}
                                />
                                <span style={{ fontSize: 11, color: '#6b7280' }}>{filtered.length} records</span>
                            </div>

                            {loading && <p style={{ padding: 16 }}>Loading…</p>}
                            <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <table className="erp-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 50 }}>Select</th>
                                            {COLUMNS.map((c) => <th key={c.key}>{c.header}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {!loading && filtered.length === 0 && (
                                            <tr><td colSpan={COLUMNS.length + 1} style={{ padding: 20, color: '#888' }}>
                                                No calendars yet. Click <b>Scan Calendars</b> to import from Business Central.
                                            </td></tr>
                                        )}
                                        {filtered.map((it) => {
                                            const isSel = selected?._id === it._id;
                                            return (
                                                <tr key={it._id}
                                                    className={isSel ? 'erp-row-selected' : ''}
                                                    onClick={() => setSelected(it)}>
                                                    <td><input type="checkbox" checked={isSel} readOnly /></td>
                                                    {COLUMNS.map((c) => (
                                                        <td key={c.key}>{it[c.key] ?? ''}</td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Calendars;
