import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaveApi } from '../services/api';

function NotificationBell() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isManager = ['manager', 'admin', 'super-admin'].includes(user.role);
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    const load = () => {
        const fetcher = isManager ? leaveApi.allLeaves() : leaveApi.myLeaves();
        fetcher.then(({ data }) => {
            const pending = (data.leaves || []).filter((l) => l.status === 'Pending');
            setNotifications(pending.map((l) => ({
                id: l._id,
                title: isManager
                    ? `${l.employee?.name || 'Employee'} requested ${l.leaveType || 'leave'}`
                    : `${l.leaveType || 'Leave'} - Pending`,
                subtitle: `${new Date(l.fromDate).toLocaleDateString('en-GB')} → ${new Date(l.toDate).toLocaleDateString('en-GB')} (${l.totalDays} day${l.totalDays > 1 ? 's' : ''})`,
                link: isManager ? '/approvals' : '/leaves/my'
            })));
        }).catch(() => {});
    };

    useEffect(() => {
        load();
        const onFocus = () => load();
        window.addEventListener('focus', onFocus);
        const interval = setInterval(load, 30000);
        return () => {
            window.removeEventListener('focus', onFocus);
            clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isManager]);

    useEffect(() => {
        if (!open) return;
        const onDocClick = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [open]);

    const count = notifications.length;

    return (
        <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                title={isManager ? 'Pending approvals' : 'Your pending leaves'}
                style={{
                    position: 'relative', background: 'transparent', border: 'none',
                    cursor: 'pointer', fontSize: 20, padding: 0
                }}
            >
                🔔
                {count > 0 && (
                    <span style={{
                        position: 'absolute', top: -2, right: -6,
                        background: '#dc2626', color: 'white', fontSize: 10, fontWeight: 700,
                        borderRadius: 10, padding: '1px 5px', minWidth: 16, textAlign: 'center'
                    }}>{count}</span>
                )}
            </button>

            {open && (
                <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 6,
                    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)', minWidth: 320, maxWidth: 380,
                    maxHeight: 400, overflowY: 'auto', zIndex: 100
                }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', fontWeight: 600, color: '#111827' }}>
                        Notifications {count > 0 && <span style={{ color: '#6b7280', fontWeight: 400, fontSize: 12 }}>({count})</span>}
                    </div>
                    {count === 0 ? (
                        <div style={{ padding: '20px 14px', textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
                            No new notifications
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <button
                                key={n.id}
                                type="button"
                                onClick={() => { setOpen(false); navigate(n.link); }}
                                style={{
                                    display: 'block', width: '100%', textAlign: 'left',
                                    padding: '10px 14px', background: 'transparent',
                                    border: 'none', borderBottom: '1px solid #f3f4f6',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>{n.title}</div>
                                <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{n.subtitle}</div>
                            </button>
                        ))
                    )}
                    {count > 0 && (
                        <button
                            type="button"
                            onClick={() => { setOpen(false); navigate(isManager ? '/approvals' : '/leaves/my'); }}
                            style={{ display: 'block', width: '100%', padding: '10px 14px', background: '#f9fafb', border: 'none', cursor: 'pointer', color: '#3b82f6', fontWeight: 600, fontSize: 13 }}
                        >
                            View all →
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
