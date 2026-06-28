import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { identityDocumentApi } from '../services/api';

// Columns grouped to match the BC "Identity Documents" card.
const GROUPS = [
    {
        label: 'Employee',
        color: '#1e3a8a',
        cols: [
            { key: 'employeeCode', header: 'Employee Code' },
            { key: 'employeeName', header: 'Employee Name' }
        ]
    },
    {
        label: 'Visa Details',
        color: '#7c3aed',
        cols: [
            { key: 'primaryVisaNumber', header: 'Primary Visa Number' },
            { key: 'visaNumber', header: 'Number' },
            { key: 'visaType', header: 'Type' },
            { key: 'designation', header: 'Designation' },
            { key: 'visaIssueFrom', header: 'Issue From' },
            { key: 'visaIssueDate', header: 'Issue Date' },
            { key: 'visaExpiryDate', header: 'Expiry Date' }
        ]
    },
    {
        label: 'Passport Details',
        color: '#0ea5e9',
        cols: [
            { key: 'primaryPassportNumber', header: 'Primary Passport Number' },
            { key: 'passportNumber', header: 'Number' },
            { key: 'passportIssueFrom', header: 'Issue From' },
            { key: 'passportName', header: 'Passport Name' },
            { key: 'passportIssueDate', header: 'Issue Date' },
            { key: 'passportExpiryDate', header: 'Expiry Date' }
        ]
    },
    {
        label: 'Residence Details',
        color: '#0d9488',
        cols: [
            { key: 'primaryResidencyId', header: 'Primary Residency ID' },
            { key: 'civilId', header: 'Civil ID' },
            { key: 'residenceNumber', header: 'Number' },
            { key: 'residenceIssueDate', header: 'Issue Date' },
            { key: 'residenceExpiryDate', header: 'Expiry Date' },
            { key: 'permitStatus', header: 'Permit Status' }
        ]
    }
];

const ALL_COLS = GROUPS.flatMap((g) => g.cols);

function IdentityDocuments() {
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
            const { data } = await identityDocumentApi.list();
            setItems(data.items || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load identity documents');
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const t = search.trim().toLowerCase();
        if (!t) return items;
        return items.filter((x) =>
            ALL_COLS.map((c) => x[c.key]).filter(Boolean).join(' ').toLowerCase().includes(t)
        );
    }, [items, search]);

    const onDeleteSelected = async () => {
        if (!selected) { alert('Select an identity document row first.'); return; }
        if (!window.confirm(`Delete identity documents for "${selected.employeeCode}"? This cannot be undone.`)) return;
        setError(''); setSuccess('');
        try {
            await identityDocumentApi.remove(selected._id);
            setSelected(null);
            await load();
            setSuccess('Identity document deleted.');
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    const onDeleteAll = async () => {
        if (items.length === 0) { alert('No identity documents to delete.'); return; }
        if (!window.confirm(`Delete ALL ${items.length} identity document(s)? This cannot be undone.`)) return;
        setError(''); setSuccess('');
        try {
            const { data } = await identityDocumentApi.removeAll();
            setSelected(null);
            await load();
            setSuccess(data.message || 'All identity documents deleted.');
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    // Scan Identity Documents: call BC, wipe the local table, re-insert the latest rows.
    const onScan = async () => {
        if (!window.confirm('Scan Identity Documents from Business Central?\n\nThis deletes all existing identity-document records and replaces them with the latest data from BC.')) return;
        setError(''); setSuccess(''); setScanning(true);
        try {
            const { data } = await identityDocumentApi.scan();
            setSelected(null);
            await load();
            setSuccess(data.message || `Scanned ${data.inserted} identity document(s) from BC.`);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Scan Identity Documents failed');
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
                        <div className="erp-title">Identity Documents</div>
                        <div className="erp-titlebar-actions">
                            <button className="erp-action-btn" onClick={() => navigate('/admin')}>↵ Admin Home</button>
                            <button className="erp-action-btn" onClick={onScan} disabled={scanning}>
                                {scanning ? 'Scanning…' : '📡 Scan Identity Documents'}
                            </button>
                            <button className="erp-action-btn" onClick={onDeleteSelected} disabled={!selected || scanning}>🗑️ Delete</button>
                            <button className="erp-action-btn" onClick={onDeleteAll} disabled={items.length === 0 || scanning} style={{ color: '#b91c1c' }}>🗑 Delete All</button>
                            <button className="erp-action-btn" onClick={load} disabled={loading || scanning}>🔄 Refresh</button>
                        </div>
                    </div>

                    <div className="erp-body">
                        <div className="erp-list-card" style={{ width: '100%' }}>
                            {error && <div className="error">{error}</div>}
                            {success && <div className="success">{success}</div>}

                            <div style={{ display: 'flex', gap: 12, padding: 10, borderBottom: '1px solid #e5e7eb', alignItems: 'center' }}>
                                <input
                                    placeholder="Search by employee, number, name…"
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
                                            <th rowSpan={2} style={{ width: 50 }}>Select</th>
                                            {GROUPS.map((g) => (
                                                <th key={g.label} colSpan={g.cols.length}
                                                    style={{ textAlign: 'center', background: g.color, color: '#fff' }}>
                                                    {g.label}
                                                </th>
                                            ))}
                                        </tr>
                                        <tr>
                                            {ALL_COLS.map((c) => <th key={c.key}>{c.header}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {!loading && filtered.length === 0 && (
                                            <tr><td colSpan={ALL_COLS.length + 1} style={{ padding: 20, color: '#888' }}>
                                                No identity documents yet. Click <b>Scan Identity Documents</b> to import from Business Central.
                                            </td></tr>
                                        )}
                                        {filtered.map((it) => {
                                            const isSel = selected?._id === it._id;
                                            return (
                                                <tr key={it._id}
                                                    className={isSel ? 'erp-row-selected' : ''}
                                                    onClick={() => setSelected(it)}>
                                                    <td><input type="checkbox" checked={isSel} readOnly /></td>
                                                    {ALL_COLS.map((c) => (
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

export default IdentityDocuments;
