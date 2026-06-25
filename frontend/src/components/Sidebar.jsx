import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { employeeInfoApi, resolveImageUrl } from '../services/api';

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
                    {user.profilePicture
                        ? <img src={resolveImageUrl(user.profilePicture)} alt="" />
                        : '👤'}
                </div>
                <div className="user-id">
                    {displayCode ? `${displayCode} - ${displayName}` : displayName}
                </div>
            </div>

            <nav className="sidebar-nav">
                <Link to="/dashboard" className="nav-item">
                    <span className="nav-item-icon">🏠</span> Dashboard
                </Link>

                <div className="nav-item" onClick={() => toggle('apply')}>
                    <span className="nav-item-icon">📝</span> Apply
                    <span className="nav-item-caret">{openMenu === 'apply' ? '▼' : '▶'}</span>
                </div>
                {openMenu === 'apply' && (
                    <>
                        <Link to="/leaves/my" className="nav-subitem">Leave Request</Link>
                        <Link to="/loan-requests" className="nav-subitem">Loan Request</Link>
                    </>
                )}

                <div className="nav-item" onClick={() => toggle('payroll')}>
                    <span className="nav-item-icon">💼</span> Payroll
                    <span className="nav-item-caret">{openMenu === 'payroll' ? '▼' : '▶'}</span>
                </div>
                {openMenu === 'payroll' && (
                    <>
                        <Link to="/payslip" className="nav-subitem">Payslip</Link>
                    </>
                )}

                {['manager', 'admin', 'super-admin'].includes(user.role) && (
                    <Link to="/approvals" className="nav-item">
                        <span className="nav-item-icon">✅</span> Approvals
                    </Link>
                )}

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

                <div className="nav-item" onClick={() => toggle('expenses')}>
                    <span className="nav-item-icon">🧾</span> Expenses
                    <span className="nav-item-caret">{openMenu === 'expenses' ? '▼' : '▶'}</span>
                </div>
                {openMenu === 'expenses' && (
                    <>
                        <Link to="/expenses/non-travel" className="nav-subitem">Expense Claims</Link>
                    </>
                )}

                {user.role === 'super-admin' && (
                    <Link to="/system-settings" className="nav-item">
                        <span className="nav-item-icon">🎨</span> System Settings
                    </Link>
                )}

                {user.role === 'super-admin' && (
                    <Link to="/data-management" className="nav-item">
                        <span className="nav-item-icon">🗑️</span> Data Management
                    </Link>
                )}
            </nav>
        </aside>
    );
}

export default Sidebar;
