import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { settingsApi, resolveImageUrl } from '../services/api';

/* Thin line icons (inherit currentColor) — match the login's icon style. */
const ic = (paths) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);
const Icons = {
    dashboard: ic(<><rect x="3" y="3" width="7.5" height="7.5" rx="2" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="2" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="2" /></>),
    apply: ic(<><path d="M15.5 3H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.5Z" /><path d="M15 3v5h5" /><path d="M12 11v5M9.5 13.5h5" /></>),
    payroll: ic(<><rect x="2.5" y="6" width="19" height="13" rx="2.5" /><path d="M2.5 10h19" /><circle cx="12" cy="14.5" r="1.6" /></>),
    approvals: ic(<><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" /><path d="m8.5 12 2.4 2.4 4.6-4.8" /></>),
    request: ic(<><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5.5 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.5A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.5Z" /></>),
    expenses: ic(<><path d="M5 2.5v19l2-1.2 2 1.2 2-1.2 2 1.2 2-1.2 2 1.2v-19l-2 1.2-2-1.2-2 1.2-2-1.2-2 1.2Z" /><path d="M9 8.5h6M9 12.5h6" /></>),
    settings: ic(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.74 1.04 2 2 0 1 1-4 0 1.65 1.65 0 0 0-1.08-1.5 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.5-1.08 2 2 0 1 1 0-4 1.65 1.65 0 0 0 1.5-1.1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51 2 2 0 1 1 4 0 1.65 1.65 0 0 0 1.08 1.5 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.31.22.65.22 1Z" /></>),
    data: ic(<><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14a9 3 0 0 0 18 0V5" /><path d="M3 12a9 3 0 0 0 18 0" /></>),
};

const Chevron = () => (
    <svg className="nav-item-caret" width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6" />
    </svg>
);

// Map each expandable menu to the child routes it owns (for active/auto-open).
const MENU_ROUTES = {
    apply: ['/leaves/my', '/loan-requests'],
    payroll: ['/payslip'],
    request: ['/assets/apply', '/overtimes/apply'],
    expenses: ['/travels']
};

function Sidebar() {
    const { pathname } = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [companyLogo, setCompanyLogo] = useState(() => localStorage.getItem('companyLogo') || '');
    const [companyName, setCompanyName] = useState(() => localStorage.getItem('companyName') || '');

    // Open the menu that owns the current route by default.
    const initialMenu = Object.keys(MENU_ROUTES).find((m) => MENU_ROUTES[m].some((p) => pathname.startsWith(p))) || '';
    const [openMenu, setOpenMenu] = useState(initialMenu);

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
    const isActive = (path) => pathname === path || pathname.startsWith(path + '/');
    const menuActive = (name) => MENU_ROUTES[name].some((p) => isActive(p));

    const Parent = ({ name, icon, label }) => (
        <button type="button"
            className={`nav-item${openMenu === name || menuActive(name) ? ' active' : ''}`}
            onClick={() => toggle(name)}>
            <span className="nav-item-icon">{icon}</span>
            <span className="nav-item-label">{label}</span>
            <span className={`nav-caret-wrap${openMenu === name ? ' open' : ''}`}><Chevron /></span>
        </button>
    );
    const Sub = ({ to, label }) => (
        <Link to={to} className={`nav-subitem${isActive(to) ? ' active' : ''}`}>{label}</Link>
    );

    return (
        <aside className="sidebar">
            <div className="sidebar-profile">
                {companyLogo
                    ? <img className="sidebar-logo" src={resolveImageUrl(companyLogo)} alt={companyName || 'Company'} />
                    : <div className="sidebar-logo-fallback">{(companyName || 'C').charAt(0).toUpperCase()}</div>}
                <div className="sidebar-company">{companyName || 'Company'}</div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">Main</div>
                <Link to="/dashboard" className={`nav-item${isActive('/dashboard') ? ' active' : ''}`}>
                    <span className="nav-item-icon">{Icons.dashboard}</span>
                    <span className="nav-item-label">Dashboard</span>
                </Link>

                <Parent name="apply" icon={Icons.apply} label="Apply" />
                {openMenu === 'apply' && (
                    <div className="nav-sub-group">
                        <Sub to="/leaves/my" label="Leave Request" />
                        <Sub to="/loan-requests" label="Loan Request" />
                    </div>
                )}

                <Parent name="payroll" icon={Icons.payroll} label="Payroll" />
                {openMenu === 'payroll' && (
                    <div className="nav-sub-group">
                        <Sub to="/payslip" label="Payslip" />
                    </div>
                )}

                <div className="nav-section">Workspace</div>
                {['manager', 'admin', 'super-admin'].includes(user.role) && (
                    <Link to="/approvals" className={`nav-item${isActive('/approvals') ? ' active' : ''}`}>
                        <span className="nav-item-icon">{Icons.approvals}</span>
                        <span className="nav-item-label">Approvals</span>
                    </Link>
                )}

                <Parent name="request" icon={Icons.request} label="Request" />
                {openMenu === 'request' && (
                    <div className="nav-sub-group">
                        <Sub to="/assets/apply" label="Apply Request" />
                        <Sub to="/overtimes/apply" label="Time off Request" />
                    </div>
                )}

                <Parent name="expenses" icon={Icons.expenses} label="Expenses" />
                {openMenu === 'expenses' && (
                    <div className="nav-sub-group">
                        <Sub to="/travels" label="Travel Expenses" />
                    </div>
                )}

                {user.role === 'super-admin' && (
                    <>
                        <div className="nav-section">Administration</div>
                        <Link to="/system-settings" className={`nav-item${isActive('/system-settings') ? ' active' : ''}`}>
                            <span className="nav-item-icon">{Icons.settings}</span>
                            <span className="nav-item-label">System Settings</span>
                        </Link>
                        <Link to="/data-management" className={`nav-item${isActive('/data-management') ? ' active' : ''}`}>
                            <span className="nav-item-icon">{Icons.data}</span>
                            <span className="nav-item-label">Data Management</span>
                        </Link>
                    </>
                )}
            </nav>
        </aside>
    );
}

export default Sidebar;
