import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { holidayApi } from '../services/api';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
const docNo = (h, i, year) =>
    `HOL-${year}/${String(i + 1).padStart(3, '0').toUpperCase()}`;

// Holiday status relative to today → coloured badge.
const statusOf = (h) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const from = new Date(h.fromDate);
    const to = new Date(h.toDate);
    if (to < today) return { label: 'Past', color: '#475569', bg: '#f1f5f9' };
    if (from > today) return { label: 'Upcoming', color: '#b45309', bg: '#fef3c7' };
    return { label: 'Today', color: '#15803d', bg: '#dcfce7' };
};

function Holidays() {
    const navigate = useNavigate();
    const [year, setYear] = useState(new Date().getFullYear());
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [yearOptions, setYearOptions] = useState(() => {
        const c = new Date().getFullYear();
        return [c - 1, c, c + 1, c + 2, c + 3];
    });

    // Pull the actual list of years from BC so the dropdown reflects what
    // BC really has (e.g. 2030 added in BC shows up automatically). Fallback
    // to the local default range if the years endpoint is unavailable.
    useEffect(() => {
        holidayApi.years().then(({ data }) => {
            const fromBc = (data.years || []).filter((y) => Number.isFinite(y));
            const c = new Date().getFullYear();
            const merged = Array.from(new Set([
                ...fromBc,
                c - 1, c, c + 1, c + 2, c + 3
            ])).sort((a, b) => a - b);
            if (merged.length) setYearOptions(merged);
        }).catch(() => {});
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
                            style={{ padding: '9px 14px', fontSize: 14, border: '1px solid var(--input-border)', borderRadius: 'var(--radius-control)', width: '100%', background: '#fff' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <div className="erp-title">Holidays</div>
                            <div className="erp-titlebar-actions">
                                <label style={{ fontSize: 12, color: '#6b7280', marginRight: 4 }}>Year:</label>
                                <select
                                    value={year}
                                    onChange={(e) => setYear(Number(e.target.value))}
                                    style={{ padding: '7px 10px', fontSize: 13, border: '1px solid var(--input-border)', borderRadius: 8 }}
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
                                            <th>Doc No</th>
                                            <th>From Date</th>
                                            <th>To Date</th>
                                            <th>Description</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHolidays.map((h, i) => {
                                            const isSel = selected?.idx === i;
                                            const st = statusOf(h);
                                            return (
                                                <tr
                                                    key={`${h.fromDate}-${i}`}
                                                    className={isSel ? 'erp-row-selected' : ''}
                                                    onClick={() => setSelected({ ...h, idx: i })}
                                                >
                                                    <td><input type="checkbox" checked={isSel} readOnly /></td>
                                                    <td className="erp-doc-link">{docNo(h, i, year)}</td>
                                                    <td>{fmtDate(h.fromDate)}</td>
                                                    <td>{fmtDate(h.toDate)}</td>
                                                    <td><span style={{ marginRight: 6 }}>🎉</span>{h.description || '—'}</td>
                                                    <td>
                                                        <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
                                                    </td>
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
                                <span style={{ color: 'var(--accent-dark)', fontWeight: 700 }}>{stats.total}</span>
                            </div>
                            <div style={{ padding: 16 }}>
                                {stats.items.map((s) => (
                                    <div key={s.key} style={{ marginBottom: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink)', marginBottom: 6 }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ width: 8, height: 8, borderRadius: 999, background: s.color }} />
                                                {s.label} <span style={{ color: 'var(--muted)' }}>{s.pct}%</span>
                                            </span>
                                            <span style={{ fontWeight: 700 }}>{s.count}</span>
                                        </div>
                                        <div style={{ height: 6, background: 'var(--line-soft)', borderRadius: 999, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 999, transition: 'width .4s ease' }} />
                                        </div>
                                    </div>
                                ))}
                                {selected && (
                                    <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--line-soft)' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--accent-dark)', marginBottom: 8 }}>{docNo(selected, selected.idx, year)}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                                            <span>From</span><span>{fmtDate(selected.fromDate)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                                            <span>To</span><span>{fmtDate(selected.toDate)}</span>
                                        </div>
                                        <div style={{ fontSize: 12.5, color: 'var(--ink)', marginTop: 10, padding: 10, background: 'var(--accent-soft)', borderRadius: 10 }}>
                                            🎉 {selected.description || '—'}
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
