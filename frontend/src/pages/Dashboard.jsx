import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { authApi, leaveApi, employeeInfoApi, holidayApi } from '../services/api';

function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const [info, setInfo] = useState(null);
    const [recentLeaves, setRecentLeaves] = useState([]);
    const [allLeaves, setAllLeaves] = useState([]);
    const [nextHoliday, setNextHoliday] = useState(null);
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
            setAllLeaves(data.leaves || []);
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

        // Pull current + next year holidays, pick the earliest one (upcoming preferred).
        const thisYear = new Date().getFullYear();
        Promise.all([
            holidayApi.list(thisYear).catch(() => ({ data: { holidays: [] } })),
            holidayApi.list(thisYear + 1).catch(() => ({ data: { holidays: [] } }))
        ]).then(([cur, next]) => {
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const all = [...(cur.data.holidays || []), ...(next.data.holidays || [])]
                .map((h) => ({ ...h, _d: new Date(h.fromDate) }))
                .filter((h) => !isNaN(h._d))
                .sort((a, b) => a._d - b._d);
            const upcoming = all.find((h) => h._d >= today) || all[0] || null;
            setNextHoliday(upcoming);
        });

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

                {/* 4 stat cards */}
                <div className="dash-stats">
                    <StatCard icon="📅" iconBg="#dbeafe" iconColor="#1e40af"
                        label="Present Days" value={Math.min(new Date().getDate(), 22)} sub="This Month" delta="↗ 2 from last month" />
                    <StatCard icon="🌴" iconBg="#dcfce7" iconColor="#15803d"
                        label="Leave Balance" value={12 - approvedLeaves} sub="Days Left" delta={`${approvedLeaves} used this month`} />
                    <StatCard icon="⏰" iconBg="#fed7aa" iconColor="#c2410c"
                        label="Working Hours" value="176" sub="This Month" delta="↗ 8 from last month" />
                    <StatCard icon="🎉" iconBg="#ede9fe" iconColor="#6d28d9"
                        label="Upcoming Holiday" value={nextHoliday?.description || '—'}
                        sub={nextHoliday ? new Date(nextHoliday.fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                        delta={<Link to="/holidays" style={{ color: '#3b82f6', textDecoration: 'none' }}>View Calendar</Link>}
                        big />
                </div>

                {/* 3-column section: Announcements | My Attendance | Quick Links */}
                <div className="dash-three-col">
                    <div className="dash-card">
                        <div className="dash-card-head">
                            <span>Announcements</span>
                            <Link to="/announcements" style={{ color: '#3b82f6', fontSize: 12, textDecoration: 'none' }}>View All</Link>
                        </div>
                        <div className="dash-announce-list">
                            <AnnounceItem icon="📢" iconBg="#dbeafe"
                                title="Welcome to the new Employee Portal"
                                body="Use the sidebar to navigate Leave, Loan, Travel, Expenses and more."
                                meta="HR Department · today" />
                            <AnnounceItem icon="📋" iconBg="#dcfce7"
                                title="Holidays for 2026 are now live"
                                body="See the Holidays page for the official calendar from Business Central."
                                meta="HR Department · today" />
                            <AnnounceItem icon="👥" iconBg="#fce7f3"
                                title="Apply Leave page now auto-splits Paid + Unpaid"
                                body="When your request exceeds the balance, the system splits and posts to BC."
                                meta="System · this week" />
                        </div>
                    </div>

                    <AttendanceCalendar leaves={allLeaves} />


                    <div className="dash-card">
                        <div className="dash-card-head"><span>Quick Links</span></div>
                        <div className="dash-quicklink-list">
                            <QuickLink to="/leaves/apply" icon="🗓️" iconBg="#dbeafe" label="Apply Leave" />
                            <QuickLink to="/overtimes/apply" icon="⏰" iconBg="#fed7aa" label="Request Overtime" />
                            <QuickLink to="/payslip" icon="💰" iconBg="#dcfce7" label="View Payslip" />
                            <QuickLink to="/employee-information" icon="🪪" iconBg="#ede9fe" label="Update Profile" />
                            <QuickLink to="/holidays" icon="🎉" iconBg="#fce7f3" label="Holidays" />
                        </div>
                    </div>
                </div>

                {/* Recent activities */}
                <div className="dash-card" style={{ marginTop: 14 }}>
                    <div className="dash-card-head"><span>Recent Activities</span></div>
                    <div style={{ padding: 14 }}>
                        {recentLeaves.length === 0 ? (
                            <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>No recent activity.</p>
                        ) : (
                            recentLeaves.slice(0, 5).map((l) => (
                                <div key={`act-${l._id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                                    <span style={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: l.status === 'Approved' ? '#22c55e' : l.status === 'Rejected' ? '#ef4444' : '#f59e0b'
                                    }} />
                                    <div style={{ flex: 1, fontSize: 13, color: '#374151' }}>
                                        Leave request for {new Date(l.fromDate).toLocaleDateString('en-GB')} is <b>{l.status.toLowerCase()}</b>.
                                    </div>
                                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                                        {new Date(l.createdAt).toLocaleDateString('en-GB')}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function AttendanceCalendar({ leaves }) {
    const [cursor, setCursor] = useState(new Date());
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const monthLabel = cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    // Build day-status map from leaves (Approved leaves only).
    const dayStatus = {};
    (leaves || []).forEach((l) => {
        if (l.status !== 'Approved') return;
        const isHalf = l.payType === 'Half Paid' || l.leaveType?.toLowerCase().includes('half');
        const status = isHalf ? 'half' : 'full';
        const from = new Date(l.fromDate); from.setHours(0, 0, 0, 0);
        const to = new Date(l.toDate); to.setHours(0, 0, 0, 0);
        for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
            if (d.getFullYear() === year && d.getMonth() === month) {
                dayStatus[d.getDate()] = status;
            }
        }
    });

    // Build the 7×N grid starting on Monday.
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7; // Mon = 0
    const cells = [];
    for (let i = 0; i < startOffset; i++) {
        const d = new Date(year, month, 1 - (startOffset - i));
        cells.push({ d, otherMonth: true });
    }
    for (let n = 1; n <= lastDay.getDate(); n++) {
        cells.push({ d: new Date(year, month, n), otherMonth: false });
    }
    while (cells.length % 7 !== 0) {
        const last = cells[cells.length - 1].d;
        const next = new Date(last); next.setDate(last.getDate() + 1);
        cells.push({ d: next, otherMonth: true });
    }

    const dotStyle = (status, isWeekend) => {
        if (status === 'full') return { background: '#fee2e2', color: '#b91c1c' };  // Full Day Leave → red
        if (status === 'half') return { background: '#f5e6d3', color: '#92400e' };  // Half Day Leave → brown
        if (isWeekend) return { background: '#e5e7eb', color: '#6b7280' };           // Weekly Off → gray
        return { background: '#dcfce7', color: '#15803d' };                          // Present → green
    };

    return (
        <div className="dash-card">
            <div className="dash-card-head">
                <span>My Attendance</span>
                <Link to="/leaves/my" style={{ color: '#3b82f6', fontSize: 12, textDecoration: 'none' }}>View All</Link>
            </div>
            <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', flex: 1 }}>{monthLabel}</span>
                <button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))} style={attBtn}>‹</button>
                <button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))} style={attBtn}>›</button>
                <span style={legendItem}><span style={{ ...legendDot, background: '#22c55e' }} /> Present</span>
                <span style={legendItem}><span style={{ ...legendDot, background: '#ef4444' }} /> Full Day Leave</span>
                <span style={legendItem}><span style={{ ...legendDot, background: '#92400e' }} /> Half Day Leave</span>
                <span style={legendItem}><span style={{ ...legendDot, background: '#9ca3af' }} /> Weekly Off</span>
            </div>
            <div style={{ padding: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dn) => (
                        <div key={dn} style={{ textAlign: 'center', fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{dn}</div>
                    ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                    {cells.map(({ d, otherMonth }, i) => {
                        const isToday = d.getTime() === today.getTime();
                        const status = dayStatus[d.getDate()];
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                        const isMonthDay = !otherMonth;
                        const showStatusBg = isMonthDay && !isToday;
                        const style = showStatusBg ? dotStyle(status, isWeekend) : null;
                        const bg = isToday ? '#2563eb' : (style?.background || 'transparent');
                        const fg = isToday ? '#ffffff' : (otherMonth ? '#d1d5db' : (style?.color || '#374151'));
                        return (
                            <div key={i} style={{
                                width: 32, height: 32, lineHeight: '32px', borderRadius: '50%',
                                textAlign: 'center', fontSize: 12, fontWeight: 600,
                                background: bg, color: fg, margin: '0 auto'
                            }}>
                                {d.getDate()}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

const attBtn = {
    width: 24, height: 24, borderRadius: 4, border: '1px solid #e5e7eb',
    background: 'white', cursor: 'pointer', fontSize: 12, lineHeight: 1, color: '#374151'
};
const legendItem = { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7280' };
const legendDot = { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' };

function StatCard({ icon, iconBg, iconColor, label, value, sub, delta, big }) {
    return (
        <div className="dash-stat-card">
            <div className="dash-stat-top">
                <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
                    <div style={{ fontSize: big ? 18 : 28, fontWeight: 700, color: '#111827', marginTop: 4, lineHeight: 1.2 }}>{value}</div>
                    {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
                </div>
                <div style={{
                    width: 40, height: 40, borderRadius: 10, background: iconBg, color: iconColor,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                }}>{icon}</div>
            </div>
            {delta && <div style={{ marginTop: 8, fontSize: 11, color: '#16a34a' }}>{delta}</div>}
        </div>
    );
}

function AnnounceItem({ icon, iconBg, title, body, meta }) {
    return (
        <div style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{
                width: 32, height: 32, borderRadius: 8, background: iconBg,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0
            }}>{icon}</div>
            <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{title}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{body}</div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>{meta}</div>
            </div>
        </div>
    );
}

function QuickLink({ to, icon, iconBg, label }) {
    return (
        <Link to={to} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderBottom: '1px solid #f3f4f6',
            textDecoration: 'none', color: '#374151'
        }}>
            <span style={{
                width: 28, height: 28, borderRadius: 8, background: iconBg,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
            }}>{icon}</span>
            <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{label}</span>
            <span style={{ color: '#9ca3af' }}>›</span>
        </Link>
    );
}

export default Dashboard;
