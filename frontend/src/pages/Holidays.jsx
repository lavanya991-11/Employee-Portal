import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { holidayApi } from '../services/api';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
const docNo = (h, i, year) =>
    `HOL-${year}/${String(i + 1).padStart(3, '0').toUpperCase()}`;

function Holidays() {
    const navigate = useNavigate();
    const [year, setYear] = useState(new Date().getFullYear());
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const yearOptions = useMemo(() => {
        const current = new Date().getFullYear();
        return [current - 1, current, current + 1, current + 2, current + 3];
    }, []);

    const importFromBC = (y) => {
        setLoading(true); setError('');
        holidayApi.list(y).then(({ data }) => {
            setHolidays(data.holidays || []);
        }).catch((err) => {
            setError(err.response?.data?.error || err.response?.data?.message || 'Failed to fetch holidays');
            setHolidays([]);
        }).finally(() => setLoading(false));
    };

    useEffect(() => { importFromBC(year); }, [year]);

    const filteredHolidays = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return holidays;
        return holidays.filter((h) =>
            [h.description, fmtDate(h.fromDate), fmtDate(h.toDate)]
                .filter(Boolean).join(' ').toLowerCase().includes(q)
        );
    }, [holidays, searchQuery]);

    const stats = useMemo(() => {
        const total = holidays.length;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        let upcoming = 0, past = 0, ongoing = 0;
        for (const h of holidays) {
            const from = new Date(h.fromDate);
            const to = new Date(h.toDate);
            if (to < today) past++;
            else if (from > today) upcoming++;
            else ongoing++;
        }
        const pct = (n) => total ? Math.round((n / total) * 100) : 0;
        return {
            total,
            items: [
                { key: 'upcoming', label: 'Upcoming', count: upcoming, color: '#f59e0b', pct: pct(upcoming) },
                { key: 'ongoing', label: 'Today', count: ongoing, color: '#22c55e', pct: pct(ongoing) },
                { key: 'past', label: 'Past', count: past, color: '#9ca3af', pct: pct(past) }
            ]
        };
    }, [holidays]);

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName="Holidays" />
                <div className="erp-page">
                    <div className="erp-titlebar" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                        <input
                            type="text"
                            placeholder="🔍 Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ padding: '8px 14px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 8, width: '100%', background: '#fff' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <div className="erp-title">Holidays</div>
                            <div className="erp-titlebar-actions">
                                <label style={{ fontSize: 12, color: '#6b7280', marginRight: 4 }}>Year:</label>
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
                                <button className="erp-action-btn" onClick={() => importFromBC(year)} disabled={loading}>
                                    {loading ? 'Importing…' : '📡 Import'}
                                </button>
                                <button className="erp-action-btn" onClick={() => importFromBC(year)}>🔄 Refresh</button>
                            </div>
                        </div>
                    </div>

                    <div className="erp-body">
                        <div className="erp-list-card">
                            {error && <div className="error">{error}</div>}
                            {loading && <p style={{ padding: 16 }}>Loading from Business Central…</p>}
                            {!loading && !error && filteredHolidays.length === 0 && (
                                <p style={{ padding: 16, color: '#888' }}>No holidays found for {year}.</p>
                            )}
                            {filteredHolidays.length > 0 && (
                                <table className="erp-table">
                                    <thead>
                                        <tr>
                                            <th>Select</th>
                                            <th>Doc Date</th>
                                            <th>Doc No</th>
                                            <th>From Date</th>
                                            <th>To Date</th>
                                            <th>Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHolidays.map((h, i) => {
                                            const isSel = selected?.idx === i;
                                            return (
                                                <tr
                                                    key={`${h.fromDate}-${i}`}
                                                    className={isSel ? 'erp-row-selected' : ''}
                                                    onClick={() => setSelected({ ...h, idx: i })}
                                                >
                                                    <td><input type="checkbox" checked={isSel} readOnly /></td>
                                                    <td>{fmtDate(new Date())}</td>
                                                    <td className="erp-doc-link">{docNo(h, i, year)}</td>
                                                    <td>{fmtDate(h.fromDate)}</td>
                                                    <td>{fmtDate(h.toDate)}</td>
                                                    <td>{h.description || '—'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <aside className="erp-actions-panel">
                            <div className="erp-actions-header">
                                <span>Holiday Status</span>
                                <span style={{ color: '#1e3a8a', fontWeight: 700 }}>{stats.total}</span>
                            </div>
                            <div style={{ padding: 14 }}>
                                {stats.items.map((s) => (
                                    <div key={s.key} style={{ marginBottom: 14 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151', marginBottom: 4 }}>
                                            <span>{s.label} <span style={{ color: '#9ca3af' }}>{s.pct}%</span></span>
                                            <span style={{ fontWeight: 600 }}>{s.count}</span>
                                        </div>
                                        <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${s.pct}%`, background: s.color }} />
                                        </div>
                                    </div>
                                ))}
                                {selected && (
                                    <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                                        <div style={{ fontWeight: 600, color: '#1e3a8a', marginBottom: 8 }}>{docNo(selected, selected.idx, year)}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                                            <span>From</span><span>{fmtDate(selected.fromDate)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                                            <span>To</span><span>{fmtDate(selected.toDate)}</span>
                                        </div>
                                        <div style={{ fontSize: 12, color: '#374151', marginTop: 8 }}>
                                            {selected.description || '—'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Holidays;
