import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ActionButton from '../components/ActionButton';
import PageHeader from '../components/PageHeader';
import { loanProductApi } from '../services/api';

const COLUMNS = [
    { key: 'finId', header: 'FIN Id' },
    { key: 'description', header: 'Description' },
    { key: 'frequency', header: 'Frequency' },
    { key: 'maximumInstallmentPeriod', header: 'Max. Installment Period' }
];

function LoanProducts() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true); setError('');
        try {
            const { data } = await loanProductApi.list();
            setItems(data.items || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load loan products');
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const t = search.trim().toLowerCase();
        if (!t) return items;
        return items.filter((x) =>
            [x.finId, x.description, x.frequency].filter((v) => v != null).join(' ').toLowerCase().includes(t)
        );
    }, [items, search]);

    // Sync Loan Products: fetch from BC, wipe the local table, insert the latest.
    const onSync = async () => {
        if (!window.confirm('Sync Loan Products from Business Central?\n\nThis replaces the current list with the latest data from the API.')) return;
        setError(''); setSuccess(''); setSyncing(true);
        try {
            const { data } = await loanProductApi.sync();
            setSelected(null);
            await load();
            setSuccess(data.message || `Imported ${data.inserted} loan product(s).`);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Sync Loan Products failed');
        } finally {
            setSyncing(false);
        }
    };

    const onDeleteSelected = async () => {
        if (!selected) { alert('Select a loan product row first.'); return; }
        if (!window.confirm(`Delete loan product "${selected.description}" (FIN ${selected.finId})? This cannot be undone.`)) return;
        setError(''); setSuccess('');
        try {
            await loanProductApi.remove(selected._id);
            setSelected(null);
            await load();
            setSuccess('Loan product deleted.');
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    const onDeleteAll = async () => {
        if (items.length === 0) { alert('No loan products to delete.'); return; }
        if (!window.confirm(`Delete ALL ${items.length} loan product(s)? This cannot be undone.`)) return;
        setError(''); setSuccess('');
        try {
            const { data } = await loanProductApi.removeAll();
            setSelected(null);
            await load();
            setSuccess(data.message || 'All loan products deleted.');
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content bg-grey">
                <PageHeader pageName="Loan Products" />
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">Loan Products</div>
                        <div className="erp-titlebar-actions">
                            <ActionButton kind="home" onClick={() => navigate('/admin')}>Admin Home</ActionButton>
                            <ActionButton kind="scan" onClick={onSync} disabled={syncing}>
                                {syncing ? 'Syncing…' : 'Sync Loan Products'}
                            </ActionButton>
                            <ActionButton kind="trash" onClick={onDeleteSelected} disabled={!selected || syncing}>Delete</ActionButton>
                            <ActionButton kind="trash" tint="danger" onClick={onDeleteAll} disabled={items.length === 0 || syncing}>Delete All</ActionButton>
                            <ActionButton kind="refresh" onClick={load} disabled={loading || syncing}>Refresh</ActionButton>
                        </div>
                    </div>

                    <div className="erp-body">
                        <div className="erp-list-card" style={{ width: '100%' }}>
                            {error && <div className="error">{error}</div>}
                            {success && <div className="success">{success}</div>}

                            <div style={{ display: 'flex', gap: 12, padding: 10, borderBottom: '1px solid #e5e7eb', alignItems: 'center' }}>
                                <input
                                    placeholder="Search by FIN Id, description, frequency…"
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
                                                No loan products yet. Click <b>Sync Loan Products</b> to import from Business Central.
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

export default LoanProducts;
