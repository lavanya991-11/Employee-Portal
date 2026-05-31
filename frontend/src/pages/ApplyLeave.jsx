import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { leaveApi } from '../services/api';

const TYPE_LIMITS = {
    Sick: 21,
    Casual: 12,
    Paid: 18,
    Unpaid: 0,
    Earned: 15
};

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';

function ApplyLeave() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialType = searchParams.get('type') || 'Casual';

    const [form, setForm] = useState({
        leaveType: initialType,
        fromDate: '',
        toDate: '',
        session: 'Full Day',
        reason: '',
        attachment: null,
        docDate: today(),
        docSeries: '2',
        docNumber: 9
    });
    const fileInputRef = useRef(null);
    const [availed, setAvailed] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        leaveApi.myLeaves().then(({ data }) => {
            const used = (data.leaves || [])
                .filter((l) => l.leaveType === form.leaveType && l.status === 'Approved')
                .reduce((s, l) => s + (l.totalDays || 0), 0);
            setAvailed(used);
        }).catch(() => {});
    }, [form.leaveType]);

    const assigned = TYPE_LIMITS[form.leaveType] ?? 0;
    const available = Math.max(0, assigned - availed);

    const noOfDays = useMemo(() => {
        if (!form.fromDate || !form.toDate) return 0;
        const diff = new Date(form.toDate) - new Date(form.fromDate);
        if (diff < 0) return 0;
        const days = Math.floor(diff / 86400000) + 1;
        return form.session === 'Full Day' ? days : days * 0.5;
    }, [form.fromDate, form.toDate, form.session]);

    const balance = Math.max(0, available - noOfDays);

    const onChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError(''); setSuccess('');
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!form.fromDate || !form.toDate || !form.reason) {
            setError('Leave From Date, Leave To Date and Reasons are required.');
            return;
        }
        if (new Date(form.toDate) < new Date(form.fromDate)) {
            setError('LeaveToDate cannot be before LeaveFromDate.');
            return;
        }
        if (noOfDays > available) {
            setError(`Not enough balance. Available: ${available}, requested: ${noOfDays}.`);
            return;
        }
        setSaving(true);
        try {
            await leaveApi.apply({
                leaveType: form.leaveType,
                fromDate: form.fromDate,
                toDate: form.toDate,
                reason: form.reason
            });
            setSuccess('Leave application submitted.');
            setTimeout(() => navigate('/leaves/my'), 1200);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to apply leave');
        } finally {
            setSaving(false);
        }
    };

    const onNew = () => {
        setForm({
            leaveType: initialType, fromDate: '', toDate: '', session: 'Full Day',
            reason: '', attachment: null, docDate: today(), docSeries: '2', docNumber: 9
        });
        setError(''); setSuccess('');
    };

    const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB

    const onAttachClick = () => fileInputRef.current?.click();

    const onAttachChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_ATTACHMENT_BYTES) {
            setError(`File too large (${Math.round(file.size / 1024 / 1024)} MB). Max 5 MB.`);
            e.target.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setForm((f) => ({
                ...f,
                attachment: { name: file.name, type: file.type, size: file.size, dataUrl: reader.result }
            }));
            setSuccess(`Attached: ${file.name} (${Math.round(file.size / 1024)} KB)`);
        };
        reader.onerror = () => setError('Could not read file.');
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const onAttachView = () => {
        if (!form.attachment) {
            setError('No attachment to view.');
            return;
        }
        const w = window.open();
        if (!w) { setError('Popup blocked. Allow popups to view.'); return; }
        if (form.attachment.type?.startsWith('image/')) {
            w.document.write(`<img src="${form.attachment.dataUrl}" style="max-width:100%" />`);
        } else {
            w.location.href = form.attachment.dataUrl;
        }
    };

    const onAttachDelete = () => {
        if (!form.attachment) return;
        if (!confirm(`Delete attachment "${form.attachment.name}"?`)) return;
        setForm((f) => ({ ...f, attachment: null }));
        setSuccess('Attachment deleted.');
    };

    const onDocSearch = () => {
        alert(`Searching for doc ${form.docSeries} / ${form.docNumber}`);
    };

    const DRAFT_KEY = 'applyLeaveDraft';

    useEffect(() => {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
            try {
                const draft = JSON.parse(saved);
                setForm((f) => ({ ...f, ...draft }));
                setSuccess('Loaded saved draft.');
            } catch (e) {}
        }
    }, []);

    const onPrint = () => window.print();

    const onSuspend = () => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
        setSuccess('Draft suspended (saved). You can come back later.');
    };

    const onExport = () => {
        const data = JSON.stringify({ ...form, noOfDays, assigned, available, balance }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leave-${form.docSeries}-${form.docNumber}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(form, null, 2));
            setSuccess('Form copied to clipboard.');
        } catch (e) {
            setError('Copy failed: ' + e.message);
        }
    };

    const onSearch = () => {
        const q = prompt('Enter doc number to search (e.g. "2 / 9")');
        if (q) alert(`Search: ${q}\n(connect this to your leaves list later.)`);
    };

    const onMap = () => {
        const city = JSON.parse(localStorage.getItem('user') || '{}').address?.city
            || 'Dubai';
        window.open(`https://www.google.com/maps/search/${encodeURIComponent(city)}`, '_blank');
    };

    const onEInv = () => {
        alert(`E-Invoice preview\n\nLeave Type: ${form.leaveType}\nFrom: ${form.fromDate}\nTo: ${form.toDate}\nDays: ${noOfDays}\nDoc: ${form.docSeries} / ${form.docNumber}`);
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">
                            Apply Leave <span className="erp-badge">Draft</span>
                        </div>
                        <div className="erp-titlebar-actions">
                            <button type="button" className="erp-action-btn" onClick={onNew}>📄 New</button>
                            <button type="button" className="erp-action-btn" onClick={onSubmit} disabled={saving}>
                                {saving ? 'Posting…' : '📤 Post'}
                            </button>
                            <button type="button" className="erp-action-btn" onClick={() => { onSubmit({ preventDefault: () => {} }); window.print(); }} disabled={saving}>
                                🖨️ Post & Print
                            </button>
                        </div>
                    </div>

                    <div className="erp-body">
                        <form className="erp-form" onSubmit={onSubmit}>
                            {error && <div className="error">{error}</div>}
                            {success && <div className="success">{success}</div>}

                            <div className="erp-section">
                                <div className="erp-section-header">Details</div>
                                <div className="erp-grid">
                                    <div className="erp-field">
                                        <label>Leave Types *</label>
                                        <select name="leaveType" value={form.leaveType} onChange={onChange}>
                                            <option>Sick</option>
                                            <option>Casual</option>
                                            <option>Paid</option>
                                            <option>Unpaid</option>
                                            <option>Earned</option>
                                        </select>
                                    </div>
                                    <div className="erp-field">
                                        <label>Assigned Leaves</label>
                                        <input value={assigned} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Available Leaves</label>
                                        <input value={available} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Leave From Date *</label>
                                        <input type="date" name="fromDate" value={form.fromDate} onChange={onChange} required />
                                    </div>
                                    <div className="erp-field">
                                        <label>Leave To Date *</label>
                                        <input type="date" name="toDate" value={form.toDate} onChange={onChange} required />
                                    </div>
                                    <div className="erp-field">
                                        <label>Session *</label>
                                        <select name="session" value={form.session} onChange={onChange}>
                                            <option>Full Day</option>
                                            <option>Half Day - Morning</option>
                                            <option>Half Day - Afternoon</option>
                                        </select>
                                    </div>
                                    <div className="erp-field">
                                        <label>No Of Days *</label>
                                        <input value={noOfDays} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Balance Leaves</label>
                                        <input value={balance} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field erp-field-wide">
                                        <label>Reasons *</label>
                                        <input name="reason" value={form.reason} onChange={onChange} required
                                            className={form.reason ? '' : 'erp-required'} />
                                    </div>
                                    <div className="erp-field erp-field-wide">
                                        <label>Leave Attach</label>
                                        <div className="erp-attach">
                                            <span className="erp-attach-actions">
                                                <a href="#" onClick={(e) => { e.preventDefault(); onAttachClick(); }}>Upload</a>{' '}
                                                <a href="#" onClick={(e) => { e.preventDefault(); onAttachView(); }}>View</a>{' '}
                                                <a href="#" onClick={(e) => { e.preventDefault(); onAttachDelete(); }}>Delete</a>
                                            </span>
                                            <input
                                                value={form.attachment ? `${form.attachment.name} (${Math.round(form.attachment.size / 1024)} KB)` : ''}
                                                readOnly
                                                placeholder="No file attached"
                                                className="erp-readonly"
                                            />
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*,application/pdf,.doc,.docx"
                                                style={{ display: 'none' }}
                                                onChange={onAttachChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="erp-section">
                                <div className="erp-section-header">Primary Information</div>
                                <div className="erp-grid">
                                    <div className="erp-field">
                                        <label>Doc Date</label>
                                        <input type="date" name="docDate" value={form.docDate} onChange={onChange} />
                                    </div>
                                    <div className="erp-field">
                                        <label>Doc No</label>
                                        <div className="erp-docno">
                                            <select name="docSeries" value={form.docSeries} onChange={onChange} className="erp-docno-series">
                                                {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => (
                                                    <option key={n} value={String(n)}>{n}</option>
                                                ))}
                                            </select>
                                            <input type="number" name="docNumber" value={form.docNumber} onChange={onChange} className="erp-docno-num" min="1" />
                                            <button type="button" className="erp-docno-search" onClick={onDocSearch} title="Search">🔍</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        <aside className="erp-actions-panel">
                            <div className="erp-actions-header">Actions</div>
                            <ul className="erp-actions-list">
                                <li onClick={onPrint}>🖨️ Print</li>
                                <li onClick={onPrint}>👁️ Print Preview</li>
                                <li onClick={onSuspend}>⏸️ Suspend</li>
                                <li onClick={onExport}>📤 Export</li>
                                <li onClick={onCopy}>📋 Copy</li>
                                <li onClick={onSearch}>🔍 Search</li>
                                <li onClick={onMap}>🗺️ Map</li>
                                <li onClick={onEInv}>📨 EInv</li>
                            </ul>
                            <div className="erp-side-tabs">
                                <span>Actions</span>
                                <span>Info</span>
                                <span>Reports</span>
                                <span>Shortcuts</span>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ApplyLeave;
