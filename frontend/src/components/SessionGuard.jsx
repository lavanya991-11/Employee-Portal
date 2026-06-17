import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

const SESSION_TIMEOUT_SECONDS = 600; // 10 minutes
const WARNING_AT_SECONDS = 60;       // last 1 minute → popup

const fmtMMSS = (sec) => {
    const m = Math.floor(sec / 60); const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
};

const SKIP_PATHS = ['/login', '/register'];
const SessionContext = createContext({ remaining: SESSION_TIMEOUT_SECONDS });

export function useSession() {
    return useContext(SessionContext);
}

export function SessionPill() {
    const { remaining } = useSession();
    const color = remaining <= 10 ? '#dc2626' : remaining <= 60 ? '#f59e0b' : '#16a34a';
    return (
        <span
            title="Session timer — resets on activity, auto logout at 0"
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 999,
                background: 'white', border: '1px solid #e5e7eb',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                fontFamily: 'monospace', fontWeight: 700, fontSize: 13,
                color
            }}
        >
            <span style={{ fontSize: 14 }}>🛡</span>
            {fmtMMSS(remaining)}
        </span>
    );
}

function SessionGuard({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [remaining, setRemaining] = useState(SESSION_TIMEOUT_SECONDS);
    const loggedOutRef = useRef(false);

    const skip = SKIP_PATHS.includes(location.pathname);

    useEffect(() => {
        if (skip) return;
        const reset = () => {
            loggedOutRef.current = false;
            setRemaining(SESSION_TIMEOUT_SECONDS);
        };
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach((e) => window.addEventListener(e, reset));
        const interval = setInterval(() => {
            setRemaining((r) => Math.max(0, r - 1));
        }, 1000);
        return () => {
            events.forEach((e) => window.removeEventListener(e, reset));
            clearInterval(interval);
        };
    }, [skip]);

    useEffect(() => {
        if (skip) return;
        if (remaining === 0 && !loggedOutRef.current) {
            loggedOutRef.current = true;
            (async () => {
                try { await authApi.logout(); } catch (e) {}
                localStorage.clear();
                navigate('/login');
            })();
        }
    }, [remaining, navigate, skip]);

    return (
        <SessionContext.Provider value={{ remaining }}>
            {children}
            {!skip && remaining > 0 && remaining <= WARNING_AT_SECONDS && (
                <div style={{
                    position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
                    background: '#fffbeb', border: '1px solid #fcd34d',
                    borderRadius: 10, padding: '14px 16px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    maxWidth: 360
                }}>
                    <span style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: '#fef3c7', color: '#b45309', fontSize: 18,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 36px'
                    }}>⏰</span>
                    <div>
                        <div style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>Session Expiring Soon</div>
                        <div style={{ fontSize: 13, color: '#374151', marginTop: 2 }}>
                            You will be logged out in{' '}
                            <span style={{ color: '#d97706', fontWeight: 700 }}>{fmtMMSS(remaining)}</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                            Move your mouse or press any key to stay logged in.
                        </div>
                    </div>
                </div>
            )}
        </SessionContext.Provider>
    );
}

export default SessionGuard;
