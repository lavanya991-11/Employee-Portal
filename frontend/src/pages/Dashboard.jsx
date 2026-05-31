import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { authApi, leaveApi } from '../services/api';

function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const [recentLeaves, setRecentLeaves] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);

    const isManager = ['manager', 'admin', 'super-admin'].includes(user.role);

    const handleLogout = async () => {
        try { await authApi.logout(); } catch (e) {}
        localStorage.clear();
        navigate('/login');
    };

    const onBellClick = () => navigate(isManager ? '/approvals' : '/leaves/my');

    useEffect(() => {
        authApi.me().then(({ data }) => {
            const fresh = data.user || data;
            setUser(fresh);
            localStorage.setItem('user', JSON.stringify(fresh));
        }).catch(() => {});

        leaveApi.myLeaves().then(({ data }) => {
            setRecentLeaves((data.leaves || []).slice(0, 3));
            if (!isManager) {
                setNotificationCount((data.leaves || []).filter((l) => l.status === 'Pending').length);
            }
        }).catch(() => {});

        if (isManager) {
            leaveApi.allLeaves().then(({ data }) => {
                setNotificationCount((data.leaves || []).filter((l) => l.status === 'Pending').length);
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

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="dashboard-header">
                    <div className="avatar">
                        {user.profilePicture ? <img src={user.profilePicture} alt="" /> : (user.name?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="greeting">
                        <h2>Good {timeOfDay}, {user.name || 'Employee'} 👋</h2>
                        <p>{user.designation || 'Employee'} • {user.department || 'Department'}</p>
                    </div>
                    <button className="btn btn-danger" onClick={handleLogout} style={{ marginRight: 12 }}>Logout</button>
                    <button
                        className="notification-bell"
                        title={isManager ? 'Pending approvals' : 'Your pending leaves'}
                        onClick={onBellClick}
                    >
                        🔔
                        {notificationCount > 0 && <span className="badge">{notificationCount}</span>}
                    </button>
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
