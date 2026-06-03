import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { employeeInfoApi } from '../services/api';

function Sidebar() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [info, setInfo] = useState(null);
    const [openMenu, setOpenMenu] = useState('');

    useEffect(() => {
        employeeInfoApi.getMy()
            .then(({ data }) => setInfo(data.employeeInfo || null))
            .catch(() => {});
    }, []);

    const toggle = (name) => setOpenMenu(openMenu === name ? '' : name);

    const displayName = [info?.firstName, info?.middleName, info?.lastName].filter(Boolean).join(' ')
        || user.name || 'User';
    const displayCode = info?.employeeCode || user.empId;

    return (
        <aside className="sidebar">
            <div className="sidebar-profile">
                <div className="avatar">
                    {user.profilePicture ? <img src={user.profilePicture} alt="" /> : '👤'}
                </div>
                <div className="user-id">
                    {displayCode ? `${displayCode} - ${displayName}` : displayName}
                </div>
            </div>

            <nav className="sidebar-nav">
                <Link to="/dashboard" className="nav-item">
                    <span className="nav-item-icon">🏠</span> Dashboard
                </Link>

                <Link to="/employee-information" className="nav-item">
                    <span className="nav-item-icon">👨‍💼</span> Employee Information
                </Link>

                <div className="nav-item" onClick={() => toggle('payroll')}>
                    <span className="nav-item-icon">💼</span> Payroll
                    <span className="nav-item-caret">{openMenu === 'payroll' ? '▼' : '▶'}</span>
                </div>
                {openMenu === 'payroll' && (
                    <>
                        <Link to="/payslip" className="nav-subitem">Payslip</Link>
                        <Link to="/attendance" className="nav-subitem">Attendance</Link>
                        <Link to="/on-duty" className="nav-subitem">On Duty</Link>
                    </>
                )}

                <Link to="/leaves/my" className="nav-item">
                    <span className="nav-item-icon">📅</span> Apply Leave
                </Link>

                {['manager', 'admin', 'super-admin'].includes(user.role) && (
                    <Link to="/approvals" className="nav-item">
                        <span className="nav-item-icon">✅</span> Approvals
                    </Link>
                )}

                <Link to="/loans/apply" className="nav-item">
                    <span className="nav-item-icon">💰</span> Apply Loan
                </Link>

                <div className="nav-item" onClick={() => toggle('request')}>
                    <span className="nav-item-icon">📩</span> Request
                    <span className="nav-item-caret">{openMenu === 'request' ? '▼' : '▶'}</span>
                </div>
                {openMenu === 'request' && (
                    <>
                        <Link to="/assets/apply" className="nav-subitem">Apply Request</Link>
                        <Link to="/overtimes/apply" className="nav-subitem">Time off Request</Link>
                    </>
                )}

                <div className="nav-item" onClick={() => toggle('travel')}>
                    <span className="nav-item-icon">✈️</span> Travel
                    <span className="nav-item-caret">{openMenu === 'travel' ? '▼' : '▶'}</span>
                </div>
                {openMenu === 'travel' && (
                    <>
                        <Link to="/travels" className="nav-subitem">Travel Request</Link>
                        <Link to="/expenses/travel" className="nav-subitem">Travel Expenses</Link>
                        <Link to="/expenses/non-travel" className="nav-subitem">Non-Travel Expenses</Link>
                    </>
                )}

                <div className="nav-item" onClick={() => toggle('tax')}>
                    <span className="nav-item-icon">📊</span> Income Tax
                    <span className="nav-item-caret">{openMenu === 'tax' ? '▼' : '▶'}</span>
                </div>
                {openMenu === 'tax' && (
                    <>
                        <Link to="/tax/declarations" className="nav-subitem">Income Tax Declarations</Link>
                        <Link to="/tax/computation" className="nav-subitem">Income Tax Computation</Link>
                    </>
                )}

                <Link to="/my-information" className="nav-item">
                    <span className="nav-item-icon">🪪</span> My Information
                </Link>

                {['manager', 'admin', 'super-admin'].includes(user.role) && (
                    <Link to="/fin-elements" className="nav-item">
                        <span className="nav-item-icon">⚙️</span> FIN Elements
                    </Link>
                )}
            </nav>
        </aside>
    );
}

export default Sidebar;
