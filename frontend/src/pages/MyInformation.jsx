import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { authApi, leaveApi, employeeInfoApi, finElementApi, holidayApi } from '../services/api';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function CircleStat({ options, selected, onChange, assigned, balance, availed, color }) {
    const total = Number(assigned) || 0;
    const value = Number(availed) || 0;
    const pct = total ? Math.round((value / total) * 100) : 0;
    const circ = 2 * Math.PI * 28;
    const offset = circ - (pct / 100) * circ;
    return (
        <div className="leave-stat">
            <div className="leave-stat-title">
                <select
                    value={selected ?? ''}
                    onChange={(e) => onChange(Number(e.target.value))}
                    style={{ fontSize: 12, padding: '2px 6px', border: '1px solid #d1d5db', borderRadius: 4, fontWeight: 600 }}
                >
                    {options.length === 0 && <option value="">No leave types</option>}
                    {options.map((o) => (
                        <option key={o.finId} value={o.finId}>{o.finId} - {o.description}</option>
                    ))}
                </select>
            </div>
            <svg width="74" height="74">
                <circle cx="37" cy="37" r="28" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                <circle cx="37" cy="37" r="28" fill="none" stroke={color} strokeWidth="6"
                    strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 37 37)" />
                <text x="37" y="40" textAnchor="middle" fontSize="18" fontWeight="700" fill="#111827">{value}</text>
                <text x="37" y="54" textAnchor="middle" fontSize="8" fill="#6b7280">AOD</text>
            </svg>
            <div className="leave-stat-numbers">
                <div><b>{total}</b><span>Assigned</span></div>
                <div><b>{Number(balance) || 0}</b><span>Bal</span></div>
                <div><b>{value}</b><span>Availed</span></div>
            </div>
        </div>
    );
}

function MyInformation() {
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const [employeeInfo, setEmployeeInfo] = useState(null);
    const [allEmployees, setAllEmployees] = useState([]);
    const [selectedEmpCode, setSelectedEmpCode] = useState('');
    const [leaves, setLeaves] = useState([]);
    const [leaveOptions, setLeaveOptions] = useState([]); // [{ finId, description }]
    const [leftFinId, setLeftFinId] = useState(null);
    const [rightFinId, setRightFinId] = useState(null);
    const [leftBal, setLeftBal] = useState({ entitlement: 0, taken: 0, balance: 0 });
    const [rightBal, setRightBal] = useState({ entitlement: 0, taken: 0, balance: 0 });
    const [checkInTime, setCheckInTime] = useState('--:--');
    const [checkOutTime, setCheckOutTime] = useState('--:--');
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [holidayIndex, setHolidayIndex] = useState(0);

    const [holidays, setHolidays] = useState([]);

    useEffect(() => {
        authApi.me().then(({ data }) => {
            const fresh = data.user || data;
            setUser(fresh);
            localStorage.setItem('user', JSON.stringify(fresh));
        }).catch(() => {});

        employeeInfoApi.getMy().then(({ data }) => {
            const info = data.employeeInfo || null;
            setEmployeeInfo(info);
            if (info?.employeeCode) setSelectedEmpCode(info.employeeCode);
        }).catch(() => {});

        // Only admin / super-admin should see all employees in the picker.
        const role = JSON.parse(localStorage.getItem('user') || '{}').role;
        if (['admin', 'super-admin'].includes(role)) {
            employeeInfoApi.getAll().then(({ data }) => {
                setAllEmployees(data.employees || []);
            }).catch(() => {});
        }

        leaveApi.myLeaves().then(({ data }) => {
            setLeaves(data.leaves || []);
        }).catch(() => {});

        // Show ALL BC holidays for current + next year, upcoming first then past.
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const thisYear = today.getFullYear();
        const mapHoliday = (h) => {
            const d = new Date(h.fromDate || h.date);
            if (isNaN(d)) return null;
            return {
                iso: d.toISOString(),
                day: String(d.getDate()).padStart(2, '0'),
                month: d.toLocaleDateString('en-GB', { month: 'short' }),
                weekday: d.toLocaleDateString('en-GB', { weekday: 'short' }),
                year: String(d.getFullYear()),
                name: h.description || h.name || 'Holiday'
            };
        };
        Promise.all([
            holidayApi.list(thisYear).catch(() => ({ data: { holidays: [] } })),
            holidayApi.list(thisYear + 1).catch(() => ({ data: { holidays: [] } }))
        ]).then(([cur, next]) => {
            const all = [...(cur.data.holidays || []), ...(next.data.holidays || [])]
                .map(mapHoliday)
                .filter(Boolean)
                .sort((a, b) => new Date(a.iso) - new Date(b.iso));
            const upcoming = all.filter((h) => new Date(h.iso) >= today);
            const past = all.filter((h) => new Date(h.iso) < today);
            setHolidays([...upcoming, ...past]); // upcoming shown first, past after
        });

        finElementApi.list().then(({ data }) => {
            const items = (data.items || [])
                .filter((it) => ['PaidLeave', 'UnPaidLeave'].includes(it.finType))
                .map((it) => ({ finId: it.finId, description: it.description || `FIN ${it.finId}` }));
            setLeaveOptions(items);
            if (items[0]) setLeftFinId(items[0].finId);
            if (items[1]) setRightFinId(items[1].finId);
            else if (items[0]) setRightFinId(items[0].finId);
        }).catch(() => {});
    }, []);

    // Fetch BC balance for the LEFT card whenever the selected leave type changes.
    useEffect(() => {
        if (!leftFinId) return;
        leaveApi.bcBalance(leftFinId).then(({ data }) => {
            const r = data.result || {};
            setLeftBal({ entitlement: Number(r.entitlement) || 0, taken: Number(r.taken) || 0, balance: Number(r.balance) || 0 });
        }).catch(() => setLeftBal({ entitlement: 0, taken: 0, balance: 0 }));
    }, [leftFinId]);

    // Fetch BC balance for the RIGHT card whenever the selected leave type changes.
    useEffect(() => {
        if (!rightFinId) return;
        leaveApi.bcBalance(rightFinId).then(({ data }) => {
            const r = data.result || {};
            setRightBal({ entitlement: Number(r.entitlement) || 0, taken: Number(r.taken) || 0, balance: Number(r.balance) || 0 });
        }).catch(() => setRightBal({ entitlement: 0, taken: 0, balance: 0 }));
    }, [rightFinId]);

    const availedFor = (finId) => leaves
        .filter((l) => l.leaveFinId === finId && l.status === 'Approved')
        .reduce((s, l) => s + (l.totalDays || 0), 0);

    const handleCheckIn = () => {
        setCheckInTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    };
    const handleCheckOut = () => {
        setCheckOutTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    };

    const changeMonth = (delta) => {
        setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    const monthLabel = calendarDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).replace(' ', '/');
    const loginTime = useMemo(() => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), []);

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
                <PageHeader pageName="My Information" />
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
                        <div className="info-panel-header">
                            <h3>Leaves</h3>
                            {allEmployees.length > 0 ? (
                                <select
                                    className="leaves-emp-select"
                                    value={selectedEmpCode || user.empId || info.employeeCode || ''}
                                    onChange={(e) => setSelectedEmpCode(e.target.value)}
                                >
                                    {allEmployees.map((emp) => (
                                        <option key={emp._id} value={emp.employeeCode}>
                                            {emp.employeeCode}{emp.firstName ? ` - ${emp.firstName}` : ''}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    readOnly
                                    value={info.employeeCode || user.empId || ''}
                                    style={{
                                        background: '#f3f4f6', color: '#6b7280',
                                        border: '1px solid #e5e7eb', borderRadius: 4,
                                        padding: '4px 10px', fontSize: 13, fontWeight: 600,
                                        width: 90, textAlign: 'center', cursor: 'not-allowed'
                                    }}
                                />
                            )}
                        </div>
                        <div className="leaves-stats">
                            <CircleStat
                                options={leaveOptions}
                                selected={leftFinId}
                                onChange={setLeftFinId}
                                assigned={leftBal.entitlement}
                                balance={leftBal.balance}
                                availed={availedFor(leftFinId)}
                                color="#3b82f6"
                            />
                        </div>
                    </div>

                    <div className="info-panel holidays-panel holidays-compact">
                        <div className="holidays-header">
                            <h3>Holidays</h3>
                            <div className="holidays-nav">
                                <button type="button" title="Grid view" onClick={() => setHolidayIndex(0)}>⊞</button>
                                <button type="button" title="Previous" onClick={() => setHolidayIndex((i) => (i - 1 + holidays.length) % holidays.length)}>‹</button>
                                <button type="button" title="Next" onClick={() => setHolidayIndex((i) => (i + 1) % holidays.length)}>›</button>
                            </div>
                        </div>
                        <div className="holiday-content">
                            {holidays.length === 0 ? (
                                <div style={{ padding: 20, textAlign: 'center', color: 'white', opacity: 0.9 }}>
                                    No holidays found.
                                </div>
                            ) : (
                                <>
                                    <div className="holiday-date">
                                        <div className="holiday-day">{holidays[holidayIndex % holidays.length].day}</div>
                                        <div className="holiday-month">{holidays[holidayIndex % holidays.length].month}</div>
                                        <div className="holiday-weekday">{holidays[holidayIndex % holidays.length].weekday} | {holidays[holidayIndex % holidays.length].year}</div>
                                    </div>
                                    <div className="holiday-divider" />
                                    <div className="holiday-name">{holidays[holidayIndex % holidays.length].name}</div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="info-panel">
                    <div className="info-panel-header calendar-header-row">
                        <h3>My Calendar</h3>
                        {allEmployees.length > 0 ? (
                            <select
                                className="leaves-emp-select"
                                value={selectedEmpCode || user.empId || info.employeeCode || ''}
                                onChange={(e) => setSelectedEmpCode(e.target.value)}
                            >
                                {allEmployees.map((emp) => (
                                    <option key={emp._id} value={emp.employeeCode}>
                                        {emp.employeeCode}{emp.firstName ? ` - ${emp.firstName}` : ''}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                readOnly
                                value={info.employeeCode || user.empId || ''}
                                style={{
                                    background: '#f3f4f6', color: '#6b7280',
                                    border: '1px solid #e5e7eb', borderRadius: 4,
                                    padding: '4px 10px', fontSize: 13, fontWeight: 600,
                                    width: 90, textAlign: 'center', cursor: 'not-allowed'
                                }}
                            />
                        )}
                        <div className="calendar-legend">
                            {legend.map((l) => (
                                <div className="cal-legend-item" key={l.key}>
                                    <span className="cal-legend-count" style={{ background: l.color }}>{l.count}</span>
                                    {l.label}
                                </div>
                            ))}
                        </div>
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
                    <div className="calendar-footer">
                        <span><b>Company Name:</b> SRM</span>
                        <span><b>Accounting Date:</b> {new Date().toLocaleDateString('en-GB')}</span>
                        <span><b>Business Entity:</b> Fourth Dimension Media Solutions Private Limited</span>
                        <span><b>Location:</b> {adm.location || adm.city || 'G N Chetty Road'}</span>
                        <span><b>Version:</b> 24.2.0</span>
                        <span><b>Payroll Month:</b> {monthLabel}</span>
                        <span><b>Login Time:</b> {loginTime}</span>
                        <span><b>Approvals:</b> 0</span>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default MyInformation;
