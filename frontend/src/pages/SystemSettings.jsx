import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';

const DEFAULTS = { primary: '#1976d2', secondary: '#dc004e' };

function applyTheme({ primary, secondary }) {
    document.documentElement.style.setProperty('--primary-color', primary);
    document.documentElement.style.setProperty('--secondary-color', secondary);
    localStorage.setItem('themeColors', JSON.stringify({ primary, secondary }));
}

function SystemSettings() {
    const stored = (() => {
        try { return JSON.parse(localStorage.getItem('themeColors') || '{}'); }
        catch (e) { return {}; }
    })();
    const [primary, setPrimary] = useState(stored.primary || DEFAULTS.primary);
    const [secondary, setSecondary] = useState(stored.secondary || DEFAULTS.secondary);
    const [success, setSuccess] = useState('');
    const [logoName, setLogoName] = useState('');

    const onUpdateTheme = () => {
        applyTheme({ primary, secondary });
        setSuccess('Theme updated.');
        setTimeout(() => setSuccess(''), 2500);
    };

    const onReset = () => {
        setPrimary(DEFAULTS.primary);
        setSecondary(DEFAULTS.secondary);
        applyTheme(DEFAULTS);
        setSuccess('Reverted to default theme.');
        setTimeout(() => setSuccess(''), 2500);
    };

    const onLogoChange = (e) => {
        const f = e.target.files?.[0];
        if (f) setLogoName(f.name);
    };

    const onUploadLogo = () => {
        if (!logoName) { alert('Please choose a file first.'); return; }
        alert(`Upload not yet wired to a storage backend. Selected: ${logoName}`);
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName="System Settings" />
                <div className="erp-page">
                    <div style={{ padding: '10px 16px 6px' }}>
                        <h2 style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 8, fontSize: 18 }}>
                            🎨 System Settings
                        </h2>
                        <p style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
                            Manage theme colors and company logo.
                        </p>
                        {success && <div className="success" style={{ marginTop: 8 }}>{success}</div>}
                    </div>

                    {/* Theme Colors card */}
                    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, margin: '0 16px 10px', padding: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ width: 26, height: 26, borderRadius: 6, background: '#dbeafe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎨</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 14, color: '#111827' }}>Theme Colors</h3>
                                <div style={{ fontSize: 11, color: '#6b7280' }}>Customize primary and secondary colors</div>
                            </div>
                        </div>

                        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <ColorField label="Primary Color" value={primary} onChange={setPrimary} />
                            <ColorField label="Secondary Color" value={secondary} onChange={setSecondary} />
                        </div>

                        <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
                            <button
                                type="button"
                                onClick={onUpdateTheme}
                                style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >🎨 Update Theme</button>
                            <button
                                type="button"
                                onClick={onReset}
                                style={{ background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                            >Reset</button>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 'auto', fontSize: 11, color: '#6b7280' }}>
                                <span style={{ width: 18, height: 18, borderRadius: 4, background: primary, border: '1px solid #e5e7eb' }} />
                                <span style={{ width: 18, height: 18, borderRadius: 4, background: secondary, border: '1px solid #e5e7eb' }} />
                                Preview
                            </div>
                        </div>
                    </div>

                    {/* Company Logo card */}
                    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, margin: '0 16px 10px', padding: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ width: 26, height: 26, borderRadius: 6, background: '#ede9fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🖼️</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 14, color: '#111827' }}>Company Logo</h3>
                                <div style={{ fontSize: 11, color: '#6b7280' }}>Upload or manage your company logo</div>
                            </div>
                        </div>

                        <div style={{ marginTop: 10 }}>
                            <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Upload New Logo</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                                <label
                                    htmlFor="logo-upload-input"
                                    style={{ background: '#3b82f6', color: 'white', borderRadius: 4, padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                                >Choose file</label>
                                <input
                                    id="logo-upload-input"
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    onChange={onLogoChange}
                                    style={{ display: 'none' }}
                                />
                                <span style={{ fontSize: 11, color: '#6b7280' }}>{logoName || 'No file chosen'}</span>
                                <button
                                    type="button"
                                    onClick={onUploadLogo}
                                    style={{ marginLeft: 'auto', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                >📤 Upload Logo</button>
                            </div>
                            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
                                Supported formats: JPG, PNG, JPEG, WEBP (Max 10 MB)
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function ColorField({ label, value, onChange }) {
    return (
        <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 3, fontWeight: 600 }}>{label}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    style={{ width: 36, height: 28, border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', padding: 0, background: 'white' }}
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#1976d2"
                    style={{ flex: 1, padding: '5px 10px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 6, fontFamily: 'monospace' }}
                />
            </div>
        </div>
    );
}

export default SystemSettings;
