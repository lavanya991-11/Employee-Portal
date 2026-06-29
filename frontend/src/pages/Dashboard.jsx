import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { SessionPill } from '../components/SessionGuard';
import NotificationBell from '../components/NotificationBell';
import { authApi, leaveApi, employeeInfoApi, holidayApi, adminApi, settingsApi } from '../services/api';

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

const QUICK_ACTIONS = [
    { to: '/leaves/apply', icon: '🗓️', grad: 'linear-gradient(135deg,#3b82f6,#2563eb)', label: 'Apply Leave' },
    { to: '/overtimes/apply', icon: '⏰', grad: 'linear-gradient(135deg,#f59e0b,#d97706)', label: 'Request Overtime' },
    { to: '/travels', icon: '✈️', grad: 'linear-gradient(135deg,#0ea5e9,#0284c7)', label: 'Travel Request' },
    { to: '/assets/apply', icon: '🛠️', grad: 'linear-gradient(135deg,#14b8a6,#0d9488)', label: 'Asset Request' },
    { to: '/expenses/apply', icon: '🧾', grad: 'linear-gradient(135deg,#a855f7,#7c3aed)', label: 'Expense Claim' },
    { to: '/payslip', icon: '💰', grad: 'linear-gradient(135deg,#22c55e,#16a34a)', label: 'View Payslip' },
    { to: '/employee-information', icon: '🪪', grad: 'linear-gradient(135deg,#6366f1,#4f46e5)', label: 'Update Profile' },
    { to: '/my-information', icon: '📄', grad: 'linear-gradient(135deg,#f43f5e,#e11d48)', label: 'Documents' }
];

// Demo widgets (no backend yet) — clearly sample data.
const DEMO_BIRTHDAYS = [
    { name: 'Aisha Khan', when: 'Today', initial: 'A', color: '#f43f5e' },
    { name: 'Rahul Verma', when: 'Tomorrow', initial: 'R', color: '#3b82f6' },
    { name: 'Sara Ali', when: 'In 3 days', initial: 'S', color: '#8b5cf6' }
];

function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const [info, setInfo] = useState(null);
    const [recentLeaves, setRecentLeaves] = useState([]);
    const [allLeaves, setAllLeaves] = useState([]);
    const [nextHoliday, setNextHoliday] = useState(null);
    const [bcLeaveBalance, setBcLeaveBalance] = useState(null);
    const [adminStats, setAdminStats] = useState(null);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [, setCompanyLogo] = useState(() => localStorage.getItem('companyLogo') || '');
    const [, setCompanyName] = useState(() => localStorage.getItem('companyName') || '');

    // Premium-UI state (presentation only, no business logic).
    const [dark, setDark] = useState(() => localStorage.getItem('darkMode') === '1');
    const [now, setNow] = useState(new Date());
    const [search, setSearch] = useState('');
    const [note, setNote] = useState(() => localStorage.getItem('dashNote') || '');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        localStorage.setItem('darkMode', dark ? '1' : '0');
    }, [dark]);

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

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

        leaveApi.bcBalanceSummary()
            .then(({ data }) => setBcLeaveBalance(typeof data.totalBalance === 'number' ? data.totalBalance : null))
            .catch(() => setBcLeaveBalance(null));

        const leavesFetcher = isManager ? leaveApi.allLeaves() : leaveApi.myLeaves();
        leavesFetcher.then(({ data }) => {
            const list = data.leaves || [];
            setAllLeaves(list);
            setRecentLeaves(list.slice(0, 5));
        }).catch(() => {});

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

    const hour = now.getHours();
    const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const pendingLeaves = allLeaves.filter((l) => l.status === 'Pending').length;
    const approvedLeaves = allLeaves.filter((l) => l.status === 'Approved').length;
    const totalLeaves = allLeaves.length || 1;

    const ANNUAL_LEAVE_ALLOWANCE = 30;
    const metrics = useMemo(() => {
        const uid = String(user?._id || user?.id || '');
        const mine = allLeaves.filter((l) => {
            const eid = String(l.employee?._id || l.employee || '');
            return !uid || eid === uid;
        });
        const approved = mine.filter((l) => l.status === 'Approved');

        const nowD = new Date();
        const year = nowD.getFullYear();
        const month = nowD.getMonth();
        const monthStart = new Date(year, month, 1);
        const todayEnd = new Date(year, month, nowD.getDate(), 23, 59, 59, 999);
        const isWeekday = (d) => d.getDay() !== 0 && d.getDay() !== 6;

        const weekdaysBetween = (fromD, toD, lo, hi) => {
            const start = new Date(Math.max(fromD.getTime(), lo.getTime()));
            const end = new Date(Math.min(toD.getTime(), hi.getTime()));
            let n = 0;
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) if (isWeekday(d)) n++;
            return n;
        };

        let usedThisYear = 0;
        let usedThisMonth = 0;
        approved.forEach((l) => {
            const f = new Date(l.fromDate);
            const days = Number(l.totalDays) || 0;
            if (f.getFullYear() === year) usedThisYear += days;
            if (f.getFullYear() === year && f.getMonth() === month) usedThisMonth += days;
        });

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
    const leaveBalance = bcLeaveBalance != null ? bcLeaveBalance : metrics.leaveBalance;

    const filteredQuick = QUICK_ACTIONS.filter((q) => q.label.toLowerCase().includes(search.trim().toLowerCase()));

    const KPIS = [
        { label: 'Present Days', value: metrics.presentDays, sub: 'This month (working days)', icon: '📅', bg: '#eff6ff', fg: '#2563eb', accent: '#2563eb', pct: (metrics.presentDays / 22) * 100, trend: `${metrics.usedThisMonth} leave day(s)`, up: true },
        { label: 'Leave Balance', value: leaveBalance, sub: bcLeaveBalance != null ? 'From Business Central' : 'Days left this year', icon: '🌴', bg: '#dcfce7', fg: '#15803d', accent: '#22c55e', pct: (leaveBalance / ANNUAL_LEAVE_ALLOWANCE) * 100, trend: `${metrics.usedThisYear} used`, up: false },
        { label: 'Working Hours', value: metrics.workingHours, sub: 'This month', icon: '⏰', bg: '#fef3c7', fg: '#b45309', accent: '#f59e0b', pct: (metrics.workingHours / 176) * 100, trend: `${metrics.presentDays} × 8h`, up: true },
        { label: 'Pending Requests', value: pendingLeaves, sub: 'Awaiting action', icon: '⏳', bg: '#ffedd5', fg: '#c2410c', accent: '#f97316', pct: (pendingLeaves / totalLeaves) * 100, trend: 'this period', up: false },
        { label: 'Approved Requests', value: approvedLeaves, sub: 'Leaves approved', icon: '✅', bg: '#d1fae5', fg: '#047857', accent: '#10b981', pct: (approvedLeaves / totalLeaves) * 100, trend: 'this period', up: true },
        { label: 'Upcoming Holiday', value: nextHoliday?.description || '—', sub: nextHoliday ? new Date(nextHoliday.fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No upcoming holiday', icon: '🎉', bg: '#ede9fe', fg: '#6d28d9', accent: '#8b5cf6', sm: true }
    ];

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                {/* Glassmorphism sticky header */}
                <div className="glass-header">
                    <div className="gh-greeting">
                        <h2>Good {timeOfDay}, {displayName} 👋</h2>
                        <p>{displayDesignation} • {displayDepartment}</p>
                    </div>
                    <div className="gh-search">
                        <span className="si">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </span>
                        <input placeholder="Search quick actions…" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="gh-actions">
                        <span className="gh-time">🕒 {timeStr}</span>
                        <button type="button" className="gh-iconbtn" title="Toggle dark mode" onClick={() => setDark((v) => !v)}>
                            {dark ? '☀️' : '🌙'}
                        </button>
                        <SessionPill />
                        <NotificationBell />
                        <div style={{ position: 'relative' }}>
                            <button type="button" onClick={() => setUserMenuOpen((v) => !v)}
                                style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>
                                <span className="gh-avatar">{avatarInitial}</span>
                            </button>
                            {userMenuOpen && (
                                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'var(--surface)', border: '1px solid var(--line-soft)', borderRadius: 12, boxShadow: 'var(--shadow-md)', minWidth: 190, zIndex: 50, overflow: 'hidden' }}>
                                    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line-soft)', fontSize: 12, color: 'var(--muted)' }}>{user.email || ''}</div>
                                    <button type="button" onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--ink)' }}>
                                        <span>👤</span> My Profile
                                    </button>
                                    <button type="button" onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#dc2626', fontWeight: 600 }}>
                                        <span>↪</span> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Admin collections (managers) */}
                {isManager && adminStats && (
                    <div className="section-card">
                        <div className="section-head">
                            <h3>All Collections</h3>
                            <button type="button" onClick={loadAdminStats} className="erp-action-btn">🔄 Refresh</button>
                        </div>
                        <div style={{ padding: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
                            {ADMIN_TILES.map((t) => {
                                const total = adminStats.totals?.[t.key] ?? 0;
                                const pending = adminStats.pending?.[t.key];
                                return (
                                    <Link to={t.path} key={t.key} className="kpi-card" style={{ '--kpi': t.color, padding: 14 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 38, height: 38, borderRadius: 11, background: t.color, color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{t.icon}</div>
                                            <div>
                                                <div className="kpi-label">{t.title}</div>
                                                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.1 }}>{total}</div>
                                                {pending !== undefined && <div style={{ fontSize: 11, color: '#b45309', marginTop: 2 }}>{pending} pending</div>}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* KPI cards */}
                <div className="kpi-grid">
                    {KPIS.map((k) => (
                        <div className="kpi-card" key={k.label} style={{ '--kpi': k.accent }}>
                            <div className="kpi-top">
                                <div style={{ minWidth: 0 }}>
                                    <div className="kpi-label">{k.label}</div>
                                    <div className={`kpi-value${k.sm ? ' sm' : ''}`} style={k.sm ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : null}>{k.value}</div>
                                    <div className="kpi-sub">{k.sub}</div>
                                </div>
                                <div className="kpi-icon" style={{ background: k.bg, color: k.fg }}>{k.icon}</div>
                            </div>
                            {k.trend && <div className="kpi-trend" style={{ color: k.up ? '#16a34a' : '#94a3b8' }}>{k.up ? '↑' : '•'} {k.trend}</div>}
                            {k.pct != null && <div className="kpi-bar"><span style={{ width: `${Math.min(100, Math.max(3, k.pct))}%` }} /></div>}
                        </div>
                    ))}
                </div>

                {/* Quick actions */}
                <div className="section-card">
                    <div className="section-head"><h3>Quick Actions</h3></div>
                    <div className="qa-grid">
                        {filteredQuick.map((q) => (
                            <Link to={q.to} key={q.label} className="qa-card">
                                <span className="qa-ic" style={{ background: q.grad }}>{q.icon}</span>
                                <span className="qa-label">{q.label}</span>
                            </Link>
                        ))}
                        {filteredQuick.length === 0 && <p style={{ color: 'var(--muted)', padding: 8 }}>No actions match “{search}”.</p>}
                    </div>
                </div>

                {/* Main + right panel */}
                <div className="dash-cols">
                    <div>
                        {/* Announcements */}
                        <div className="section-card">
                            <div className="section-head"><h3>Announcements</h3><Link to="/announcements">View All</Link></div>
                            <div>
                                <div className="tl-item">
                                    <div className="tl-ic" style={{ background: '#dbeafe' }}>📢</div>
                                    <div>
                                        <div className="tl-title">Welcome to the new Employee Portal <span className="pill-new">New</span> <span className="pill-pin">📌 Pinned</span></div>
                                        <div className="tl-desc">Use the sidebar to navigate Leave, Loan, Expenses and more.</div>
                                        <div className="tl-meta">HR Department · today</div>
                                    </div>
                                </div>
                                <div className="tl-item">
                                    <div className="tl-ic" style={{ background: '#dcfce7' }}>📋</div>
                                    <div>
                                        <div className="tl-title">Holidays for {new Date().getFullYear()} are now live</div>
                                        <div className="tl-desc">See the Holidays page for the official calendar from Business Central.</div>
                                        <div className="tl-meta">HR Department · today</div>
                                    </div>
                                </div>
                                <div className="tl-item">
                                    <div className="tl-ic" style={{ background: '#fce7f3' }}>👥</div>
                                    <div>
                                        <div className="tl-title">Apply Leave now auto-splits Paid + Unpaid</div>
                                        <div className="tl-desc">When a request exceeds the balance, the system splits and posts to BC.</div>
                                        <div className="tl-meta">System · this week</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Attendance */}
                        <AttendanceCalendar leaves={allLeaves} title={isManager ? 'Employee Attendance' : 'My Attendance'} />

                        {/* Recent activities */}
                        <div className="section-card">
                            <div className="section-head"><h3>Recent Activities</h3><Link to="/leaves/my">View All</Link></div>
                            <div>
                                {recentLeaves.length === 0 ? (
                                    <p style={{ color: 'var(--muted)', fontSize: 13, padding: '16px 20px', margin: 0 }}>No recent activity.</p>
                                ) : recentLeaves.slice(0, 5).map((l) => {
                                    const st = l.status || 'Pending';
                                    const map = {
                                        Approved: { dot: '#22c55e', bg: '#dcfce7', fg: '#15803d' },
                                        Rejected: { dot: '#ef4444', bg: '#fee2e2', fg: '#b91c1c' },
                                        Cancelled: { dot: '#94a3b8', bg: '#f1f5f9', fg: '#475569' },
                                        Pending: { dot: '#f59e0b', bg: '#fef3c7', fg: '#b45309' }
                                    }[st] || { dot: '#f59e0b', bg: '#fef3c7', fg: '#b45309' };
                                    return (
                                        <div key={`act-${l._id}`} className="act-row">
                                            <span className="act-dot" style={{ background: map.dot }} />
                                            <div style={{ flex: 1, fontSize: 13, color: 'var(--ink)' }}>
                                                Leave request for {new Date(l.fromDate).toLocaleDateString('en-GB')}
                                            </div>
                                            <span className="act-badge" style={{ background: map.bg, color: map.fg }}>{st}</span>
                                            <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{new Date(l.createdAt).toLocaleDateString('en-GB')}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right panel widgets */}
                    <div>
                        <div className="mini-card">
                            <div className="mini-head">⏳ Pending Approvals</div>
                            <div className="mini-body">
                                <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--ink)' }}>{pendingLeaves}</div>
                                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>requests awaiting action</div>
                                <Link to={isManager ? '/approvals' : '/leaves/my'} className="erp-action-btn" style={{ display: 'inline-flex' }}>Review →</Link>
                            </div>
                        </div>

                        <div className="mini-card">
                            <div className="mini-head">🎉 Upcoming Holiday</div>
                            <div className="mini-body">
                                {nextHoliday ? (
                                    <>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{nextHoliday.description}</div>
                                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{new Date(nextHoliday.fromDate).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div>
                                    </>
                                ) : <div style={{ fontSize: 13, color: 'var(--muted)' }}>No upcoming holiday.</div>}
                                <Link to="/holidays" style={{ display: 'inline-block', marginTop: 10, fontSize: 12, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>View calendar →</Link>
                            </div>
                        </div>

                        <div className="mini-card">
                            <div className="mini-head">🎂 Upcoming Birthdays <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>sample</span></div>
                            <div className="mini-body" style={{ paddingTop: 4, paddingBottom: 4 }}>
                                {DEMO_BIRTHDAYS.map((b) => (
                                    <div className="mini-row" key={b.name}>
                                        <span className="mini-av" style={{ background: b.color + '22', color: b.color }}>{b.initial}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{b.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{b.when}</div>
                                        </div>
                                        <span style={{ fontSize: 16 }}>🎈</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mini-card">
                            <div className="mini-head">🔔 Important Reminders</div>
                            <div className="mini-body">
                                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                    <span style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🗓️</span>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Submit your timesheet</div>
                                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Don’t forget to submit before month-end.</div>
                                        <Link to="/attendance" className="btn" style={{ display: 'inline-flex', marginTop: 10, fontSize: 12, padding: '7px 14px' }}>Submit Now</Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mini-card">
                            <div className="mini-head">📝 Quick Notes</div>
                            <div className="mini-body">
                                <textarea
                                    value={note}
                                    onChange={(e) => { setNote(e.target.value); localStorage.setItem('dashNote', e.target.value); }}
                                    placeholder="Jot something down…"
                                    style={{ width: '100%', minHeight: 84, resize: 'vertical', border: '1px solid var(--input-border)', borderRadius: 10, padding: 10, fontSize: 13, fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--ink)' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating action button → apply leave */}
                <button type="button" className="fab" title="Apply Leave" onClick={() => navigate('/leaves/apply')}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </button>
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

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
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
        if (status === 'full') return { background: '#fee2e2', color: '#b91c1c' };
        if (status === 'half') return { background: '#f5e6d3', color: '#92400e' };
        if (isWeekend) return { background: '#e5e7eb', color: '#6b7280' };
        return { background: '#dcfce7', color: '#15803d' };
    };

    return (
        <div className="section-card">
            <div className="section-head">
                <h3>{title}</h3>
                <Link to="/leaves/my">View All</Link>
            </div>
            <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', borderBottom: '1px solid var(--line-soft)' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', flex: 1 }}>{monthLabel}</span>
                <button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))} style={attBtn}>‹</button>
                <button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))} style={attBtn}>›</button>
                <span style={legendItem}><span style={{ ...legendDot, background: '#22c55e' }} /> Present</span>
                <span style={legendItem}><span style={{ ...legendDot, background: '#ef4444' }} /> Full Leave</span>
                <span style={legendItem}><span style={{ ...legendDot, background: '#92400e' }} /> Half Day</span>
                <span style={legendItem}><span style={{ ...legendDot, background: '#9ca3af' }} /> Weekly Off</span>
            </div>
            <div style={{ padding: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dn) => (
                        <div key={dn} style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{dn}</div>
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
                        const bg = isSelected ? '#1e3a8a' : isToday ? '#2563eb' : (style?.background || 'transparent');
                        const fg = isSelected ? '#ffffff' : isToday ? '#ffffff' : (otherMonth ? '#cbd5e1' : (style?.color || 'var(--ink)'));
                        return (
                            <div key={i} onClick={() => !otherMonth && setSelectedDate(new Date(d))}
                                style={{ width: 34, height: 34, lineHeight: '34px', borderRadius: '50%', textAlign: 'center', fontSize: 12, fontWeight: 600, background: bg, color: fg, margin: '0 auto', cursor: otherMonth ? 'default' : 'pointer', border: isSelected ? '2px solid #fbbf24' : 'none' }}>
                                {d.getDate()}
                            </div>
                        );
                    })}
                </div>
            </div>

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
                    <div onClick={() => setSelectedDate(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                        <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 16, width: 560, maxWidth: '94vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div>
                                    <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                                        {isToday && <span style={{ padding: '2px 10px', borderRadius: 10, background: '#dbeafe', color: '#1e40af', fontSize: 11, fontWeight: 600 }}>TODAY</span>}
                                        <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: statusColor + '22', color: statusColor }}>{statusLabel}</span>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setSelectedDate(null)} aria-label="Close" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--muted)', lineHeight: 1, padding: 0 }}>×</button>
                            </div>
                            <div style={{ padding: '14px 20px', overflowY: 'auto' }}>
                                {dayLeaves.length === 0 ? (
                                    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{isWeekend ? 'No work scheduled.' : 'No leave records on this date.'}</div>
                                ) : (
                                    <>
                                        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 10 }}>{dayLeaves.length} leave record(s) on this date</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {dayLeaves.map((l) => {
                                                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                                                const employeeName = l.employee?.name || l.employee?.email || localUser.name || localUser.email || 'Employee';
                                                return (
                                                    <div key={l._id} style={{ padding: 12, background: 'var(--bg)', border: '1px solid var(--line-soft)', borderRadius: 10 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{(employeeName[0] || '?').toUpperCase()}</span>
                                                                <b style={{ fontSize: 14, color: 'var(--ink)' }}>{employeeName}</b>
                                                            </div>
                                                            <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: l.status === 'Approved' ? '#dcfce7' : l.status === 'Rejected' ? '#fee2e2' : '#fef3c7', color: l.status === 'Approved' ? '#15803d' : l.status === 'Rejected' ? '#b91c1c' : '#a16207' }}>{l.status}</span>
                                                        </div>
                                                        <div style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 4 }}><b>{l.leaveType}</b>{l.payType ? ` · ${l.payType}` : ''}{l.leaveReferenceNumber ? ` · ${l.leaveReferenceNumber}` : ''}</div>
                                                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(l.fromDate).toLocaleDateString('en-GB')} → {new Date(l.toDate).toLocaleDateString('en-GB')} · {l.totalDays} day(s)</div>
                                                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Applied on {new Date(l.createdAt).toLocaleDateString('en-GB')}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setSelectedDate(null)} className="btn">Close</button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

const attBtn = { width: 26, height: 26, borderRadius: 8, border: '1px solid var(--input-border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 12, lineHeight: 1, color: 'var(--ink)' };
const legendItem = { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--muted)' };
const legendDot = { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' };

export default Dashboard;
