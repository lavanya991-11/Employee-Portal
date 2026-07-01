import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

const ic = (p, s = 17) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{p}</svg>
);
const MailIcon = () => ic(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>);
const LockIcon = () => ic(<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>);
const PersonIcon = () => ic(<><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></>, 19);
const CalIcon = () => ic(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" /></>, 19);
const ClockIcon = () => ic(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>, 19);
const ChartIcon = () => ic(<><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" /><rect x="12" y="8" width="3" height="10" /><rect x="17" y="5" width="3" height="13" /></>, 19);
const ShieldIcon = () => ic(<><path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5Z" /><path d="m9 12 2 2 4-4" /></>, 26);
const ArrowIcon = () => ic(<><path d="M5 12h14M13 6l6 6-6 6" /></>, 18);
const BrandIcon = () => (
    <svg className="lb-icon" viewBox="0 0 64 64" fill="none">
        <circle cx="41" cy="20" r="9" fill="#2563eb" /><path d="M25 50c0-9.7 7.2-14.5 16-14.5S57 40.3 57 50Z" fill="#2563eb" />
        <circle cx="22" cy="28" r="7.5" fill="#3b82f6" /><path d="M7 53c0-8.3 6.7-12.5 15-12.5S37 44.7 37 53Z" fill="#3b82f6" />
    </svg>
);
const MsLogo = () => (
    <svg width="18" height="18" viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#f25022" /><rect x="13" y="1" width="10" height="10" fill="#7fba00" /><rect x="1" y="13" width="10" height="10" fill="#00a4ef" /><rect x="13" y="13" width="10" height="10" fill="#ffb900" /></svg>
);

const FEATURES = [
    { icon: <PersonIcon />, title: 'Employee Profile', sub: 'View and update your personal information' },
    { icon: <CalIcon />, title: 'Leave Management', sub: 'Apply and track your leave requests' },
    { icon: <ClockIcon />, title: 'Attendance Tracking', sub: 'Track your attendance and work hours' },
    { icon: <ChartIcon />, title: 'Reports & Insights', sub: 'Access your reports and analytics' }
];

function Login() {
    const navigate = useNavigate();
    const [mode, setMode] = useState('login'); // 'login' | 'change'

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const resetMessages = () => { setError(''); setSuccess(''); };

    const switchMode = (next) => {
        resetMessages();
        setPassword(''); setNewPassword(''); setConfirmPassword('');
        setShowPassword(false); setShowNewPassword(false);
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
        if (newPassword !== confirmPassword) { setError('New password and confirmation do not match'); return; }
        if (newPassword === password) { setError('New password must be different from the current password'); return; }
        setLoading(true);
        try {
            const { data } = await authApi.login({ email, password });
            localStorage.setItem('accessToken', data.accessToken);
            await authApi.changePassword({ currentPassword: password, newPassword });
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

    const onMicrosoft = () => setError('Microsoft sign-in is not configured. Please sign in with your email and password.');

    return (
        <div className="login-screen">
            <div className="login-box">
                {/* Left branding panel */}
                <div className="login-hero">
                    <div className="login-left-brand">
                        <BrandIcon />
                        <div>
                            <div className="lb-name">NovaSoft</div>
                            <div className="lb-sub">ESS Portal</div>
                            <div className="lb-tag">Empowering People. Strengthening Business.</div>
                        </div>
                    </div>

                    <div className="login-welcome">
                        <div className="lw-small">Welcome to</div>
                        <div className="lw-big">ESS Portal</div>
                        <div className="lw-desc">Your one-stop solution to manage your profile, leave requests, attendance, and more.</div>
                        <div className="lw-rule" />
                    </div>

                    <div className="login-features">
                        {FEATURES.map((f) => (
                            <div className="login-feature" key={f.title}>
                                <span className="lf-icon">{f.icon}</span>
                                <div>
                                    <div className="lf-title">{f.title}</div>
                                    <div className="lf-sub">{f.sub}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="login-bc-card">
                        <span className="bc-diamond">{ic(<><path d="M12 2 22 12 12 22 2 12Z" /></>, 20)}</span>
                        <div>
                            <div className="bc-label">Connected with</div>
                            <div className="bc-name">Microsoft Dynamics 365</div>
                            <div className="bc-label">Business Central</div>
                        </div>
                    </div>
                </div>

                {/* Right form panel */}
                <div className="login-panel">
                    <span className="login-lang">🌐 English ▾</span>
                    <div className="login-card">
                        <div style={{ textAlign: 'center' }}>
                            <span className="login-shield"><ShieldIcon /></span>
                        </div>
                        {mode === 'login' ? (
                            <>
                                <div className="login-title" style={{ textAlign: 'center' }}>Sign in to your account</div>
                                <div className="login-subtitle" style={{ textAlign: 'center' }}>Enter your credentials to continue</div>
                            </>
                        ) : (
                            <>
                                <div className="login-title" style={{ textAlign: 'center' }}>Change Password</div>
                                <div className="login-subtitle" style={{ textAlign: 'center' }}>Update your account password.</div>
                            </>
                        )}

                        {error && <div className="login-alert login-alert-error">{error}</div>}
                        {success && <div className="login-alert login-alert-success">{success}</div>}

                        {mode === 'login' ? (
                            <form onSubmit={handleLogin}>
                                <div className="login-field">
                                    <label>User ID / Email</label>
                                    <div className="login-input-wrap">
                                        <span className="login-ic-left"><PersonIcon /></span>
                                        <input type="text" placeholder="Enter your user ID or email"
                                            value={email} onChange={(e) => setEmail(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="login-field">
                                    <label>Password</label>
                                    <div className="login-input-wrap">
                                        <span className="login-ic-left"><LockIcon /></span>
                                        <input className="has-eye" type={showPassword ? 'text' : 'password'} placeholder="Enter your password"
                                            value={password} onChange={(e) => setPassword(e.target.value)} required />
                                        <button type="button" className="login-eye" onClick={() => setShowPassword((v) => !v)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? '🙈' : '👁'}</button>
                                    </div>
                                </div>

                                <div className="login-remember">
                                    <label><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me</label>
                                    <button type="button" className="login-link" onClick={() => switchMode('change')}>Forgot Password?</button>
                                </div>

                                <button type="submit" className="login-btn" disabled={loading}
                                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    {loading ? 'Signing in...' : <>Sign In <ArrowIcon /></>}
                                </button>

                                <div className="login-divider">or sign in with</div>
                                <button type="button" className="login-ms-btn" onClick={onMicrosoft}>
                                    <MsLogo /> Sign in with Microsoft
                                </button>

                                <p className="login-help">
                                    <span role="img" aria-label="support">🎧</span> Need help? <span className="login-help-link">Contact HR Support</span>
                                </p>
                            </form>
                        ) : (
                            <form onSubmit={handleChangePassword}>
                                <div className="login-field">
                                    <label>Email</label>
                                    <div className="login-input-wrap">
                                        <span className="login-ic-left"><MailIcon /></span>
                                        <input type="email" placeholder="Enter your email"
                                            value={email} onChange={(e) => setEmail(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="login-field">
                                    <label>Current Password</label>
                                    <div className="login-input-wrap">
                                        <span className="login-ic-left"><LockIcon /></span>
                                        <input className="has-eye" type={showPassword ? 'text' : 'password'} placeholder="Enter your current password"
                                            value={password} onChange={(e) => setPassword(e.target.value)} required />
                                        <button type="button" className="login-eye" onClick={() => setShowPassword((v) => !v)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? '🙈' : '👁'}</button>
                                    </div>
                                </div>
                                <div className="login-field">
                                    <label>New Password</label>
                                    <div className="login-input-wrap">
                                        <span className="login-ic-left"><LockIcon /></span>
                                        <input className="has-eye" type={showNewPassword ? 'text' : 'password'} placeholder="Enter a new password"
                                            value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                                        <button type="button" className="login-eye" onClick={() => setShowNewPassword((v) => !v)}
                                            aria-label={showNewPassword ? 'Hide password' : 'Show password'}>{showNewPassword ? '🙈' : '👁'}</button>
                                    </div>
                                </div>
                                <div className="login-field">
                                    <label>Confirm New Password</label>
                                    <div className="login-input-wrap">
                                        <span className="login-ic-left"><LockIcon /></span>
                                        <input type={showNewPassword ? 'text' : 'password'} placeholder="Re-enter the new password"
                                            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                                    </div>
                                </div>

                                <button type="submit" className="login-btn" disabled={loading}>
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>

                                <div className="login-row-center">
                                    <button type="button" className="login-link" onClick={() => switchMode('login')}>← Back to Login</button>
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
