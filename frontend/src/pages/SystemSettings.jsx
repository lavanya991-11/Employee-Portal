import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { imageApi, resolveImageUrl } from '../services/api';

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
    const [logoData, setLogoData] = useState('');   // base64 of a newly chosen file
    const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('companyLogo') || '');
    const [uploading, setUploading] = useState(false);

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
        if (!f) return;
        setLogoName(f.name);
        const reader = new FileReader();
        reader.onload = () => setLogoData(reader.result); // data URI (data:image/...;base64,...)
        reader.readAsDataURL(f);
    };

    const onUploadLogo = async () => {
        if (!logoData) { alert('Please choose a file first.'); return; }
        setUploading(true);
        try {
            const { data } = await imageApi.upload(logoData, { purpose: 'logo', filename: logoName });
            const url = data.image?.url || '';
            localStorage.setItem('companyLogo', url);
            setLogoUrl(url);
            setLogoData('');
            setLogoName('');
            setSuccess('Company logo uploaded.');
            setTimeout(() => setSuccess(''), 2500);
        } catch (err) {
            alert(err.response?.data?.message || 'Logo upload failed');
        } finally {
            setUploading(false);
        }
    };

    const onDeleteLogo = async () => {
        if (!logoUrl) return;
        if (!window.confirm('Delete the company logo?')) return;
        const id = logoUrl.split('/').pop();
        try { await imageApi.remove(id); } catch (e) { /* image may already be gone */ }
        localStorage.removeItem('companyLogo');
        setLogoUrl('');
        setSuccess('Company logo removed.');
        setTimeout(() => setSuccess(''), 2500);
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName="System Settings" />
                <div className="erp-page" style={{ maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
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

                        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
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

                        {logoUrl && (
                            <div style={{ marginTop: 14 }}>
                                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Current Logo:</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                                    <img
                                        src={resolveImageUrl(logoUrl)}
                                        alt="Company logo"
                                        style={{ maxHeight: 90, maxWidth: 240, border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, background: '#fff' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={onDeleteLogo}
                                        style={{ background: 'transparent', color: '#b91c1c', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                    >🗑 Delete Logo</button>
                                </div>
                            </div>
                        )}

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
                                Supported formats: JPG, PNG, JPEG, WEBP (Max 5 MB)
                            </div>

                            {logoData && (
                                <div style={{ marginTop: 14, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 14 }}>
                                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Preview:</div>
                                    <img
                                        src={logoData}
                                        alt="Logo preview"
                                        style={{ maxHeight: 110, maxWidth: 240, border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, background: '#fff' }}
                                    />
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: 18 }}>
                            <button
                                type="button"
                                onClick={onUploadLogo}
                                disabled={uploading}
                                style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: uploading ? 'default' : 'pointer', opacity: uploading ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >📤 {uploading ? 'Uploading…' : 'Upload Logo'}</button>
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
