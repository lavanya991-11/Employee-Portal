import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

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
            {/* Left branding / illustration panel */}
            <div className="login-hero">
                <div className="login-hero-inner">
                    <svg viewBox="0 0 500 340" className="login-illustration" aria-hidden="true">
                        {/* stars */}
                        <g fill="#facc15">
                            <path d="M150 30 l4 9 l9 1 l-7 6 l2 9 l-8 -5 l-8 5 l2 -9 l-7 -6 l9 -1 z" />
                            <circle cx="60" cy="70" r="3" />
                            <circle cx="430" cy="50" r="3" />
                            <circle cx="470" cy="120" r="2.5" />
                            <circle cx="30" cy="150" r="2.5" />
                        </g>

                        {/* desk + monitor (left) */}
                        <rect x="40" y="232" width="150" height="10" rx="3" fill="#1d4ed8" opacity="0.55" />
                        <rect x="70" y="150" width="92" height="62" rx="6" fill="#dbeafe" />
                        <rect x="78" y="158" width="76" height="46" rx="3" fill="#3b82f6" />
                        <rect x="108" y="212" width="16" height="18" fill="#93c5fd" />
                        <rect x="96" y="230" width="40" height="6" rx="3" fill="#93c5fd" />

                        {/* trophy (center) */}
                        <path d="M232 96 h36 v18 a18 18 0 0 1 -36 0 z" fill="#fbbf24" />
                        <path d="M232 100 h-12 a10 10 0 0 0 10 12 z" fill="#f59e0b" />
                        <path d="M268 100 h12 a10 10 0 0 1 -10 12 z" fill="#f59e0b" />
                        <rect x="246" y="132" width="8" height="14" fill="#f59e0b" />
                        <rect x="236" y="146" width="28" height="8" rx="2" fill="#d97706" />
                        <path d="M250 74 l4 10 l11 1 l-8 7 l3 11 l-10 -6 l-10 6 l3 -11 l-8 -7 l11 -1 z" fill="#facc15" />

                        {/* person — left, raising arms */}
                        <circle cx="200" cy="170" r="17" fill="#fcd9b6" />
                        <rect x="183" y="188" width="34" height="50" rx="14" fill="#f97316" />
                        <rect x="170" y="176" width="12" height="34" rx="6" fill="#fcd9b6" transform="rotate(-30 176 193)" />
                        <rect x="218" y="176" width="12" height="34" rx="6" fill="#fcd9b6" transform="rotate(30 224 193)" />
                        <rect x="188" y="236" width="11" height="34" rx="5" fill="#1e3a8a" />
                        <rect x="201" y="236" width="11" height="34" rx="5" fill="#1e3a8a" />

                        {/* person — right, holding trophy up */}
                        <circle cx="300" cy="170" r="17" fill="#f7c9a3" />
                        <rect x="283" y="188" width="34" height="50" rx="14" fill="#2563eb" />
                        <rect x="318" y="176" width="12" height="34" rx="6" fill="#f7c9a3" transform="rotate(28 324 193)" />
                        <rect x="270" y="178" width="12" height="32" rx="6" fill="#f7c9a3" transform="rotate(-22 276 194)" />
                        <rect x="288" y="236" width="11" height="34" rx="5" fill="#1e3a8a" />
                        <rect x="301" y="236" width="11" height="34" rx="5" fill="#1e3a8a" />

                        {/* plants */}
                        <g>
                            <path d="M70 300 q-18 -34 -4 -58 q14 22 4 58 z" fill="#34d399" />
                            <path d="M70 300 q18 -30 6 -52 q-14 20 -6 52 z" fill="#10b981" />
                            <rect x="56" y="298" width="28" height="24" rx="4" fill="#0f766e" />
                        </g>
                        <g>
                            <path d="M440 300 q-16 -30 -2 -54 q12 20 2 54 z" fill="#34d399" />
                            <path d="M440 300 q18 -28 8 -50 q-14 18 -8 50 z" fill="#10b981" />
                            <rect x="426" y="298" width="28" height="24" rx="4" fill="#0f766e" />
                        </g>

                        {/* ground line */}
                        <rect x="30" y="296" width="440" height="4" rx="2" fill="#1d4ed8" opacity="0.35" />
                    </svg>
                    <p className="login-hero-tag">Employee Self-Service Portal</p>
                </div>
                <p className="login-hero-copy">© The Design is subjected to Copyright</p>
            </div>

            {/* Right card */}
            <div className="login-panel">
                <div className="login-card">
                    <div className="login-brand">
                        <span className="login-brand-accent">HR</span> PORTAL
                    </div>

                    {error && <div className="login-alert login-alert-error">{error}</div>}
                    {success && <div className="login-alert login-alert-success">{success}</div>}

                    {mode === 'login' ? (
                        <form onSubmit={handleLogin}>
                            <div className="login-field">
                                <label>Username</label>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="login-field">
                                <label>Password</label>
                                <div className="login-input-wrap">
                                    <input
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
                                    Change Password
                                </button>
                            </div>

                            <button type="submit" className="login-btn" disabled={loading}>
                                {loading ? 'Logging in...' : 'Login'}
                            </button>

                            <p className="login-help">
                                Unable to login? Kindly connect with <span className="login-help-link">IT Support Team</span>
                            </p>
                        </form>
                    ) : (
                        <form onSubmit={handleChangePassword}>
                            <div className="login-field">
                                <label>Username</label>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="login-field">
                                <label>Current Password</label>
                                <div className="login-input-wrap">
                                    <input
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
                                    <input
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
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    placeholder="Re-enter the new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
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
    );
}

export default Login;
