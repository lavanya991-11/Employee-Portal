import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ActionButton from '../components/ActionButton';
import PageHeader from '../components/PageHeader';
import { leaveApi, finElementApi } from '../services/api';

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';

function ApplyLeave() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialType = searchParams.get('type') || '';

    const [leaveOptions, setLeaveOptions] = useState([]); // [{ finId, description }, ...]
    const [existingLeaves, setExistingLeaves] = useState([]); // user's pending/approved leaves

    const [form, setForm] = useState({
        leaveType: initialType,
        leaveFinId: null,
        payType: 'Paid',
        payTypeManual: false,
        fromDate: '',
        toDate: '',
        session: 'Full Day',
        reason: '',
        attachment: null,
        docDate: today(),
        docSeries: '2',
        docNumber: 9,
        assignedLeaves: 0,
        availableLeaves: 0,
        noOfDays: 0,
        balanceLeaves: 0
    });
    const fileInputRef = useRef(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);
    const [actionsOpen, setActionsOpen] = useState(true);
    const [sideTab, setSideTab] = useState('actions'); // actions | info | reports | shortcuts
    const editId = searchParams.get('edit');
    const [savedId, setSavedId] = useState(editId || null);

    // Load user's existing leaves once so we can warn about duplicates.
    useEffect(() => {
        leaveApi.myLeaves().then(({ data }) => {
            const active = (data.leaves || [])
                .filter((l) => ['Pending', 'Approved'].includes(l.status))
                .filter((l) => l._id !== editId); // exclude the one being edited
            setExistingLeaves(active);
        }).catch(() => {});
    }, [editId]);

    // If editing, pre-fill the form from the existing leave.
    useEffect(() => {
        if (!editId) return;
        leaveApi.getOne(editId).then(({ data }) => {
            const l = data.leave;
            if (!l) return;
            setForm((f) => ({
                ...f,
                leaveType: l.leaveType || '',
                leaveFinId: l.leaveFinId || null,
                payType: l.payType || 'Paid',
                payTypeManual: true,
                fromDate: l.fromDate ? l.fromDate.slice(0, 10) : '',
                toDate: l.toDate ? l.toDate.slice(0, 10) : '',
                reason: l.reason || ''
            }));
        }).catch((err) => {
            setError(err.response?.data?.message || 'Failed to load leave');
        });
    }, [editId]);

    // Load leave-type FIN elements (PaidLeave + UnPaidLeave) from MongoDB.
    useEffect(() => {
        finElementApi.list().then(({ data }) => {
            const items = (data.items || [])
                .filter((it) => ['PaidLeave', 'UnPaidLeave'].includes(it.finType))
                .map((it) => ({ finId: it.finId, description: it.description || `FIN ${it.finId}` }));
            setLeaveOptions(items);
            if (items.length && !form.leaveType) {
                setForm((f) => ({ ...f, leaveType: items[0].description, leaveFinId: items[0].finId }));
            }
        }).catch(() => {});
    }, []);

    // Fetch leave balance from BC whenever the selected leave type changes.
    useEffect(() => {
        if (!form.leaveFinId) return;
        leaveApi.bcBalance(form.leaveFinId, form.docDate).then(({ data }) => {
            const r = data.result || {};
            const entitlement = Number(r.entitlement) || 0;
            const balance = Number(r.balance) || 0;
            setForm((f) => ({
                ...f,
                assignedLeaves: entitlement,
                availableLeaves: balance,
                balanceLeaves: Math.max(0, balance - Number(f.noOfDays || 0))
            }));
        }).catch((err) => {
            setError(err.response?.data?.message || 'Could not fetch balance from BC');
        });
    }, [form.leaveFinId, form.docDate]);

    // Find an overlapping existing leave (if any). Rejected leaves stay in
    // the system as history but do NOT block a new application on the same
    // dates — only Pending and Approved leaves are treated as blocking.
    const findOverlap = (fromStr, toStr) => {
        if (!fromStr || !toStr) return null;
        const from = new Date(fromStr);
        const to = new Date(toStr);
        return existingLeaves.find((l) => {
            if (l.status === 'Rejected') return false;
            const lf = new Date(l.fromDate);
            const lt = new Date(l.toDate);
            return lf <= to && lt >= from;
        }) || null;
    };

    // Auto-calculate No Of Days when dates / session change.
    useEffect(() => {
        if (!form.fromDate || !form.toDate) {
            setForm((f) => ({ ...f, noOfDays: 0 }));
            return;
        }
        const from = new Date(form.fromDate);
        const to = new Date(form.toDate);
        if (isNaN(from) || isNaN(to)) {
            setForm((f) => ({ ...f, noOfDays: 0 }));
            return;
        }
        if (to < from) {
            setError('Leave To Date cannot be before Leave From Date.');
            setForm((f) => ({ ...f, noOfDays: 0 }));
            return;
        }
        const dup = findOverlap(form.fromDate, form.toDate);
        if (dup) {
            const f1 = new Date(dup.fromDate).toLocaleDateString('en-GB');
            const t1 = new Date(dup.toDate).toLocaleDateString('en-GB');
            setError(`You already have a ${dup.status.toLowerCase()} ${dup.leaveType} leave from ${f1} to ${t1}. Cannot apply on the same date.`);
        }
        const days = Math.round((to - from) / 86400000) + 1; // inclusive
        // Full Day = N. Half Day session = N - 0.5 (one day in the range is a half).
        const computed = form.session === 'Full Day' ? days : Math.max(0.5, days - 0.5);
        setError('');
        setForm((f) => ({ ...f, noOfDays: computed }));
    }, [form.fromDate, form.toDate, form.session]);

    // Auto-set Pay Type from available balance — read-only, always derived.
    //   balance == 0 → Paid
    //   balance >  0 → Unpaid
    useEffect(() => {
        setForm((f) => {
            const avail = Number(f.availableLeaves) || 0;
            return { ...f, payType: avail > 0 ? 'Unpaid' : 'Paid' };
        });
    }, [form.availableLeaves]);

    // Auto-recalculate Balance when Available or No Of Days change.
    useEffect(() => {
        setForm((f) => ({ ...f, balanceLeaves: Math.max(0, Number(f.availableLeaves) - Number(f.noOfDays)) }));
    }, [form.availableLeaves, form.noOfDays]);

    const onChange = (e) => {
        const { name, value, type } = e.target;
        const next = type === 'number' ? (value === '' ? '' : Number(value)) : value;
        setForm({ ...form, [name]: next });
        setError(''); setSuccess('');
    };

    const submitLeave = async (saveOnly) => {
        setError(''); setSuccess('');
        if (!form.fromDate || !form.toDate || !form.reason) {
            setError('Leave From Date, Leave To Date and Reasons are required.');
            return;
        }
        if (new Date(form.toDate) < new Date(form.fromDate)) {
            setError('LeaveToDate cannot be before LeaveFromDate.');
            return;
        }
        // Overlap check ONLY when posting (not when saving a draft).
        if (!saveOnly) {
            const dup = findOverlap(form.fromDate, form.toDate);
            if (dup && dup._id !== savedId) {
                const f1 = new Date(dup.fromDate).toLocaleDateString('en-GB');
                const t1 = new Date(dup.toDate).toLocaleDateString('en-GB');
                setError(`You already have a ${dup.status.toLowerCase()} ${dup.leaveType} leave from ${f1} to ${t1}. Cannot apply on the same date.`);
                return;
            }
        }
        setSaving(true);
        try {
            const basePayload = {
                leaveType: form.leaveType,
                leaveFinId: form.leaveFinId,
                payType: form.payType,
                fromDate: form.fromDate,
                toDate: form.toDate,
                reason: form.reason
            };

            if (saveOnly) {
                // Save = create new draft or update the one we already created on this page.
                let resData;
                if (savedId) {
                    const { data } = await leaveApi.update(savedId, basePayload);
                    resData = data;
                    setSuccess('Draft updated. Click 📤 Post when ready.');
                } else {
                    const { data } = await leaveApi.apply({ ...basePayload, saveOnly: true });
                    resData = data;
                    const newId = data.leaves?.[0]?._id;
                    if (newId) setSavedId(newId);
                    setSuccess('Saved as draft. Click 📤 Post when ready.');
                }
                // STAY on page — no navigate.
                return;
            }

            // Post = full BC flow. If we have a draft on this page, replace it.
            const { data } = await leaveApi.apply({ ...basePayload, replaceDraftId: savedId || undefined });
            const bcResults = Array.isArray(data?.bc) ? data.bc : (data?.bc ? [data.bc] : []);
            const bcFails = bcResults.filter((r) => !r.ok);
            if (bcFails.length > 0) {
                // Business Central did not accept it — stay on the page and show why,
                // so it's clear the leave is still a draft (not silently navigated away).
                setError(`Not posted to Business Central: ${bcFails.map((f) => f.error || 'unknown').join(' | ')}`);
                const newId = data.leaves?.[0]?._id;
                if (newId) setSavedId(newId); // point at the recreated draft so Post can retry it
                return;
            }
            setSuccess('Posted to Business Central.');
            navigate('/leaves/my');
        } catch (err) {
            setError(err.response?.data?.message || (saveOnly ? 'Failed to save leave' : 'Failed to apply leave'));
        } finally {
            setSaving(false);
        }
    };

    const onSubmit = (e) => { e?.preventDefault?.(); return submitLeave(false); };
    const onSaveDraft = () => submitLeave(true);

    const onNew = () => {
        const first = leaveOptions[0];
        setForm({
            leaveType: first?.description || '', leaveFinId: first?.finId || null,
            payType: 'Paid', payTypeManual: false,
            fromDate: '', toDate: '', session: 'Full Day',
            reason: '', attachment: null, docDate: today(), docSeries: '2', docNumber: 9,
            assignedLeaves: 0, availableLeaves: 0, noOfDays: 0, balanceLeaves: 0
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
        const data = JSON.stringify(form, null, 2);
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
        alert(`E-Invoice preview\n\nLeave Type: ${form.leaveType}\nFrom: ${form.fromDate}\nTo: ${form.toDate}\nDays: ${form.noOfDays}\nDoc: ${form.docSeries} / ${form.docNumber}`);
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName={editId ? 'Edit Leave' : 'Apply Leave'} />
                <div className="erp-page">
                    <div className="erp-titlebar" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
                        <div className="erp-titlebar-actions" style={{ justifyContent: 'flex-end' }}>
                            <ActionButton kind="back" onClick={() => navigate(-1)}>Back</ActionButton>
                            <ActionButton kind="add" tint="primary" onClick={onNew}>New</ActionButton>
                            <ActionButton kind="save" onClick={onSaveDraft} disabled={saving}>
                                {saving ? 'Saving…' : 'Save'}
                            </ActionButton>
                            <ActionButton kind="send" onClick={onSubmit} disabled={saving}>
                                {saving ? 'Posting…' : 'Post'}
                            </ActionButton>
                            <ActionButton kind="print" onClick={() => { onSubmit({ preventDefault: () => {} }); window.print(); }} disabled={saving}>
                                Post &amp; Print
                            </ActionButton>
                        </div>
                        <div className="erp-title">
                            {editId ? 'Edit Leave' : 'Apply Leave'} <span className="erp-badge">{editId ? 'Editing' : 'Draft'}</span>
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
                                        <select
                                            name="leaveType"
                                            value={form.leaveFinId ?? ''}
                                            onChange={(e) => {
                                                const finId = Number(e.target.value);
                                                const opt = leaveOptions.find((o) => o.finId === finId);
                                                setForm({ ...form, leaveFinId: finId, leaveType: opt?.description || '' });
                                                setError(''); setSuccess('');
                                            }}
                                        >
                                            {leaveOptions.length === 0 && <option value="">No leave types — import from BC first</option>}
                                            {leaveOptions.map((o) => (
                                                <option key={o.finId} value={o.finId}>{o.finId} - {o.description}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="erp-field">
                                        <label>Assigned Leaves</label>
                                        <input value={form.assignedLeaves} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Available Leaves</label>
                                        <input value={form.availableLeaves} readOnly className="erp-readonly" />
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
                                        <input type="number" name="noOfDays" value={form.noOfDays} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Balance Leaves</label>
                                        <input type="number" name="balanceLeaves" value={form.balanceLeaves} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Pay Type</label>
                                        <input
                                            type="text"
                                            name="payType"
                                            value={form.payType}
                                            readOnly
                                            className="erp-readonly"
                                        />
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

                        <aside className={`erp-actions-panel ${actionsOpen ? '' : 'erp-actions-panel-collapsed'}`}>
                            {actionsOpen && (
                                <>
                                    <div className="erp-actions-header">
                                        <span>{{ actions: 'Actions', info: 'Info', reports: 'Reports', shortcuts: 'Shortcuts' }[sideTab]}</span>
                                        <button
                                            type="button"
                                            className="erp-actions-close"
                                            onClick={() => setActionsOpen(false)}
                                            title="Close"
                                            aria-label="Close panel"
                                        >×</button>
                                    </div>

                                    {sideTab === 'actions' && (
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
                                    )}

                                    {sideTab === 'info' && (
                                        <div style={{ padding: 14, fontSize: 13 }}>
                                            <div style={{ fontWeight: 700, color: 'var(--accent-dark)', marginBottom: 8 }}>Leave Request</div>
                                            <p style={{ color: 'var(--muted)', lineHeight: 1.55, margin: 0 }}>
                                                Choose a leave pay code and a date range, then <b>Submit</b> to post your request to Business Central. Use <b>Save Draft</b> to keep it for later.
                                            </p>
                                        </div>
                                    )}

                                    {sideTab === 'reports' && (
                                        <ul className="erp-actions-list">
                                            <li onClick={() => navigate('/leaves/my')}>📄 My Leave Requests</li>
                                            <li onClick={() => navigate('/holidays')}>🎉 Holiday Calendar</li>
                                        </ul>
                                    )}

                                    {sideTab === 'shortcuts' && (
                                        <ul className="erp-actions-list">
                                            <li onClick={() => navigate('/dashboard')}>🏠 Dashboard</li>
                                            <li onClick={() => navigate('/leaves/my')}>🗓️ My Leaves</li>
                                            <li onClick={() => navigate('/payslip')}>💰 Payslip</li>
                                        </ul>
                                    )}
                                </>
                            )}
                            <div className="erp-side-tabs">
                                <span className={actionsOpen && sideTab === 'actions' ? 'active' : ''} onClick={() => { setActionsOpen(true); setSideTab('actions'); }}>Actions</span>
                                <span className={actionsOpen && sideTab === 'info' ? 'active' : ''} onClick={() => { setActionsOpen(true); setSideTab('info'); }}>Info</span>
                                <span className={actionsOpen && sideTab === 'reports' ? 'active' : ''} onClick={() => { setActionsOpen(true); setSideTab('reports'); }}>Reports</span>
                                <span className={actionsOpen && sideTab === 'shortcuts' ? 'active' : ''} onClick={() => { setActionsOpen(true); setSideTab('shortcuts'); }}>Shortcuts</span>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ApplyLeave;
