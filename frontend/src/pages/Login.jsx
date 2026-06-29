import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

const MailIcon = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
    </svg>
);
const LockIcon = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
);

// Left-panel branding artwork (two-people icon, connector chips, waves).
const HeroArt = () => (
    <>
        <div className="login-hero-inner">
            <svg className="login-hero-icon" width="68" height="68" viewBox="0 0 64 64" fill="none">
                {/* back person */}
                <circle cx="41" cy="20" r="9" fill="#2563eb" />
                <path d="M25 50c0-9.7 7.2-14.5 16-14.5S57 40.3 57 50Z" fill="#2563eb" />
                {/* front person */}
                <circle cx="22" cy="28" r="7.5" fill="#3b82f6" />
                <path d="M7 53c0-8.3 6.7-12.5 15-12.5S37 44.7 37 53Z" fill="#3b82f6" />
            </svg>
            <div className="login-brand">Employee Portal</div>

            <svg className="login-hero-chips" width="300" height="92" viewBox="0 0 300 92" fill="none">
                <path d="M48 54 C70 20 98 20 120 54 C142 20 170 20 192 54 C214 24 238 24 256 54"
                    stroke="#9cb8ee" strokeWidth="1.4" strokeDasharray="3 5" strokeLinecap="round" />
                {[
                    { x: 48, icon: <><circle cx="0" cy="-2.5" r="3" /><path d="M-5.5 6.5a5.5 5.5 0 0 1 11 0" /></> },
                    { x: 120, icon: <><rect x="-7" y="-6" width="14" height="13" rx="2" /><path d="M-7 -1.5h14M-3.5 -9v3.5M3.5 -9v3.5" /></> },
                    { x: 192, icon: <><path d="M-5 -8h6l4 4v12h-10z" /><path d="M1 -8v4h4" /></> },
                    { x: 256, icon: <><path d="M-6 7v-4M-1 7v-9M4 7v-6" /></> }
                ].map((c, i) => (
                    <g key={i}>
                        <circle cx={c.x} cy="54" r="19" fill="#eaf1fc" stroke="#d4e1f7" />
                        <g transform={`translate(${c.x} 54)`} stroke="#2563eb" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">{c.icon}</g>
                    </g>
                ))}
            </svg>
        </div>
        <svg className="login-waves" viewBox="0 0 500 130" preserveAspectRatio="none" height="130">
            <path d="M0 70 C120 35 200 95 300 65 C380 40 450 85 500 62 L500 130 L0 130 Z" fill="#d7e3f8" opacity="0.65" />
            <path d="M0 86 C110 55 210 100 300 78 C380 56 450 92 500 76 L500 130 L0 130 Z" fill="#c2d6f4" opacity="0.7" />
            <path d="M0 102 C130 80 220 112 320 96 C400 82 460 104 500 96 L500 130 L0 130 Z" fill="#aecbf0" opacity="0.85" />
            <g stroke="#bcd2f4" strokeWidth="1" fill="none" opacity="0.5">
                <path d="M0 64 C120 30 200 90 300 60 C380 36 450 80 500 58" />
                <path d="M0 77 C115 44 205 96 300 70 C382 48 452 86 500 68" />
            </g>
        </svg>
    </>
);

function Login() {
    const navigate = useNavigate();
    const [mode, setMode] = useState('login'); // 'login' | 'change'

    // shared
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // change-password only
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const resetMessages = () => { setError(''); setSuccess(''); };

    const switchMode = (next) => {
        resetMessages();
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setShowNewPassword(false);
        setMode(next);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        resetMessages();
        setLoading(true);
        try {
            const { data } = await authApi.login({ email, password });
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate(data.user?.role === 'super-admin' ? '/admin' : '/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        resetMessages();

        if (newPassword !== confirmPassword) {
            setError('New password and confirmation do not match');
            return;
        }
        if (newPassword === password) {
            setError('New password must be different from the current password');
            return;
        }

        setLoading(true);
        try {
            // The change-password endpoint is authenticated. Verify the current
            // credentials via login to obtain a token, then change the password.
            const { data } = await authApi.login({ email, password });
            localStorage.setItem('accessToken', data.accessToken);
            await authApi.changePassword({ currentPassword: password, newPassword });
            // Backend invalidates the session — clear it and return to login.
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            switchMode('login');
            setSuccess('Password changed successfully. Please log in with your new password.');
        } catch (err) {
            localStorage.removeItem('accessToken');
            setError(err.response?.data?.message || 'Could not change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-screen">
            <div className="login-box">
                {/* Left branding panel */}
                <div className="login-hero">
                    <HeroArt />
                </div>

                {/* Right form panel */}
                <div className="login-panel">
                    <div className="login-card">
                        {mode === 'login' ? (
                            <>
                                <div className="login-title">Welcome Back</div>
                                <div className="login-subtitle">Sign in to continue to your account.</div>
                            </>
                        ) : (
                            <>
                                <div className="login-title">Change Password</div>
                                <div className="login-subtitle">Update your account password.</div>
                            </>
                        )}

                        {error && <div className="login-alert login-alert-error">{error}</div>}
                        {success && <div className="login-alert login-alert-success">{success}</div>}

                        {mode === 'login' ? (
                            <form onSubmit={handleLogin}>
                                <div className="login-field">
                                    <label>Email</label>
                                    <div className="login-input-wrap">
                                        <span className="login-ic-left"><MailIcon /></span>
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="login-field">
                                    <label>Password</label>
                                    <div className="login-input-wrap">
                                        <span className="login-ic-left"><LockIcon /></span>
                                        <input
                                            className="has-eye"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="login-eye"
                                            onClick={() => setShowPassword((v) => !v)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? '🙈' : '👁'}
                                        </button>
                                    </div>
                                </div>

                                <div className="login-row-right">
                                    <button type="button" className="login-link" onClick={() => switchMode('change')}>
                                        Forgot Password?
                                    </button>
                                </div>

                                <button type="submit" className="login-btn" disabled={loading}>
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </button>

                                <p className="login-help">
                                    Need help? <span className="login-help-link">Contact HR Support</span>
                                </p>
                            </form>
                        ) : (
                            <form onSubmit={handleChangePassword}>
                                <div className="login-field">
                                    <label>Email</label>
                                    <div className="login-input-wrap">
                                        <span className="login-ic-left"><MailIcon /></span>
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="login-field">
                                    <label>Current Password</label>
                                    <div className="login-input-wrap">
                                        <span className="login-ic-left"><LockIcon /></span>
                                        <input
                                            className="has-eye"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter your current password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="login-eye"
                                            onClick={() => setShowPassword((v) => !v)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? '🙈' : '👁'}
                                        </button>
                                    </div>
                                </div>
                                <div className="login-field">
                                    <label>New Password</label>
                                    <div className="login-input-wrap">
                                        <span className="login-ic-left"><LockIcon /></span>
                                        <input
                                            className="has-eye"
                                            type={showNewPassword ? 'text' : 'password'}
                                            placeholder="Enter a new password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="login-eye"
                                            onClick={() => setShowNewPassword((v) => !v)}
                                            aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showNewPassword ? '🙈' : '👁'}
                                        </button>
                                    </div>
                                </div>
                                <div className="login-field">
                                    <label>Confirm New Password</label>
                                    <div className="login-input-wrap">
                                        <span className="login-ic-left"><LockIcon /></span>
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            placeholder="Re-enter the new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="login-btn" disabled={loading}>
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>

                                <div className="login-row-center">
                                    <button type="button" className="login-link" onClick={() => switchMode('login')}>
                                        ← Back to Login
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
