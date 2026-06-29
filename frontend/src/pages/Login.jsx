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
            <svg className="login-hero-icon" width="58" height="58" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 2c-2.7 0-8 1.3-8 4v2h9v-2c0-1 .4-1.9 1-2.6A12 12 0 0 0 8 13Zm8 0c-.3 0-.7 0-1.1.1A4 4 0 0 1 16 16v3h8v-2c0-2.7-5.3-4-8-4Z" />
            </svg>
            <div className="login-brand">Employee Portal</div>

            <svg className="login-hero-chips" width="280" height="70" viewBox="0 0 280 70" fill="none">
                <path d="M40 40 Q90 0 130 35 T240 35" stroke="#93b4ee" strokeWidth="1.5" strokeDasharray="4 4" />
                {[
                    { x: 40, e: '👤' }, { x: 113, e: '📅' }, { x: 186, e: '📄' }, { x: 252, e: '📊' }
                ].map((c, i) => (
                    <g key={i}>
                        <circle cx={c.x} cy="40" r="18" fill="#ffffff" stroke="#dbe5f8" />
                        <text x={c.x} y="46" fontSize="16" textAnchor="middle">{c.e}</text>
                    </g>
                ))}
            </svg>
        </div>
        <svg className="login-waves" viewBox="0 0 500 120" preserveAspectRatio="none" height="120">
            <path d="M0 60 C120 20 200 90 280 60 C360 30 440 80 500 55 L500 120 L0 120 Z" fill="#cdddf6" opacity="0.7" />
            <path d="M0 78 C110 45 210 100 300 72 C380 48 450 92 500 72 L500 120 L0 120 Z" fill="#b8d0f2" opacity="0.7" />
            <path d="M0 95 C130 70 220 110 320 90 C400 74 460 100 500 90 L500 120 L0 120 Z" fill="#a7c4ef" opacity="0.8" />
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
