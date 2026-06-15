import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { holidayApi } from '../services/api';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

function Holidays() {
    const navigate = useNavigate();
    const [year, setYear] = useState(new Date().getFullYear());
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
                            <button className="erp-action-btn" onClick={() => load(year)}>🔄 Refresh</button>
                        </div>
                    </div>

                    <div className="erp-body">
                        <div className="erp-list-card" style={{ width: '100%' }}>
                            {error && <div className="error">{error}</div>}
                            {loading && <p style={{ padding: 16 }}>Loading…</p>}
                            {!loading && !error && holidays.length === 0 && (
                                <p style={{ padding: 16, color: '#888' }}>No holidays found for {year}.</p>
                            )}
                            {holidays.length > 0 && (
                                <table className="erp-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 60 }}>#</th>
                                            <th>From Date</th>
                                            <th>To Date</th>
                                            <th>Description</th>
                                            <th>Year</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {holidays.map((h, i) => (
                                            <tr key={`${h.fromDate}-${i}`}>
                                                <td>{i + 1}</td>
                                                <td>{fmtDate(h.fromDate)}</td>
                                                <td>{fmtDate(h.toDate)}</td>
                                                <td>{h.description || '—'}</td>
                                                <td>{new Date(h.fromDate).getFullYear()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Holidays;
