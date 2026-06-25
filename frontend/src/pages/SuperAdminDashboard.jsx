import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { adminApi, authApi } from '../services/api';

const TILES = [
    { key: 'users', title: 'Users', icon: '👥', color: '#3b82f6', path: '/admin/users' },
    { key: 'employees', title: 'Employees', icon: '👔', color: '#1e3a8a', path: '/admin/employees' },
    { key: 'leaves', title: 'Leaves', icon: '📅', color: '#22c55e', path: '/admin/leaves' },
    { key: 'loans', title: 'Loans', icon: '💰', color: '#f59e0b', path: '/admin/loans' },
    { key: 'expenses', title: 'Expenses', icon: '🧾', color: '#a855f7', path: '/admin/expenses' },
    { key: 'overtimes', title: 'Overtime', icon: '⏰', color: '#ef4444', path: '/admin/overtimes' },
    { key: 'assets', title: 'Asset Requests', icon: '🛠️', color: '#14b8a6', path: '/admin/assets' },
    { key: 'finElements', title: 'FIN Elements', icon: '⚙️', color: '#6b7280', path: '/fin-elements' }
];

function SuperAdminDashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [stats, setStats] = useState({ totals: {}, pending: {} });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const handleLogout = async () => {
        try { await authApi.logout(); } catch (e) {}
        localStorage.clear();
        navigate('/login');
    };

    useEffect(() => {
        adminApi.stats().then(({ data }) => {
            setStats({ totals: data.totals || {}, pending: data.pending || {} });
        }).catch((err) => {
            setError(err.response?.data?.message || 'Failed to load stats');
        }).finally(() => setLoading(false));
    }, []);

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="dashboard-header">
                    <div className="avatar" style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}>
                        🛡️
                    </div>
                    <div className="greeting">
                        <h2>Super Admin Console</h2>
                        <p>Signed in as {user.name || user.email} · role: <b>{user.role}</b></p>
                    </div>
                    <button className="btn btn-danger" onClick={handleLogout} style={{ marginRight: 12 }}>Logout</button>
                </div>

                {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}
                {loading && <p>Loading stats…</p>}

                <h3 className="section-title">All Collections</h3>
                <div className="admin-tiles">
                    {TILES.map((t) => {
                        const total = stats.totals[t.key] ?? 0;
                        const pending = stats.pending?.[t.key];
                        return (
                            <Link to={t.path} className="admin-tile" key={t.key} style={{ borderTop: `4px solid ${t.color}` }}>
                                <div className="admin-tile-icon" style={{ background: t.color }}>{t.icon}</div>
                                <div className="admin-tile-body">
                                    <div className="admin-tile-title">{t.title}</div>
                                    <div className="admin-tile-count">{total}</div>
                                    {pending !== undefined && (
                                        <div className="admin-tile-pending">
                                            {pending} <span>pending</span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <h3 className="section-title" style={{ marginTop: 24 }}>Quick Actions</h3>
                <div className="admin-quick-links">
                    <Link to="/approvals" className="admin-quick-link">✅ Pending Approvals</Link>
                    <Link to="/fin-elements/new" className="admin-quick-link">⚙️ New FIN Element</Link>
                    <Link to="/register" className="admin-quick-link">👤 Register New User</Link>
                    <Link to="/dashboard" className="admin-quick-link">🏠 Employee View</Link>
                </div>
            </main>
        </div>
    );
}

export default SuperAdminDashboard;
