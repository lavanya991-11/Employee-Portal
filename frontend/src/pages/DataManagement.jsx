import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { dataMgmtApi } from '../services/api';

function DataManagement() {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedKeys, setSelectedKeys] = useState(new Set());
    const [busy, setBusy] = useState(false);

    const load = () => {
        setLoading(true); setError('');
        dataMgmtApi.tables().then(({ data }) => {
            setTables(data.tables || []);
        }).catch((err) => {
            setError(err.response?.data?.message || 'Failed to load tables');
        }).finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const toggle = (key) => {
        setSelectedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedKeys.size === tables.length) setSelectedKeys(new Set());
        else setSelectedKeys(new Set(tables.map((t) => t.key)));
    };

    const flash = (msg) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(''), 3500);
    };

    const onDeleteSelected = async () => {
        if (selectedKeys.size === 0) { alert('Select at least one table.'); return; }
        const list = tables.filter((t) => selectedKeys.has(t.key)).map((t) => t.label).join(', ');
        if (!window.confirm(`Permanently delete ALL data from these ${selectedKeys.size} table(s)?\n\n${list}\n\nThis cannot be undone.`)) return;
        setBusy(true); setError('');
        try {
            const { data } = await dataMgmtApi.deleteSelected(Array.from(selectedKeys));
            flash(data.message || 'Deleted.');
            setSelectedKeys(new Set());
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed');
        } finally {
            setBusy(false);
        }
    };

    const onDeleteAll = async () => {
        if (!window.confirm('Permanently delete ALL data from EVERY table?\n\nThis cannot be undone.')) return;
        if (!window.confirm('Are you ABSOLUTELY sure? Type Yes in your head and click OK to wipe everything.')) return;
        setBusy(true); setError('');
        try {
            const { data } = await dataMgmtApi.deleteAll();
            flash(data.message || 'All tables cleared.');
            setSelectedKeys(new Set());
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed');
        } finally {
            setBusy(false);
        }
    };

    const onSync = () => {
        load();
        flash('Counts re-synced.');
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName="Data Management" />
                <div className="erp-page" style={{ padding: 20 }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                        <div>
                            <h2 style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 8 }}>
                                🗑️ Data Management
                            </h2>
                            <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
                                Permanently delete table data — super admin only
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button type="button" onClick={onSync} disabled={busy} className="erp-action-btn">🔄 Sync Tables</button>
                            <button
                                type="button"
                                onClick={onDeleteSelected}
                                disabled={busy || selectedKeys.size === 0}
                                className="erp-action-btn"
                                style={{ color: selectedKeys.size ? '#b91c1c' : '#9ca3af' }}
                            >🗑 Delete Selected ({selectedKeys.size})</button>
                            <button
                                type="button"
                                onClick={onDeleteAll}
                                disabled={busy}
                                style={{
                                    background: '#dc2626', color: 'white', border: 'none',
                                    borderRadius: 6, padding: '6px 14px', fontSize: 12,
                                    fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer'
                                }}
                            >🗑 Delete All</button>
                        </div>
                    </div>

                    {/* Destructive warning */}
                    <div style={{
                        padding: 12, marginBottom: 14, borderRadius: 8,
                        background: '#fef2f2', border: '1px solid #fecaca', color: '#7f1d1d',
                        display: 'flex', alignItems: 'flex-start', gap: 10
                    }}>
                        <span style={{ fontSize: 18 }}>⚠️</span>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>Destructive Operation</div>
                            <div style={{ fontSize: 12, marginTop: 2 }}>
                                Deleted data cannot be recovered. Use carefully.
                            </div>
                        </div>
                    </div>

                    {error && <div className="error">{error}</div>}
                    {success && <div className="success">{success}</div>}

                    {/* Tables grid card */}
                    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                                Available Tables ({tables.length})
                            </div>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={tables.length > 0 && selectedKeys.size === tables.length}
                                    onChange={toggleAll}
                                />
                                Select All
                            </label>
                        </div>

                        {loading && <p style={{ color: '#6b7280' }}>Loading tables…</p>}
                        {!loading && tables.length === 0 && <p style={{ color: '#6b7280' }}>No tables.</p>}

                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10
                        }}>
                            {tables.map((t) => {
                                const isSel = selectedKeys.has(t.key);
                                return (
                                    <label
                                        key={t.key}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '10px 12px', cursor: 'pointer',
                                            border: '1px solid ' + (isSel ? '#fca5a5' : '#e5e7eb'),
                                            background: isSel ? '#fef2f2' : 'white',
                                            borderRadius: 8, fontSize: 13
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSel}
                                            onChange={() => toggle(t.key)}
                                        />
                                        <span style={{ fontFamily: 'monospace', flex: 1 }}>{t.label}</span>
                                        <span style={{ fontSize: 11, color: '#6b7280' }}>{t.count} rows</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default DataManagement;
