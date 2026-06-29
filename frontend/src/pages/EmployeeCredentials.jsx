import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { adminApi } from '../services/api';

function EmployeeCredentials() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true); setError('');
        try {
            const { data } = await adminApi.users();
            setUsers(data.users || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const t = search.trim().toLowerCase();
        if (!t) return users;
        return users.filter((u) =>
            [u.empId, u.name, u.email, u.role].filter(Boolean).join(' ').toLowerCase().includes(t)
        );
    }, [users, search]);

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName="Employees" />
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">Employees</div>
                        <div className="erp-titlebar-actions">
                            <button className="erp-action-btn" onClick={() => navigate('/dashboard')}>↵ Dashboard</button>
                            <button className="erp-action-btn" onClick={load} disabled={loading}>🔄 Refresh</button>
                        </div>
                    </div>

                    <div className="erp-body">
                        <div className="erp-list-card" style={{ width: '100%' }}>
                            {error && <div className="error">{error}</div>}

                            <div style={{ display: 'flex', gap: 12, padding: 10, borderBottom: '1px solid #e5e7eb', alignItems: 'center' }}>
                                <input
                                    placeholder="Search by ID, name, email, role…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ flex: 1, padding: '9px 12px', fontSize: 13, border: '1px solid var(--input-border)', borderRadius: 'var(--radius-control)' }}
                                />
                                <span style={{ fontSize: 11, color: '#6b7280' }}>{filtered.length} employees</span>
                            </div>

                            <div style={{ padding: '8px 10px', fontSize: 11, color: '#9ca3af', borderBottom: '1px solid #f3f4f6' }}>
                                Passwords are encrypted (hashed) and cannot be displayed.
                            </div>

                            {loading && <p style={{ padding: 16 }}>Loading…</p>}
                            <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <table className="erp-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Password</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {!loading && filtered.length === 0 && (
                                            <tr><td colSpan={5} style={{ padding: 20, color: '#888' }}>No employees found.</td></tr>
                                        )}
                                        {filtered.map((u) => (
                                            <tr key={u._id}>
                                                <td>{u.empId || u._id}</td>
                                                <td>{u.name}</td>
                                                <td>{u.email}</td>
                                                <td>{u.role}</td>
                                                <td title="Encrypted — not retrievable" style={{ letterSpacing: 2, color: '#9ca3af' }}>••••••••</td>
                                            </tr>
                                        ))}
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

export default EmployeeCredentials;
