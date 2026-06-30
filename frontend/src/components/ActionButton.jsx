// Reusable modern toolbar action button: colored line icon + label, with
// semantic tint variants (danger = red, primary = blue). Drop-in replacement
// for the old emoji `.erp-action-btn` buttons — look only, same onClick/props.

const mk = (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>{p}</svg>
);

const ICONS = {
    back: mk(<><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>),
    home: mk(<><path d="m3 9 9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>),
    add: mk(<><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M12 8v8M8 12h8" /></>),
    edit: mk(<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>),
    trash: mk(<><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M10 11v6M14 11v6" /></>),
    refresh: mk(<><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v5h-5" /></>),
    scan: mk(<><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M6 12h12" /></>),
    sparkles: mk(<><path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6Z" /><path d="M5 16v3M3.5 17.5h3M18 4v2M17 5h2" /></>),
    save: mk(<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8M7 3v5h8" /></>),
    send: mk(<><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>),
    print: mk(<><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" rx="1" /></>),
    export: mk(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></>),
    filter: mk(<><path d="M22 3H2l8 9.5V19l4 2v-8.5Z" /></>),
    eye: mk(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>),
    mail: mk(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>),
    calc: mk(<><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h4" /></>),
};

const COLORS = {
    back: '#2563eb', home: '#2563eb', add: '#2563eb', edit: '#f59e0b', trash: '#ef4444',
    refresh: '#16a34a', scan: '#2563eb', sparkles: '#7c3aed', save: '#2563eb', send: '#2563eb',
    print: '#475569', export: '#0ea5e9', filter: '#475569', eye: '#475569', mail: '#0ea5e9', calc: '#7c3aed'
};

export default function ActionButton({ kind, tint, children, ...props }) {
    const variant = (tint === 'danger' || kind === 'trash') ? ' eab-danger' : tint === 'primary' ? ' eab-primary' : '';
    return (
        <button type="button" className={`erp-action-btn${variant}`} {...props}>
            {kind && <span style={{ color: COLORS[kind] || '#334155', display: 'inline-flex' }}>{ICONS[kind]}</span>}
            {children}
        </button>
    );
}
