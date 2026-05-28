import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { authApi, leaveApi, employeeInfoApi } from '../services/api';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function CircleStat({ label, value, total, color }) {
    const pct = total ? Math.round((value / total) * 100) : 0;
    const circ = 2 * Math.PI * 36;
    const offset = circ - (pct / 100) * circ;
    return (
        <div className="leave-stat">
            <div className="leave-stat-title">{label}</div>
            <svg width="90" height="90">
                <circle cx="45" cy="45" r="36" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle cx="45" cy="45" r="36" fill="none" stroke={color} strokeWidth="8"
                    strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 45 45)" />
                <text x="45" y="48" textAnchor="middle" fontSize="20" fontWeight="700" fill="#111827">{value}</text>
                <text x="45" y="62" textAnchor="middle" fontSize="9" fill="#6b7280">AOD</text>
            </svg>
            <div className="leave-stat-numbers">
                <div><b>{total}</b><span>Assigned</span></div>
                <div><b>{total - value}</b><span>Bal</span></div>
                <div><b>{value}</b><span>Availed</span></div>
            </div>
        </div>
    );
}

function MyInformation() {
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const [employeeInfo, setEmployeeInfo] = useState(null);
    const [leaves, setLeaves] = useState([]);
    const [checkInTime, setCheckInTime] = useState('--:--');
    const [checkOutTime, setCheckOutTime] = useState('--:--');
    const [calendarDate, setCalendarDate] = useState(new Date());

    useEffect(() => {
        authApi.me().then(({ data }) => {
            const fresh = data.user || data;
            setUser(fresh);
            localStorage.setItem('user', JSON.stringify(fresh));
        }).catch(() => {});

        employeeInfoApi.getMy().then(({ data }) => {
            setEmployeeInfo(data.employeeInfo || null);
        }).catch(() => {});

        leaveApi.myLeaves().then(({ data }) => {
            setLeaves(data.leaves || []);
        }).catch(() => {});
    }, []);

    const sickAvailed = leaves.filter((l) => l.leaveType === 'Sick' && l.status === 'Approved').reduce((s, l) => s + (l.totalDays || 0), 0);
    const casualAvailed = leaves.filter((l) => l.leaveType === 'Casual' && l.status === 'Approved').reduce((s, l) => s + (l.totalDays || 0), 0);

    const handleCheckIn = () => {
        setCheckInTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    };
    const handleCheckOut = () => {
        setCheckOutTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    };

    const changeMonth = (delta) => {
        setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    const monthLabel = calendarDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    const monthDays = useMemo(() => {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        const todayStr = today.toDateString();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const demo = ['P', 'A', 'P', 'H', 'P', 'S', 'P', 'P', 'L', 'P', 'P', 'A'];
        const days = [];
        for (let n = 1; n <= daysInMonth; n++) {
            const d = new Date(year, month, n);
            const wd = d.getDay();
            const isToday = d.toDateString() === todayStr;
            const isWeekend = wd === 0 || wd === 6;
            const isFuture = d > today && !isToday;
            let mark = '';
            if (isWeekend) mark = 'W';
            else if (isFuture) mark = '';
            else if (isToday) mark = 'P';
            else mark = demo[(n - 1) % demo.length];
            days.push({ name: dayNames[wd], date: n, mark, time: mark === 'S' ? '12:37' : '', isToday });
        }
        return days;
    }, [calendarDate]);

    const legend = [
        { key: 'P', label: 'Present', color: '#22c55e' },
        { key: 'A', label: 'Absent', color: '#ef4444' },
        { key: 'H', label: 'Holiday', color: '#3b82f6' },
        { key: 'W', label: 'Weekly Off', color: '#14b8a6' },
        { key: 'S', label: 'Single Punch', color: '#f59e0b' },
        { key: 'L', label: 'Leave', color: '#1e3a8a' }
    ].map((l) => ({ ...l, count: monthDays.filter((d) => d.mark === l.key).length }));

    const info = employeeInfo || {};
    const adm = info.administration || {};

    const fields = [
        { label: 'Business Entity', value: user.businessEntity },
        { label: 'Employee Type', value: info.employmentType || adm.employmentType || user.employeeType || 'Permanent' },
        { label: 'Date of Birth', value: fmt(adm.birthDate || user.dateOfBirth) },
        { label: 'Date of Joining', value: fmt(info.dateOfJoining || user.dateOfJoining) },
        { label: 'Confirmation Date', value: fmt(adm.seniorityDate || user.confirmationDate) },
        { label: 'Reporting Manager', value: info.reportingManager || user.reportingManager },
        { label: 'Grade', value: info.grade || user.grade },
        { label: 'Email', value: user.email || adm.email },
        { label: 'Contact No', value: info.emergencyContactNo || user.contactNumber || user.contactNo },
        { label: 'Service', value: user.service },
        { label: 'Next Shift', value: user.nextShift }
    ];

    const displayName = [info.firstName, info.lastName].filter(Boolean).join(' ') || user.name || 'Employee';
    const displayDesignation = info.jobTitle || info.designation || user.designation || '';

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-title">
                    <h2>Employee</h2>
                </div>

                <div className="emp-banner">
                    <div className="emp-banner-avatar">
                        <div className="avatar-circle">
                            {user.profilePicture ? <img src={user.profilePicture} alt="" /> : '👤'}
                        </div>
                        <div className="emp-banner-name">{user.empId || info.employeeCode || 'ID'} - {displayName}</div>
                        <div className="emp-banner-designation">{displayDesignation}</div>
                    </div>
                    <div className="emp-banner-fields">
                        {fields.map((f) => (
                            <div className="emp-field" key={f.label}>
                                <div className="emp-field-label">{f.label}</div>
                                <div className="emp-field-value">{f.value || '—'}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="info-grid">
                    <div className="info-panel attendance-panel">
                        <div className="info-panel-header">
                            <h3>Attendance</h3>
                            <input type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
                        </div>
                        <div className="attendance-buttons">
                            <div>
                                <button className="btn btn-checkin" onClick={handleCheckIn}>Check In</button>
                                <div className="attendance-time">{checkInTime}</div>
                            </div>
                            <div>
                                <button className="btn btn-checkout" onClick={handleCheckOut}>Check Out</button>
                                <div className="attendance-time">{checkOutTime}</div>
                            </div>
                        </div>
                    </div>

                    <div className="info-panel leaves-panel">
                        <h3>Leaves</h3>
                        <div className="leaves-stats">
                            <CircleStat label="SickLeaves" value={sickAvailed} total={21} color="#3b82f6" />
                            <CircleStat label="CasualLeaves" value={casualAvailed} total={12} color="#22c55e" />
                        </div>
                    </div>

                    <div className="info-panel holidays-panel">
                        <h3>Upcoming Holidays</h3>
                        <div className="holiday-content">
                            <div className="holiday-date">
                                <div className="holiday-day">11</div>
                                <div className="holiday-month">Oct</div>
                                <div className="holiday-weekday">Fri | 2024</div>
                            </div>
                            <div className="holiday-name">Saraswathi Pooja, Ayutha Pooja</div>
                        </div>
                    </div>
                </div>

                <div className="info-panel">
                    <div className="info-panel-header">
                        <h3>My Calendar</h3>
                        <div className="cal-nav">
                            <button type="button" onClick={() => changeMonth(-1)}>‹</button>
                            <span>{monthLabel}</span>
                            <button type="button" onClick={() => changeMonth(1)}>›</button>
                        </div>
                    </div>
                    <div className="calendar-legend">
                        {legend.map((l) => (
                            <div className="cal-legend-item" key={l.key}>
                                <span className="cal-legend-count" style={{ background: l.color }}>{l.count}</span>
                                {l.label}
                            </div>
                        ))}
                    </div>
                    <div className="calendar-month">
                        {monthDays.map((d) => (
                            <div className={`cal-day ${d.isToday ? 'today' : ''}`} key={d.date}>
                                <div className="cal-day-name">{d.name}</div>
                                <div className="cal-day-num">{String(d.date).padStart(2, '0')}</div>
                                <div className={`cal-day-mark mark-${d.mark}`}>{d.mark}</div>
                                {d.time && <div className="cal-day-time">{d.time}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default MyInformation;
