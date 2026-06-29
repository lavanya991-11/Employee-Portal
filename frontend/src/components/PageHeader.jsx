import { Link } from 'react-router-dom';
import UserMenu from './UserMenu';
import { SessionPill } from './SessionGuard';
import NotificationBell from './NotificationBell';

function PageHeader({ pageName }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 18px', background: 'var(--surface)',
            border: '1px solid var(--line-soft)', borderRadius: 'var(--radius-card)',
            marginBottom: 16, boxShadow: 'var(--shadow-sm)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <Link to="/dashboard" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
                <span style={{ color: '#cbd5e1' }}>›</span>
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
