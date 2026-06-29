import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, resolveImageUrl } from '../services/api';

const PersonIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-9 2.2-9 5.2V22h18v-2.8c0-3-4.6-5.2-9-5.2Z" />
    </svg>
);
const avatarBox = { width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: '#1e3a8a', color: '#cbd5e1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };

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

    return (
        <div ref={wrapRef} style={{ position: 'relative' }}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 10,
                    cursor: 'pointer', padding: '8px 14px'
                }}
            >
                <span style={avatarBox}>
                    {user.profilePicture
                        ? <img src={resolveImageUrl(user.profilePicture)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <PersonIcon />}
                </span>
                <span style={{ fontWeight: 600, color: '#111827', fontSize: 12 }}>{user.name || 'User'}</span>
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
