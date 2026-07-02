import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { SessionPill } from '../components/SessionGuard';
import NotificationBell from '../components/NotificationBell';
import { authApi, leaveApi, employeeInfoApi, holidayApi, adminApi, settingsApi, resolveImageUrl } from '../services/api';

const ADMIN_TILES = [
    { key: 'users', title: 'Users', icon: '👥', color: '#3b82f6', path: '/admin/users' },
    { key: 'employees', title: 'Employees', icon: '👔', color: '#1e3a8a', path: '/admin/employees' },
    { key: 'leaves', title: 'Leaves', icon: '📅', color: '#22c55e', path: '/admin/leaves' },
    { key: 'loans', title: 'Loans', icon: '💰', color: '#f59e0b', path: '/admin/loans' },
    { key: 'loanRequests', title: 'Loan Requests', icon: '💳', color: '#d97706', path: '/admin/loanRequests' },
    { key: 'expenses', title: 'Expenses', icon: '🧾', color: '#a855f7', path: '/admin/expenses' },
    { key: 'travels', title: 'Travel Expenses', icon: '✈️', color: '#0ea5e9', path: '/admin/travels' },
    { key: 'overtimes', title: 'Overtime', icon: '⏰', color: '#ef4444', path: '/admin/overtimes' },
    { key: 'assets', title: 'Asset Requests', icon: '🛠️', color: '#14b8a6', path: '/admin/assets' },
    { key: 'finElements', title: 'FIN Elements', icon: '⚙️', color: '#6b7280', path: '/fin-elements' },
    { key: 'calendars', title: 'Calendars', icon: '🗓️', color: '#8b5cf6', path: '/calendars' },
    { key: 'calendarPeriods', title: 'Calendar Periods', icon: '📆', color: '#ec4899', path: '/calendar-periods' },
    { key: 'identificationTypes', title: 'Identification Types', icon: '🪪', color: '#7c3aed', path: '/identification-types' },
    { key: 'loanProducts', title: 'Loan Products', icon: '🏦', color: '#0d9488', path: '/loan-products' },
    { key: 'credentials', title: 'Employee Credentials', icon: '🪪', color: '#64748b', path: '/employee-credentials' }
];

// Professional line icons for the KPI cards (inherit the card's icon colour).
const kpiSvg = (paths) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);
const KPI_ICONS = {
    present: kpiSvg(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /><path d="M7.5 13h.01M12 13h.01M16.5 13h.01M7.5 17h.01M12 17h.01M16.5 17h.01" /></>),
    leave: kpiSvg(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" /></>),
    hours: kpiSvg(<><circle cx="12" cy="12" r="9.5" /><g strokeWidth="1.4"><path d="M12 3V4M16.5 4.2 16 5.1M19.8 7.5 18.9 8M21 12H20M19.8 16.5 18.9 16M16.5 19.8 16 18.9M12 21V20M7.5 19.8 8 18.9M4.2 16.5 5.1 16M3 12H4M4.2 7.5 5.1 8M7.5 4.2 8 5.1" /></g><path d="M12 12V7M12 12l3.5 1.8" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></>),
    holiday: kpiSvg(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" /><path fill="currentColor" stroke="none" d="M12 12 12.9 14.7 15.8 14.8 13.5 16.5 14.4 19.2 12 17.6 9.6 19.2 10.5 16.5 8.2 14.8 11.1 14.7Z" /></>)
};

// Smaller line icons for the Quick Links list.
const qlSvg = (paths) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);
const QL_ICONS = {
    leave: qlSvg(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" /></>),
    overtime: qlSvg(<><path d="M10 3h4" /><path d="M12 3v3" /><circle cx="12" cy="14" r="8" /><path d="M12 14V10" /><path d="m17.7 8.3-1.5 1.5" /></>),
    payslip: qlSvg(<><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /><circle cx="12" cy="14.5" r="1.6" /></>),
    profile: qlSvg(<><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></>),
    holidays: qlSvg(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" /><path fill="currentColor" stroke="none" d="M12 12 12.9 14.7 15.8 14.8 13.5 16.5 14.4 19.2 12 17.6 9.6 19.2 10.5 16.5 8.2 14.8 11.1 14.7Z" /></>)
};

// Clean line icons for the admin "All Collections" cards (rendered white on a
// gradient tile). Keyed by the collection key in ADMIN_TILES.
const collIc = (paths) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);
const COLL_ICONS = {
    users: collIc(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
    employees: collIc(<><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M2 13h20" /></>),
    leaves: collIc(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" /></>),
    loans: collIc(<><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 12h.01M18 12h.01" /></>),
    loanRequests: collIc(<><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></>),
    expenses: collIc(<><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1Z" /><path d="M8 8h8M8 12h8" /></>),
    travels: collIc(<><path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a1 1 0 0 0-.9 1.7l5.1 3-2 2-2.5-.5a1 1 0 0 0-.9 1.7L6 18l1.9 2.6a1 1 0 0 0 1.7-.9L9.1 17l2-2 3 5.1a1 1 0 0 0 1.7-.1Z" /></>),
    overtimes: collIc(<><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2" /><path d="M5 3 2.5 5.5M22 5.5 19.5 3" /></>),
    assets: collIc(<><path d="M21 8 12 3 3 8v8l9 5 9-5Z" /><path d="m3 8 9 5 9-5M12 13v8" /></>),
    finElements: collIc(<><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" /></>),
    calendars: collIc(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" /></>),
    calendarPeriods: collIc(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18M8 2v4M16 2v4M8 14h.01M12 14h.01M16 14h.01" /></>),
    identificationTypes: collIc(<><rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="9" cy="12" r="2.5" /><path d="M14 10h4M14 14h4M5 16.5a3.5 3.5 0 0 1 7 0" /></>),
    loanProducts: collIc(<><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><path d="M3 10h18M16 14h2" /></>),
    credentials: collIc(<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M5.5 16a3.5 3.5 0 0 1 7 0M15 9h3M15 13h3" /></>)
};

// Darken a hex colour (for the icon tile's gradient end-stop).
const darken = (hex, amt = 0.2) => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * (1 - amt));
    const g = Math.round(((n >> 8) & 255) * (1 - amt));
    const b = Math.round((n & 255) * (1 - amt));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const [info, setInfo] = useState(null);
    const [recentLeaves, setRecentLeaves] = useState([]);
    const [allLeaves, setAllLeaves] = useState([]);
    const [nextHoliday, setNextHoliday] = useState(null);
    const [bcLeaveBalance, setBcLeaveBalance] = useState(null); // real BC total, null until/unless available
    const [adminStats, setAdminStats] = useState(null);
    const [notificationCount, setNotificationCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [bellOpen, setBellOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [companyLogo, setCompanyLogo] = useState(() => localStorage.getItem('companyLogo') || '');
    const [companyName, setCompanyName] = useState(() => localStorage.getItem('companyName') || '');

    useEffect(() => {
        settingsApi.get().then(({ data }) => {
            const s = data.settings || {};
            setCompanyLogo(s.companyLogo || '');
            setCompanyName(s.companyName || '');
            localStorage.setItem('companyLogo', s.companyLogo || '');
            localStorage.setItem('companyName', s.companyName || '');
        }).catch(() => {});
    }, []);

    const isManager = ['manager', 'admin', 'super-admin'].includes(user.role);

    const handleLogout = async () => {
        try { await authApi.logout(); } catch (e) {}
        localStorage.clear();
        navigate('/login');
    };

    const onBellClick = () => setBellOpen((v) => !v);

    const loadAdminStats = () => {
        adminApi.stats().then(({ data }) => {
            setAdminStats({ totals: data.totals || {}, pending: data.pending || {} });
        }).catch(() => {});
    };

    useEffect(() => {
        authApi.me().then(({ data }) => {
            const fresh = data.user || data;
            setUser(fresh);
            localStorage.setItem('user', JSON.stringify(fresh));
        }).catch(() => {});

        employeeInfoApi.getMy()
            .then(({ data }) => setInfo(data.employeeInfo || null))
            .catch(() => {});

        // Real leave balance from Business Central (summed across leave pay codes).
        // Falls back to the local estimate if BC is unavailable / no employee code.
        leaveApi.bcBalanceSummary()
            .then(({ data }) => setBcLeaveBalance(typeof data.totalBalance === 'number' ? data.totalBalance : null))
            .catch(() => setBcLeaveBalance(null));

        // Managers see ALL leaves on calendar + notifications; employees see only their own.
        const leavesFetcher = isManager ? leaveApi.allLeaves() : leaveApi.myLeaves();
        leavesFetcher.then(({ data }) => {
            const list = data.leaves || [];
            setAllLeaves(list);
            setRecentLeaves(list.slice(0, 3));
            const pending = list.filter((l) => l.status === 'Pending');
            setNotificationCount(pending.length);
            setNotifications(pending.map((l) => ({
                id: l._id,
                title: isManager
                    ? `${l.employee?.name || 'Employee'} requested ${l.leaveType || 'leave'}`
                    : `${l.leaveType || 'Leave'} - Pending`,
                subtitle: `${new Date(l.fromDate).toLocaleDateString('en-GB')} → ${new Date(l.toDate).toLocaleDateString('en-GB')} (${l.totalDays} day${l.totalDays > 1 ? 's' : ''})`,
                link: isManager ? '/approvals' : '/leaves/my'
            })));
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

        if (isManager) loadAdminStats();
    }, [isManager]);

    // Auto-refresh admin stats: on tab focus + every 30 seconds.
    useEffect(() => {
        if (!isManager) return;
        const onFocus = () => loadAdminStats();
        window.addEventListener('focus', onFocus);
        const interval = setInterval(loadAdminStats, 30000);
        return () => {
            window.removeEventListener('focus', onFocus);
            clearInterval(interval);
        };
    }, [isManager]);

    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';

    const tiles = [
        { icon: '🗓️', label: 'Apply for Leave', path: '/leaves/apply' },
        { icon: '⏰', label: 'Overtime Request', path: '/overtimes/apply' },
        { icon: '💰', label: 'Expense Claim', path: '/expenses/apply' },
        { icon: '📄', label: 'View Pay slip', path: '/payslip' },
        { icon: '🪪', label: 'My Information', path: '/my-information' }
    ];

    const quickLinks = [
        { label: 'Leave Balance', value: '12 days', path: '/leaves/my' },
        { label: 'Timesheet Entry', path: '/attendance' },
        { label: 'Expense History', path: '/expenses' },
        { label: 'HR Policies', path: '/policies' }
    ];

    const pendingLeaves = allLeaves.filter((l) => l.status === 'Pending').length;
    const approvedLeaves = allLeaves.filter((l) => l.status === 'Approved').length;

    // Logical attendance/leave metrics derived from the real leave data, scoped to
    // the logged-in user (managers' allLeaves contains everyone, so filter to self).
    const ANNUAL_LEAVE_ALLOWANCE = 30;
    const metrics = useMemo(() => {
        const uid = String(user?._id || user?.id || '');
        const mine = allLeaves.filter((l) => {
            const eid = String(l.employee?._id || l.employee || '');
            return !uid || eid === uid;
        });
        const approved = mine.filter((l) => l.status === 'Approved');

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const monthStart = new Date(year, month, 1);
        const todayEnd = new Date(year, month, now.getDate(), 23, 59, 59, 999);
        const isWeekday = (d) => d.getDay() !== 0 && d.getDay() !== 6;

        // Weekdays between two dates, clamped to [lo, hi].
        const weekdaysBetween = (fromD, toD, lo, hi) => {
            const start = new Date(Math.max(fromD.getTime(), lo.getTime()));
            const end = new Date(Math.min(toD.getTime(), hi.getTime()));
            let n = 0;
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) if (isWeekday(d)) n++;
            return n;
        };

        // Leave days actually used (sum of days, not record count).
        let usedThisYear = 0;
        let usedThisMonth = 0;
        approved.forEach((l) => {
            const f = new Date(l.fromDate);
            const days = Number(l.totalDays) || 0;
            if (f.getFullYear() === year) usedThisYear += days;
            if (f.getFullYear() === year && f.getMonth() === month) usedThisMonth += days;
        });

        // Present days = working days elapsed this month − approved leave weekdays this month.
        let weekdaysElapsed = 0;
        for (let d = new Date(monthStart); d <= todayEnd; d.setDate(d.getDate() + 1)) if (isWeekday(d)) weekdaysElapsed++;
        let leaveWeekdaysThisMonth = 0;
        approved.forEach((l) => {
            leaveWeekdaysThisMonth += weekdaysBetween(new Date(l.fromDate), new Date(l.toDate), monthStart, todayEnd);
        });
        const presentDays = Math.max(0, weekdaysElapsed - leaveWeekdaysThisMonth);

        return {
            leaveBalance: Math.max(0, ANNUAL_LEAVE_ALLOWANCE - usedThisYear),
            usedThisYear,
            usedThisMonth,
            presentDays,
            workingHours: presentDays * 8
        };
    }, [allLeaves, user]);

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
                    <div className="greeting">
                        <h2>Good {timeOfDay}, {displayName} 👋</h2>
                        <p>{displayDesignation} • {displayDepartment}</p>
                    </div>
                    <div style={{ marginRight: 12 }}>
                        <SessionPill />
                    </div>
                    <div style={{ marginRight: 16 }}>
                        <NotificationBell />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <button
                            type="button"
                            onClick={() => setUserMenuOpen((v) => !v)}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px'
                            }}
                        >
                            <span style={{
                                width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: '#1e3a8a', color: '#cbd5e1',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {user.profilePicture
                                    ? <img src={resolveImageUrl(user.profilePicture)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-9 2.2-9 5.2V22h18v-2.8c0-3-4.6-5.2-9-5.2Z" /></svg>}
                            </span>
                            <span style={{ fontWeight: 600, color: '#111827', fontSize: 12 }}>{user.name || displayName}</span>
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

                {/* All Collections — admins / managers / super-admin only — at TOP */}
                {isManager && adminStats && (
                    <div className="dash-card" style={{ marginBottom: 14 }}>
                        <div className="dash-card-head">
                            <span>All Collections</span>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <button
                                    type="button"
                                    onClick={loadAdminStats}
                                    style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: 4, padding: '3px 10px', fontSize: 12, color: '#374151', cursor: 'pointer' }}
                                >🔄 Refresh</button>
                            </div>
                        </div>
                        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
                            {ADMIN_TILES.map((t) => {
                                const total = adminStats.totals?.[t.key] ?? 0;
                                const pending = adminStats.pending?.[t.key];
                                return (
                                    <Link to={t.path} key={t.key} style={{
                                        display: 'block', textDecoration: 'none',
                                        border: '1px solid var(--line-soft)', borderTop: `3px solid ${t.color}`,
                                        borderRadius: 14, padding: 16, background: 'var(--surface)',
                                        boxShadow: 'var(--shadow-sm)', transition: 'box-shadow 0.15s, transform 0.15s'
                                    }}
                                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{
                                                width: 44, height: 44, borderRadius: 12, color: '#fff', flexShrink: 0,
                                                background: `linear-gradient(135deg, ${t.color}, ${darken(t.color)})`,
                                                boxShadow: `0 4px 10px ${t.color}40`,
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                            }}>{COLL_ICONS[t.key] || <span style={{ fontSize: 18 }}>{t.icon}</span>}</div>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, letterSpacing: '.3px' }}>{t.title.toUpperCase()}</div>
                                                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{total}</div>
                                            </div>
                                        </div>
                                        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280' }}>
                                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                                            {pending !== undefined ? `${pending} pending` : 'Active'}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 4 stat cards */}
                <div className="dash-stats">
                    <StatCard icon={KPI_ICONS.present} iconBg="#dbeafe" iconColor="#1e40af"
                        label="Present Days" value={metrics.presentDays} sub="This Month (working days)" delta={`${metrics.usedThisMonth} leave day(s) this month`} />
                    <StatCard icon={KPI_ICONS.leave} iconBg="#dcfce7" iconColor="#15803d"
                        label="Leave Balance"
                        value={bcLeaveBalance != null ? Number(bcLeaveBalance).toFixed(2) : metrics.leaveBalance}
                        sub="Days Left"
                        delta={bcLeaveBalance != null ? 'From Business Central' : `${metrics.usedThisYear} of ${ANNUAL_LEAVE_ALLOWANCE} used this year`} />
                    <StatCard icon={KPI_ICONS.hours} iconBg="#fed7aa" iconColor="#c2410c"
                        label="Working Hours" value={metrics.workingHours} sub="This Month" delta={`${metrics.presentDays} present day(s) × 8h`} />
                    <StatCard icon={KPI_ICONS.holiday} iconBg="#ede9fe" iconColor="#6d28d9"
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
                                body="Use the sidebar to navigate Leave, Loan, Expenses and more."
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

                    <AttendanceCalendar leaves={allLeaves} title={isManager ? 'Employee Attendances' : 'My Attendance'} />


                    <div className="dash-card">
                        <div className="dash-card-head"><span>Quick Links</span></div>
                        <div className="dash-quicklink-list">
                            <QuickLink to="/leaves/my" icon={QL_ICONS.leave} iconBg="#dbeafe" iconColor="#2563eb" label="Apply Leave" />
                            <QuickLink to="/overtimes/apply" icon={QL_ICONS.overtime} iconBg="#fed7aa" iconColor="#c2410c" label="Request Overtime" />
                            <QuickLink to="/payslip" icon={QL_ICONS.payslip} iconBg="#dcfce7" iconColor="#15803d" label="View Payslip" />
                            <QuickLink to="/employee-information" icon={QL_ICONS.profile} iconBg="#ede9fe" iconColor="#6d28d9" label="Update Profile" />
                            <QuickLink to="/holidays" icon={QL_ICONS.holidays} iconBg="#fce7f3" iconColor="#be185d" label="Holidays" />
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
                                        Leave request for {new Date(l.fromDate).toLocaleDateString('en-GB')} is <b>{(l.status || '').toLowerCase()}</b>.
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

function AttendanceCalendar({ leaves, title = 'My Attendance' }) {
    const [cursor, setCursor] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
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
                <span>{title}</span>
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
                        const isSelected = selectedDate && d.getTime() === selectedDate.getTime();
                        const showStatusBg = isMonthDay && !isToday;
                        const style = showStatusBg ? dotStyle(status, isWeekend) : null;
                        const bg = isSelected ? '#1e3a8a'
                            : isToday ? '#2563eb'
                            : (style?.background || 'transparent');
                        const fg = isSelected ? '#ffffff'
                            : isToday ? '#ffffff'
                            : (otherMonth ? '#d1d5db' : (style?.color || '#374151'));
                        return (
                            <div key={i}
                                onClick={() => !otherMonth && setSelectedDate(new Date(d))}
                                style={{
                                    width: 32, height: 32, lineHeight: '32px', borderRadius: '50%',
                                    textAlign: 'center', fontSize: 12, fontWeight: 600,
                                    background: bg, color: fg, margin: '0 auto',
                                    cursor: otherMonth ? 'default' : 'pointer',
                                    border: isSelected ? '2px solid #fbbf24' : 'none'
                                }}
                            >
                                {d.getDate()}
                            </div>
                        );
                    })}
                </div>

            </div>

            {/* Modal — opens when a date is clicked */}
            {selectedDate && (() => {
                const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6;
                const dayLeaves = (leaves || []).filter((l) => {
                    const from = new Date(l.fromDate); from.setHours(0, 0, 0, 0);
                    const to = new Date(l.toDate); to.setHours(0, 0, 0, 0);
                    return selectedDate >= from && selectedDate <= to;
                });
                const isToday = selectedDate.getTime() === today.getTime();
                let statusLabel = 'Present';
                let statusColor = '#15803d';
                if (dayLeaves.length > 0) {
                    const l = dayLeaves[0];
                    const isHalf = l.payType === 'Half Paid' || l.leaveType?.toLowerCase().includes('half');
                    statusLabel = isHalf ? 'Half Day Leave' : 'Full Day Leave';
                    statusColor = isHalf ? '#92400e' : '#b91c1c';
                } else if (isWeekend) {
                    statusLabel = 'Weekly Off';
                    statusColor = '#6b7280';
                }
                return (
                    <div
                        onClick={() => setSelectedDate(null)}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'white', borderRadius: 12,
                                width: 560, maxWidth: '94vw', maxHeight: '85vh',
                                display: 'flex', flexDirection: 'column',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
                            }}
                        >
                            {/* Header */}
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
                                        {selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                                    </div>
                                    <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                                        {isToday && <span style={{ padding: '2px 10px', borderRadius: 10, background: '#dbeafe', color: '#1e40af', fontSize: 11, fontWeight: 600 }}>TODAY</span>}
                                        <span style={{
                                            padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                                            background: statusColor + '22', color: statusColor
                                        }}>{statusLabel}</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedDate(null)}
                                    aria-label="Close"
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 22, color: '#6b7280', lineHeight: 1, padding: 0 }}
                                >×</button>
                            </div>
                            {/* Body */}
                            <div style={{ padding: '14px 20px', overflowY: 'auto' }}>
                                {dayLeaves.length === 0 ? (
                                    <div style={{ padding: '24px 0', textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
                                        {isWeekend ? 'No work scheduled.' : 'No leave records on this date.'}
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 10 }}>
                                            {dayLeaves.length} leave record(s) on this date
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {dayLeaves.map((l) => {
                                                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                                                const employeeName = l.employee?.name || l.employee?.email || localUser.name || localUser.email || 'Employee';
                                                return (
                                                    <div key={l._id} style={{ padding: 12, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <span style={{
                                                                    width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)', color: 'white',
                                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700
                                                                }}>{(employeeName[0] || '?').toUpperCase()}</span>
                                                                <b style={{ fontSize: 14, color: '#111827' }}>{employeeName}</b>
                                                            </div>
                                                            <span style={{
                                                                padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                                                                background: l.status === 'Approved' ? '#dcfce7' : l.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                                                                color: l.status === 'Approved' ? '#15803d' : l.status === 'Rejected' ? '#b91c1c' : '#a16207'
                                                            }}>{l.status}</span>
                                                        </div>
                                                        <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>
                                                            <b>{l.leaveType}</b>
                                                            {l.payType ? ` · ${l.payType}` : ''}
                                                            {l.leaveReferenceNumber ? ` · ${l.leaveReferenceNumber}` : ''}
                                                        </div>
                                                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                                                            {new Date(l.fromDate).toLocaleDateString('en-GB')} → {new Date(l.toDate).toLocaleDateString('en-GB')} · {l.totalDays} day(s)
                                                        </div>
                                                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                                                            Applied on {new Date(l.createdAt).toLocaleDateString('en-GB')}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                            {/* Footer */}
                            <div style={{ padding: '12px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedDate(null)}
                                    style={{ background: '#1e3a8a', color: 'white', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                                >Close</button>
                            </div>
                        </div>
                    </div>
                );
            })()}
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

function QuickLink({ to, icon, iconBg, iconColor, label }) {
    return (
        <Link to={to} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 14px', borderBottom: '1px solid #f3f4f6',
            textDecoration: 'none', color: '#374151'
        }}>
            <span style={{
                width: 32, height: 32, borderRadius: 9, background: iconBg, color: iconColor || '#374151',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>{icon}</span>
            <span style={{ fontSize: 13.5, fontWeight: 500, flex: 1 }}>{label}</span>
            <span style={{ color: '#cbd5e1' }}>›</span>
        </Link>
    );
}

export default Dashboard;
