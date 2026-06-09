import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

function UserMenu() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const wrapRef = useRef(null);

    useEffect(() => {
        authApi.me().then(({ data }) => {
            const fresh = data.user || data;
            setUser(fresh);
            localStorage.setItem('user', JSON.stringify(fresh));
        }).catch(() => {});
    }, []);

    useEffect(() => {
        const onClick = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    const handleLogout = async () => {
        try { await authApi.logout(); } catch (e) {}
        localStorage.clear();
        navigate('/login');
    };

    const initial = (user.name?.[0] || 'U').toUpperCase();

    return (
        <div ref={wrapRef} style={{ position: 'relative' }}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 6,
                    cursor: 'pointer', padding: '4px 10px 4px 4px'
                }}
            >
                <span style={{
                    width: 28, height: 28, borderRadius: '50%', background: '#3b82f6', color: '#fff',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13
                }}>{initial}</span>
                <span style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>{user.name || 'User'}</span>
            </button>
            {open && (
                <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 6,
                    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)', minWidth: 200, zIndex: 50, overflow: 'hidden'
                }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', fontSize: 12, color: '#6b7280' }}>
                        {user.email || ''}
                    </div>
                    <button
                        type="button"
                        onClick={() => { setOpen(false); navigate('/profile'); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#111827' }}
                    >
                        <span>👤</span> My Profile
                    </button>
                    <button
                        type="button"
                        onClick={() => { setOpen(false); handleLogout(); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#dc2626', fontWeight: 600 }}
                    >
                        <span>↪</span> Logout
                    </button>
                </div>
            )}
        </div>
    );
}

export default UserMenu;
