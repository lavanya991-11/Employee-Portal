import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';
import { adminApi, authApi, resolveImageUrl } from '../services/api';

const TILES = [
    { key: 'users', title: 'Users', icon: '👥', color: '#3b82f6', path: '/admin/users' },
    { key: 'employees', title: 'Employees', icon: '👔', color: '#1e3a8a', path: '/admin/employees' },
    { key: 'leaves', title: 'Leaves', icon: '📅', color: '#22c55e', path: '/admin/leaves' },
    { key: 'loans', title: 'Loans', icon: '💰', color: '#f59e0b', path: '/admin/loans' },
    { key: 'loanRequests', title: 'Loan Requests', icon: '💳', color: '#d97706', path: '/admin/loanRequests' },
    { key: 'expenses', title: 'Expenses', icon: '🧾', color: '#a855f7', path: '/admin/expenses' },
    { key: 'travels', title: 'Travel Expenses', icon: '✈️', color: '#0ea5e9', path: '/admin/travels' },
    { key: 'overtimes', title: 'Overtime', icon: '⏰', color: '#ef4444', path: '/admin/overtimes' },
    { key: 'assets', title: 'Asset Requests', icon: '🛠️', color: '#14b8a6', path: '/admin/assets' },
    { key: 'finElements', title: 'FIN Elements', icon: '⚙️', color: '#6b7280', path: '/fin-elements' }
];

const QUICK_LINKS = [
    { to: '/approvals', icon: '✅', iconBg: '#dbeafe', label: 'Pending Approvals' },
    { to: '/fin-elements/new', icon: '⚙️', iconBg: '#ede9fe', label: 'New FIN Element' },
    { to: '/register', icon: '👤', iconBg: '#dcfce7', label: 'Register New User' },
    { to: '/dashboard', icon: '🏠', iconBg: '#fef3c7', label: 'Employee View' }
];

function timeOfDay() {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
}

function StatCard({ icon, iconBg, iconColor, label, value, sub }) {
    return (
        <div className="dash-stat-card">
            <div className="dash-stat-top">
                <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginTop: 4, lineHeight: 1.2 }}>{value}</div>
                    {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
                </div>
                <div style={{
                    width: 40, height: 40, borderRadius: 10, background: iconBg, color: iconColor,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                }}>{icon}</div>
            </div>
        </div>
    );
}

function SuperAdminDashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [stats, setStats] = useState({ totals: {}, pending: {} });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);

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

    const pendingTotal = useMemo(
        () => Object.values(stats.pending || {}).reduce((a, b) => a + (Number(b) || 0), 0),
        [stats.pending]
    );
    const requestsTotal = useMemo(
        () => ['leaves', 'loanRequests', 'expenses', 'travels', 'overtimes', 'assets']
            .reduce((a, k) => a + (Number(stats.totals?.[k]) || 0), 0),
        [stats.totals]
    );

    const displayName = user.name || user.email || 'Admin';
    const avatarInitial = displayName.charAt(0).toUpperCase();
    const visibleTiles = TILES.filter((t) => t.title.toLowerCase().includes(search.trim().toLowerCase()));

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                {/* Header */}
                <div className="dashboard-header">
                    <div className="avatar" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
                        {avatarInitial}
                    </div>
                    <div className="greeting">
                        <h2>Good {timeOfDay()}, {displayName} 👋</h2>
                        <p>{user.role || 'Super Admin'}{user.department ? ` · ${user.department}` : ' · Administration'}</p>
                    </div>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <NotificationBell />
                        <button
                            type="button"
                            onClick={() => setMenuOpen((v) => !v)}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
                        >
                            <span style={{
                                width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: '#1e3a8a', color: '#cbd5e1',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {user.profilePicture
                                    ? <img src={resolveImageUrl(user.profilePicture)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-9 2.2-9 5.2V22h18v-2.8c0-3-4.6-5.2-9-5.2Z" /></svg>}
                            </span>
                            <span style={{ fontWeight: 600, color: '#111827', fontSize: 12 }}>{displayName}</span>
                        </button>
                        {menuOpen && (
                            <div style={{
                                position: 'absolute', top: '100%', right: 0, marginTop: 6,
                                background: '#fff', border: '1px solid var(--line-soft)', borderRadius: 10,
                                boxShadow: 'var(--shadow-md)', minWidth: 180, zIndex: 50, overflow: 'hidden'
                            }}>
                                <div style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', fontSize: 12, color: '#6b7280' }}>
                                    {user.email || ''}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setMenuOpen(false); handleLogout(); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#dc2626', fontWeight: 600 }}
                                >
                                    <span>↪</span> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}

                {/* Summary stat cards */}
                <div className="dash-stats">
                    <StatCard icon="👥" iconBg="#dbeafe" iconColor="#1e40af"
                        label="Total Users" value={stats.totals.users ?? 0} sub="Registered accounts" />
                    <StatCard icon="👔" iconBg="#e0e7ff" iconColor="#3730a3"
                        label="Employees" value={stats.totals.employees ?? 0} sub="In the portal" />
                    <StatCard icon="⏳" iconBg="#fef3c7" iconColor="#b45309"
                        label="Pending Approvals" value={pendingTotal} sub="Across all requests" />
                    <StatCard icon="🗂️" iconBg="#dcfce7" iconColor="#15803d"
                        label="Total Requests" value={requestsTotal} sub="Leaves, loans, expenses…" />
                </div>

                {/* Collections + Quick actions */}
                <div className="admin-dash-grid">
                    <div className="dash-card">
                        <div className="dash-card-head">
                            <span>All Collections</span>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search collections…"
                                style={{ padding: '6px 12px', fontSize: 12, border: '1px solid var(--input-border)', borderRadius: 'var(--radius-control)', width: 180 }}
                            />
                        </div>
                        <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                            {loading && <p style={{ color: '#6b7280', gridColumn: '1 / -1' }}>Loading…</p>}
                            {!loading && visibleTiles.length === 0 && (
                                <p style={{ color: '#9ca3af', gridColumn: '1 / -1' }}>No collections match “{search}”.</p>
                            )}
                            {visibleTiles.map((t) => {
                                const total = stats.totals[t.key] ?? 0;
                                const pending = stats.pending?.[t.key];
                                return (
                                    <Link to={t.path} key={t.key} style={{
                                        display: 'block', textDecoration: 'none',
                                        border: '1px solid var(--line-soft)', borderRadius: 12,
                                        padding: 14, background: 'var(--surface)', boxShadow: 'var(--shadow-sm)',
                                        transition: 'box-shadow 0.15s, transform 0.15s'
                                    }}
                                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                width: 38, height: 38, borderRadius: 10, background: t.color, color: 'white',
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                                            }}>{t.icon}</div>
                                            <div>
                                                <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{t.title}</div>
                                                <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>{total}</div>
                                            </div>
                                        </div>
                                        {pending !== undefined && (
                                            <div style={{ marginTop: 8, fontSize: 11, color: '#b45309' }}>{pending} pending</div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="dash-card">
                        <div className="dash-card-head"><span>Quick Actions</span></div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {QUICK_LINKS.map((q) => (
                                <Link key={q.to} to={q.to} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '12px 16px', borderBottom: '1px solid #f3f4f6',
                                    textDecoration: 'none', color: '#374151', fontWeight: 500
                                }}>
                                    <span style={{
                                        width: 34, height: 34, borderRadius: 9, background: q.iconBg,
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15
                                    }}>{q.icon}</span>
                                    {q.label}
                                    <span style={{ marginLeft: 'auto', color: '#cbd5e1' }}>›</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default SuperAdminDashboard;
