import { Link, useLocation } from 'react-router-dom';
import UserMenu from './UserMenu';
import { SessionPill } from './SessionGuard';
import NotificationBell from './NotificationBell';

/* Map each route to the sidebar section it belongs to, so the breadcrumb can
   show the full path (Home › Section › Page) — matching the sidebar menus. */
const SECTION_BY_PREFIX = [
    { prefix: '/leaves', section: 'Apply' },
    { prefix: '/loan-requests', section: 'Apply' },
    { prefix: '/loans', section: 'Apply' },
    { prefix: '/payslip', section: 'Payroll' },
    { prefix: '/assets', section: 'Request' },
    { prefix: '/overtimes', section: 'Request' },
    { prefix: '/requests', section: 'Request' },
    { prefix: '/travels', section: 'Expenses' },
    { prefix: '/expenses', section: 'Expenses' },
    { prefix: '/admin', section: 'Admin' },
    { prefix: '/calendars', section: 'Admin' },
    { prefix: '/calendar-periods', section: 'Admin' },
    { prefix: '/identification-types', section: 'Admin' },
    { prefix: '/loan-products', section: 'Admin' },
    { prefix: '/fin-elements', section: 'Admin' },
    { prefix: '/data-management', section: 'Admin' }
];

const sep = <span style={{ color: '#cbd5e1' }}>›</span>;

function PageHeader({ pageName, section }) {
    const { pathname } = useLocation();
    // Caller can pass an explicit section; otherwise derive it from the route.
    const crumbSection = section
        || (SECTION_BY_PREFIX.find((r) => pathname.startsWith(r.prefix))?.section || '');

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 18px', background: 'var(--surface)',
            border: '1px solid var(--line-soft)', borderRadius: 'var(--radius-card)',
            marginBottom: 16, boxShadow: 'var(--shadow-sm)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <Link to="/dashboard" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
                {crumbSection && (
                    <>
                        {sep}
                        <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{crumbSection}</span>
                    </>
                )}
                {sep}
                <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{pageName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <SessionPill />
                <NotificationBell />
                <UserMenu />
            </div>
        </div>
    );
}

export default PageHeader;
