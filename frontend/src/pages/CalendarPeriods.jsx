import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ActionButton from '../components/ActionButton';
import PageHeader from '../components/PageHeader';
import { calendarPeriodApi } from '../services/api';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';

const COLUMNS = [
    { key: 'periodNo', header: 'Period No' },
    { key: 'month', header: 'Month' },
    { key: 'year', header: 'Year' },
    { key: 'calendarStartDate', header: 'Start Date', type: 'date' },
    { key: 'calendarEndDate', header: 'End Date', type: 'date' },
    { key: 'payPeriodStatus', header: 'Pay Period Status' },
    { key: 'isPosted', header: 'Posted', type: 'bool' }
];

const renderValue = (col, row) => {
    const v = row[col.key];
    if (col.type === 'bool') return v ? '✓' : '';
    if (col.type === 'date') return fmtDate(v);
    return v ?? '';
};

function CalendarPeriods() {
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
            const { data } = await calendarPeriodApi.list();
            setItems(data.items || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load calendar periods');
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const t = search.trim().toLowerCase();
        if (!t) return items;
        return items.filter((x) =>
            [x.periodNo, x.month, x.year, x.payPeriodStatus, fmtDate(x.calendarStartDate), fmtDate(x.calendarEndDate)]
                .filter((v) => v !== null && v !== undefined).join(' ').toLowerCase().includes(t)
        );
    }, [items, search]);

    const onDeleteSelected = async () => {
        if (!selected) { alert('Select a calendar period row first.'); return; }
        if (!window.confirm(`Delete period ${selected.periodNo} (${selected.year})? This cannot be undone.`)) return;
        setError(''); setSuccess('');
        try {
            await calendarPeriodApi.remove(selected._id);
            setSelected(null);
            await load();
            setSuccess('Calendar period deleted.');
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    const onDeleteAll = async () => {
        if (items.length === 0) { alert('No calendar periods to delete.'); return; }
        if (!window.confirm(`Delete ALL ${items.length} calendar period(s)? This cannot be undone.`)) return;
        setError(''); setSuccess('');
        try {
            const { data } = await calendarPeriodApi.removeAll();
            setSelected(null);
            await load();
            setSuccess(data.message || 'All calendar periods deleted.');
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    // Scan Calendar Periods: call BC, wipe the local table, re-insert the latest rows.
    const onScan = async () => {
        if (!window.confirm('Scan Calendar Periods from Business Central?\n\nThis deletes all existing calendar period records and replaces them with the latest data from BC.')) return;
        setError(''); setSuccess(''); setScanning(true);
        try {
            const { data } = await calendarPeriodApi.scan();
            setSelected(null);
            await load(); // auto-refresh after a successful scan
            setSuccess(data.message || `Imported ${data.inserted} calendar period(s) from BC.`);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Scan Calendar Periods failed');
        } finally {
            setScanning(false);
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content bg-grey">
                <PageHeader pageName="Calendar Periods" />
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">Calendar Periods</div>
                        <div className="erp-titlebar-actions">
                            <ActionButton kind="home" onClick={() => navigate('/admin')}>Admin Home</ActionButton>
                            <ActionButton kind="scan" onClick={onScan} disabled={scanning}>
                                {scanning ? 'Scanning…' : 'Scan Calendar Periods'}
                            </ActionButton>
                            <ActionButton kind="trash" onClick={onDeleteSelected} disabled={!selected || scanning}>Delete</ActionButton>
                            <ActionButton kind="trash" tint="danger" onClick={onDeleteAll} disabled={items.length === 0 || scanning}>Delete All</ActionButton>
                            <ActionButton kind="refresh" onClick={load} disabled={loading || scanning}>Refresh</ActionButton>
                        </div>
                    </div>

                    <div className="erp-body">
                        <div className="erp-list-card" style={{ width: '100%' }}>
                            {error && <div className="error">{error}</div>}
                            {success && <div className="success">{success}</div>}

                            <div style={{ display: 'flex', gap: 12, padding: 10, borderBottom: '1px solid #e5e7eb', alignItems: 'center' }}>
                                <input
                                    placeholder="Search by period, month, year, status…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ flex: 1, padding: '9px 12px', fontSize: 13, border: '1px solid var(--input-border)', borderRadius: 'var(--radius-control)' }}
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
                                                No calendar periods yet. Click <b>Scan Calendar Periods</b> to import from Business Central.
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
                                                        <td key={c.key}>{renderValue(c, it)}</td>
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

export default CalendarPeriods;
