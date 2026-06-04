import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { authApi, leaveApi, employeeInfoApi } from '../services/api';

function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const [info, setInfo] = useState(null);
    const [recentLeaves, setRecentLeaves] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [bellOpen, setBellOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const isManager = ['manager', 'admin', 'super-admin'].includes(user.role);

    const handleLogout = async () => {
        try { await authApi.logout(); } catch (e) {}
        localStorage.clear();
        navigate('/login');
    };

    const onBellClick = () => setBellOpen((v) => !v);

    useEffect(() => {
        authApi.me().then(({ data }) => {
            const fresh = data.user || data;
            setUser(fresh);
            localStorage.setItem('user', JSON.stringify(fresh));
        }).catch(() => {});

        employeeInfoApi.getMy()
            .then(({ data }) => setInfo(data.employeeInfo || null))
            .catch(() => {});

        leaveApi.myLeaves().then(({ data }) => {
            setRecentLeaves((data.leaves || []).slice(0, 3));
            if (!isManager) {
                const pending = (data.leaves || []).filter((l) => l.status === 'Pending');
                setNotificationCount(pending.length);
                setNotifications(pending.map((l) => ({
                    id: l._id,
                    title: `${l.leaveType || 'Leave'} - Pending`,
                    subtitle: `${new Date(l.fromDate).toLocaleDateString('en-GB')} → ${new Date(l.toDate).toLocaleDateString('en-GB')} (${l.totalDays} day${l.totalDays > 1 ? 's' : ''})`,
                    link: '/leaves/my'
                })));
            }
        }).catch(() => {});

        if (isManager) {
            leaveApi.allLeaves().then(({ data }) => {
                const pending = (data.leaves || []).filter((l) => l.status === 'Pending');
                setNotificationCount(pending.length);
                setNotifications(pending.map((l) => ({
                    id: l._id,
                    title: `${l.employee?.name || 'Employee'} requested ${l.leaveType || 'leave'}`,
                    subtitle: `${new Date(l.fromDate).toLocaleDateString('en-GB')} → ${new Date(l.toDate).toLocaleDateString('en-GB')} (${l.totalDays} day${l.totalDays > 1 ? 's' : ''})`,
                    link: '/approvals'
                })));
            }).catch(() => {});
        }
    }, [isManager]);

    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';

    const tiles = [
        { icon: '🗓️', label: 'Apply for Leave', path: '/leaves/apply' },
        { icon: '⏰', label: 'Overtime Request', path: '/overtimes/apply' },
        { icon: '💰', label: 'Expense Claim', path: '/expenses/apply' },
        { icon: '📄', label: 'View Pay slip', path: '/payslip' },
        { icon: '🪪', label: 'My Information', path: '/my-information' },
        { icon: '✈️', label: 'Travel Request', path: '/travels/apply' }
    ];

    const quickLinks = [
        { label: 'Leave Balance', value: '12 days', path: '/leaves/my' },
        { label: 'Timesheet Entry', path: '/attendance' },
        { label: 'Expense History', path: '/expenses' },
        { label: 'HR Policies', path: '/policies' }
    ];

    const pendingLeaves = recentLeaves.filter((l) => l.status === 'Pending').length;
    const approvedLeaves = recentLeaves.filter((l) => l.status === 'Approved').length;

    const displayName = [info?.firstName, info?.middleName, info?.lastName].filter(Boolean).join(' ')
        || user.name || 'Employee';
    const displayDesignation = info?.jobTitle || info?.designation || user.designation || 'Employee';
    const displayDepartment = info?.department || user.department || 'Department';
    const avatarInitial = (displayName?.[0] || 'U').toUpperCase();

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="dashboard-header">
                    <div className="avatar">
                        {user.profilePicture ? <img src={user.profilePicture} alt="" /> : avatarInitial}
                    </div>
                    <div className="greeting">
                        <h2>Good {timeOfDay}, {displayName} 👋</h2>
                        <p>{displayDesignation} • {displayDepartment}</p>
                    </div>
                    <div style={{ position: 'relative', marginRight: 16 }}>
                        <button
                            className="notification-bell"
                            title={isManager ? 'Pending approvals' : 'Your pending leaves'}
                            onClick={onBellClick}
                        >
                            🔔
                            {notificationCount > 0 && <span className="badge">{notificationCount}</span>}
                        </button>
                        {bellOpen && (
                            <div style={{
                                position: 'absolute', top: '100%', right: 0, marginTop: 6,
                                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)', minWidth: 320, maxWidth: 380,
                                maxHeight: 400, overflowY: 'auto', zIndex: 50
                            }}>
                                <div style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', fontWeight: 600, color: '#111827' }}>
                                    Notifications {notificationCount > 0 && <span style={{ color: '#6b7280', fontWeight: 400, fontSize: 12 }}>({notificationCount})</span>}
                                </div>
                                {notifications.length === 0 ? (
                                    <div style={{ padding: '20px 14px', textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
                                        No new notifications
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <button
                                            key={n.id}
                                            type="button"
                                            onClick={() => { setBellOpen(false); navigate(n.link); }}
                                            style={{
                                                display: 'block', width: '100%', textAlign: 'left',
                                                padding: '10px 14px', background: 'transparent',
                                                border: 'none', borderBottom: '1px solid #f3f4f6',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <div style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>{n.title}</div>
                                            <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{n.subtitle}</div>
                                        </button>
                                    ))
                                )}
                                {notifications.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => { setBellOpen(false); navigate(isManager ? '/approvals' : '/leaves/my'); }}
                                        style={{ display: 'block', width: '100%', padding: '10px 14px', background: '#f9fafb', border: 'none', cursor: 'pointer', color: '#3b82f6', fontWeight: 600, fontSize: 13 }}
                                    >
                                        View all →
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <div style={{ position: 'relative' }}>
                        <button
                            type="button"
                            onClick={() => setUserMenuOpen((v) => !v)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px'
                            }}
                        >
                            <span style={{
                                width: 36, height: 36, borderRadius: '50%', background: '#3b82f6', color: '#fff',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                            }}>{avatarInitial}</span>
                            <span style={{ fontWeight: 600, color: '#111827' }}>{user.name || displayName}</span>
                        </button>
                        {userMenuOpen && (
                            <div style={{
                                position: 'absolute', top: '100%', right: 0, marginTop: 6,
                                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)', minWidth: 180, zIndex: 50, overflow: 'hidden'
                            }}>
                                <div style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', fontSize: 12, color: '#6b7280' }}>
                                    {user.email || ''}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#111827' }}
                                >
                                    <span>👤</span> My Profile
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#dc2626', fontWeight: 600 }}
                                >
                                    <span>↪</span> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div>
                        <h3 className="section-title">Quick Actions</h3>
                        <div className="main-tiles">
                            {tiles.map((t) => (
                                <Link to={t.path} key={t.label} className="tile">
                                    <div className="tile-icon">{t.icon}</div>
                                    <div className="tile-label">{t.label}</div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="panel">
                            <h3>Quick Links</h3>
                            <ul className="panel-list">
                                {quickLinks.map((q) => (
                                    <li key={q.label}>
                                        <Link to={q.path}>{q.label}</Link>
                                        {q.value && <span className="value-pill">{q.value}</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="panel">
                            <h3>My Overview</h3>
                            <ul className="panel-list">
                                <li>
                                    Leave Balance
                                    <span className="value-pill">12 days</span>
                                </li>
                                <li>
                                    Pending Leaves
                                    <span className="value-pill">{pendingLeaves}</span>
                                </li>
                                <li>
                                    Approved Leaves
                                    <span className="value-pill">{approvedLeaves}</span>
                                </li>
                                <li>
                                    Recent Payslip
                                    <Link to="/payslip">View</Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;
