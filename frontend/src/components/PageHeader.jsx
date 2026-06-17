import { Link } from 'react-router-dom';
import UserMenu from './UserMenu';
import { SessionPill } from './SessionGuard';
import NotificationBell from './NotificationBell';

function PageHeader({ pageName }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px', background: '#ffffff',
            border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <Link to="/dashboard" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>Home</Link>
                <span style={{ color: '#9ca3af' }}>›</span>
                <span style={{ color: '#111827', fontWeight: 600 }}>{pageName}</span>
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
