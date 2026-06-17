import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

const SESSION_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const WARNING_AT_SECONDS = 60;              // last 1 minute → popup
const STORAGE_KEY = 'sessionExpiresAt';

const fmtMMSS = (sec) => {
    const m = Math.floor(sec / 60); const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
};

const SKIP_PATHS = ['/login', '/register'];
const SessionContext = createContext({ remaining: Math.floor(SESSION_DURATION_MS / 1000) });

export function useSession() {
    return useContext(SessionContext);
}

const readDeadline = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
};

const ensureDeadline = () => {
    if (!localStorage.getItem('accessToken')) return null;
    let dl = readDeadline();
    if (!dl || dl <= Date.now()) {
        dl = Date.now() + SESSION_DURATION_MS;
        localStorage.setItem(STORAGE_KEY, String(dl));
    }
    return dl;
};

const computeRemaining = (dl) => {
    if (!dl) return Math.floor(SESSION_DURATION_MS / 1000);
    return Math.max(0, Math.ceil((dl - Date.now()) / 1000));
};

export function SessionPill() {
    const { remaining } = useSession();
    const color = remaining <= 10 ? '#dc2626' : remaining <= 60 ? '#f59e0b' : '#16a34a';
    return (
        <span
            title="Session timer — auto logout at 0"
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
    const skip = SKIP_PATHS.includes(location.pathname);
    const [remaining, setRemaining] = useState(() => computeRemaining(readDeadline()));
    const loggedOutRef = useRef(false);

    useEffect(() => {
        if (skip) return;
        ensureDeadline();
        const tick = () => setRemaining(computeRemaining(readDeadline()));
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [skip, location.pathname]);

    useEffect(() => {
        if (skip) return;
        if (remaining === 0 && !loggedOutRef.current && localStorage.getItem('accessToken')) {
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
                            Save your work before the session ends.
                        </div>
                    </div>
                </div>
            )}
        </SessionContext.Provider>
    );
}

export default SessionGuard;
