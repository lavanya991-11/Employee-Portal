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
                    <div style={{ padding: 20 }}>
                        <h2 style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 8 }}>
                            🎨 System Settings
                        </h2>
                        <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
                            Manage theme colors and company logo.
                        </p>
                        {success && <div className="success" style={{ marginTop: 12 }}>{success}</div>}
                    </div>

                    {/* Theme Colors card */}
                    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, margin: '0 20px 20px', padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <span style={{ width: 32, height: 32, borderRadius: 8, background: '#dbeafe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎨</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 15, color: '#111827' }}>Theme Colors</h3>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>Customize primary and secondary colors</div>
                            </div>
                        </div>

                        <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            <ColorField label="Primary Color" value={primary} onChange={setPrimary} />
                            <ColorField label="Secondary Color" value={secondary} onChange={setSecondary} />
                        </div>

                        <div style={{ marginTop: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
                            <button
                                type="button"
                                onClick={onUpdateTheme}
                                style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >🎨 Update Theme</button>
                            <button
                                type="button"
                                onClick={onReset}
                                style={{ background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, padding: '8px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                            >Reset</button>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 'auto', fontSize: 12, color: '#6b7280' }}>
                                <span style={{ width: 20, height: 20, borderRadius: 4, background: primary, border: '1px solid #e5e7eb' }} />
                                <span style={{ width: 20, height: 20, borderRadius: 4, background: secondary, border: '1px solid #e5e7eb' }} />
                                Preview
                            </div>
                        </div>
                    </div>

                    {/* Company Logo card */}
                    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, margin: '0 20px 20px', padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <span style={{ width: 32, height: 32, borderRadius: 8, background: '#ede9fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🖼️</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 15, color: '#111827' }}>Company Logo</h3>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>Upload or manage your company logo</div>
                            </div>
                        </div>

                        <div style={{ marginTop: 16 }}>
                            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Upload New Logo</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                                <label
                                    htmlFor="logo-upload-input"
                                    style={{ background: '#3b82f6', color: 'white', borderRadius: 4, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                                >Choose file</label>
                                <input
                                    id="logo-upload-input"
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    onChange={onLogoChange}
                                    style={{ display: 'none' }}
                                />
                                <span style={{ fontSize: 12, color: '#6b7280' }}>{logoName || 'No file chosen'}</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                                Supported formats: JPG, PNG, JPEG, WEBP (Max 10 MB)
                            </div>
                        </div>

                        <div style={{ marginTop: 18 }}>
                            <button
                                type="button"
                                onClick={onUploadLogo}
                                style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >📤 Upload Logo</button>
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
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>{label}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    style={{ width: 50, height: 36, border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', padding: 0, background: 'white' }}
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#1976d2"
                    style={{ flex: 1, padding: '8px 12px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 6, fontFamily: 'monospace' }}
                />
            </div>
        </div>
    );
}

export default SystemSettings;
