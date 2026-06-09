import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserMenu from './UserMenu';
import { leaveApi } from '../services/api';

function PageHeader({ pageName }) {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isManager = ['manager', 'admin', 'super-admin'].includes(user.role);
    const [pending, setPending] = useState(0);

    useEffect(() => {
        const fetcher = isManager ? leaveApi.allLeaves() : leaveApi.myLeaves();
        fetcher.then(({ data }) => {
            const count = (data.leaves || []).filter((l) => l.status === 'Pending').length;
            setPending(count);
        }).catch(() => {});
    }, [isManager]);

    const onBell = () => navigate(isManager ? '/approvals' : '/leaves/my');

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
                <button
                    type="button"
                    onClick={onBell}
                    title={isManager ? 'Pending approvals' : 'Your pending leaves'}
                    style={{
                        position: 'relative', background: 'transparent', border: 'none',
                        cursor: 'pointer', fontSize: 20
                    }}
                >
                    🔔
                    {pending > 0 && (
                        <span style={{
                            position: 'absolute', top: -2, right: -4,
                            background: '#dc2626', color: 'white', fontSize: 10, fontWeight: 700,
                            borderRadius: 10, padding: '1px 5px', minWidth: 16, textAlign: 'center'
                        }}>{pending}</span>
                    )}
                </button>
                <UserMenu />
            </div>
        </div>
    );
}

export default PageHeader;
