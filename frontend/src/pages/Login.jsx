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
                    <svg viewBox="0 0 400 300" className="login-illustration" aria-hidden="true">
                        <circle cx="330" cy="60" r="10" fill="#facc15" />
                        <rect x="60" y="190" width="120" height="14" rx="7" fill="#3b82f6" opacity="0.6" />
                        <rect x="40" y="120" width="90" height="80" rx="8" fill="#60a5fa" opacity="0.5" />
                        <circle cx="220" cy="120" r="34" fill="#93c5fd" />
                        <rect x="190" y="150" width="60" height="70" rx="12" fill="#f59e0b" />
                        <circle cx="300" cy="120" r="30" fill="#bfdbfe" />
                        <rect x="276" y="148" width="48" height="64" rx="11" fill="#a78bfa" />
                        <path d="M250 90 l14 -22 l14 22 z" fill="#facc15" />
                        <rect x="252" y="86" width="24" height="10" rx="3" fill="#fbbf24" />
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
