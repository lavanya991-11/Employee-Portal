import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { settingsApi, resolveImageUrl } from '../services/api';

function Sidebar() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [openMenu, setOpenMenu] = useState('');
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

    const toggle = (name) => setOpenMenu(openMenu === name ? '' : name);

    return (
        <aside className="sidebar">
            <div className="sidebar-profile">
                {companyLogo
                    ? <img className="sidebar-logo" src={resolveImageUrl(companyLogo)} alt={companyName || 'Company'} />
                    : <div className="sidebar-logo-fallback">{(companyName || 'C').charAt(0).toUpperCase()}</div>}
                <div className="sidebar-company">{companyName || 'Company'}</div>
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
                        <Link to="/travels" className="nav-subitem">Travel Expenses</Link>
                    </>
                )}

                {user.role === 'super-admin' && (
                    <Link to="/system-settings" className="nav-item">
                        <span className="nav-item-icon">🎨</span> System Settings
                    </Link>
                )}

                {user.role === 'super-admin' && (
                    <Link to="/data-management" className="nav-item">
                        <span className="nav-item-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                                <path d="M3 6h18" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                        </span> Data Management
                    </Link>
                )}
            </nav>
        </aside>
    );
}

export default Sidebar;
