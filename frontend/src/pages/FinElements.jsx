import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { finElementApi } from '../services/api';

const FIN_TYPES = ['', 'Earning', 'Deduction', 'PaidLeave', 'OverTime', 'UnPaidLeave', 'EOS'];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';

function FinElements() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filterType, setFilterType] = useState('');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);

    useEffect(() => { load(); }, [filterType]);

    const load = async () => {
        setLoading(true); setError('');
        try {
            const params = filterType ? { finType: filterType } : {};
            const { data } = await finElementApi.list(params);
            setItems(data.items || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load');
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const t = search.trim().toLowerCase();
        if (!t) return items;
        return items.filter((x) =>
            String(x.finId).includes(t) ||
            (x.description || '').toLowerCase().includes(t) ||
            (x.finIdShortName || '').toLowerCase().includes(t)
        );
    }, [items, search]);

    const onDelete = async (id) => {
        if (!confirm('Delete this FIN element? This cannot be undone.')) return;
        try {
            await finElementApi.remove(id);
            setSuccess('Deleted');
            setSelected(null);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">FIN Elements <span style={{ fontSize: 12, color: '#6b7280' }}>▼</span></div>
                        <div className="erp-titlebar-actions">
                            <button className="erp-action-btn" onClick={() => navigate('/fin-elements/new')}>📄 New</button>
                            <button className="erp-action-btn" onClick={() => selected && navigate(`/fin-elements/${selected._id}`)}>✎ Edit</button>
                            <button className="erp-action-btn" onClick={load}>🔄 Refresh</button>
                            <button className="erp-action-btn" onClick={() => selected && onDelete(selected._id)} disabled={!selected}>🗑️ Delete</button>
                        </div>
                    </div>

                    <div className="erp-body">
                        <div className="erp-list-card">
                            {error && <div className="error">{error}</div>}
                            {success && <div className="success">{success}</div>}

                            <div style={{ display: 'flex', gap: 12, padding: 10, borderBottom: '1px solid #e5e7eb', alignItems: 'center' }}>
                                <label style={{ fontSize: 12, color: '#6b7280' }}>Fin Type:</label>
                                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 3 }}>
                                    {FIN_TYPES.map((t) => <option key={t} value={t}>{t || 'All'}</option>)}
                                </select>
                                <input
                                    placeholder="Search by ID, description, short name…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ flex: 1, padding: '4px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 3 }}
                                />
                                <span style={{ fontSize: 11, color: '#6b7280' }}>{filtered.length} records</span>
                            </div>

                            {loading && <p style={{ padding: 16 }}>Loading…</p>}
                            <table className="erp-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: 50 }}>Select</th>
                                        <th style={{ width: 70 }}>FIN Id</th>
                                        <th>Short Name</th>
                                        <th>Description</th>
                                        <th>Fin Type</th>
                                        <th>Frequency</th>
                                        <th>Repetition</th>
                                        <th style={{ width: 70 }}>ESS</th>
                                        <th style={{ width: 80 }}>Disabled</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!loading && filtered.length === 0 && (
                                        <tr><td colSpan={9} style={{ padding: 20, color: '#888' }}>
                                            No FIN elements yet. Click <b>New</b> to add one.
                                        </td></tr>
                                    )}
                                    {filtered.map((it) => {
                                        const isSel = selected?._id === it._id;
                                        return (
                                            <tr key={it._id}
                                                className={isSel ? 'erp-row-selected' : ''}
                                                onClick={() => setSelected(it)}
                                                onDoubleClick={() => navigate(`/fin-elements/${it._id}`)}>
                                                <td><input type="checkbox" checked={isSel} readOnly /></td>
                                                <td className="erp-doc-link">{it.finId}</td>
                                                <td>{it.finIdShortName || '—'}</td>
                                                <td>{it.description || '—'}</td>
                                                <td>{it.finType}</td>
                                                <td>{it.frequency}</td>
                                                <td>{it.repetition}</td>
                                                <td>{it.availableOnESS ? '✓' : ''}</td>
                                                <td>{it.isDisabled ? '✓' : ''}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {selected && (
                            <aside className="erp-actions-panel">
                                <div className="erp-actions-header"><span>Selected</span></div>
                                <div style={{ padding: 14, fontSize: 12, color: '#6b7280' }}>
                                    <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: 14, marginBottom: 6 }}>
                                        {selected.finIdShortName || `FIN ${selected.finId}`}
                                    </div>
                                    <div>{selected.description}</div>
                                    <div style={{ marginTop: 10 }}>
                                        <div>Type: <b>{selected.finType}</b></div>
                                        <div>Frequency: <b>{selected.frequency}</b></div>
                                        <div>Repetition: <b>{selected.repetition}</b></div>
                                        <div>ESS: <b>{selected.availableOnESS ? 'Yes' : 'No'}</b></div>
                                        <div>Disabled: <b>{selected.isDisabled ? 'Yes' : 'No'}</b></div>
                                    </div>
                                    {selected.bcSystemId && (
                                        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #e5e7eb' }}>
                                            <div>BC systemId:</div>
                                            <div style={{ fontFamily: 'monospace', fontSize: 11 }}>{selected.bcSystemId}</div>
                                        </div>
                                    )}
                                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #e5e7eb' }}>
                                        <div>Modified: {fmtDate(selected.updatedAt)}</div>
                                    </div>
                                </div>
                            </aside>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default FinElements;
