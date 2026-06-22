import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { authApi, employeeInfoApi, calendarApi, calendarPeriodApi, payslipApi } from '../services/api';

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Readable label for a payroll period row coming from BC's Calendar Period data.
const periodLabel = (p) =>
    p ? `Period ${p.periodNo} — ${MONTHS[p.month] || p.month || ''}${p.year ? `/${p.year}` : ''}`.trim() : '';

const inr = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';

// Inline styles so the payslip renders identically wherever it's deployed
// (matches the BC "Employee Payslip" report layout).
const TBL = { borderCollapse: 'collapse', width: '100%', fontSize: 12 };
const TH = { border: '1px solid #b9c4d4', padding: '5px 8px', background: '#4472a4', color: '#fff', textAlign: 'left' };
const TD = { border: '1px solid #cbd5e1', padding: '5px 8px' };
const labelCell = { width: 135, fontWeight: 700 };

function Payslip() {
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const [info, setInfo] = useState(null);
    const [allEmployees, setAllEmployees] = useState([]);

    const [calendars, setCalendars] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [periodsLoading, setPeriodsLoading] = useState(false);
    const [periodsError, setPeriodsError] = useState('');
    const [calendarCode, setCalendarCode] = useState('');
    const [payrollPeriod, setPayrollPeriod] = useState('');

    const [showFilter, setShowFilter] = useState(false);
    const [filterEmp, setFilterEmp] = useState('');
    const [costCenter, setCostCenter] = useState('Employee Master');
    const [paymentMode, setPaymentMode] = useState('All');
    const [filterField, setFilterField] = useState('Employee');
    const [filterOp, setFilterOp] = useState('Contains');
    const [filterMatch, setFilterMatch] = useState('Full Text');
    const [filterSearch, setFilterSearch] = useState('');
    const [employeeGroupOpen, setEmployeeGroupOpen] = useState(true);

    const [showPreview, setShowPreview] = useState(false);
    const [status, setStatus] = useState('');
    const [bcPayslip, setBcPayslip] = useState(null);
    const [payslipLoading, setPayslipLoading] = useState(false);

    useEffect(() => {
        authApi.me().then(({ data }) => setUser(data.user || data)).catch(() => {});
        employeeInfoApi.getMy().then(({ data }) => {
            setInfo(data.employeeInfo || null);
            if (data.employeeInfo?.employeeCode) setFilterEmp(data.employeeInfo.employeeCode);
        }).catch(() => {});
        employeeInfoApi.getAll().then(({ data }) => setAllEmployees(data.employees || [])).catch(() => {});
        calendarApi.list().then(({ data }) => {
            const list = data.items || [];
            setCalendars(list);
            if (list.length) setCalendarCode(list[0].calendarCode);
        }).catch(() => {});
    }, []);

    // Calendar Code -> calendar year.
    const selectedCalendar = useMemo(
        () => calendars.find((c) => c.calendarCode === calendarCode) || null,
        [calendars, calendarCode]
    );
    const calendarYear = selectedCalendar?.calendarYear || '';

    // The Payroll Period lookup is fetched from BC filtered by BOTH the selected
    // Calendar Code and its year, so it only shows periods for that calendar.
    useEffect(() => {
        if (!calendarCode || !calendarYear) {
            setPeriods([]);
            return;
        }
        let cancelled = false;
        setPeriodsLoading(true); setPeriodsError('');
        calendarPeriodApi.byCalendar(calendarCode, calendarYear)
            .then(({ data }) => { if (!cancelled) setPeriods(data.items || []); })
            .catch((err) => {
                if (cancelled) return;
                setPeriods([]);
                setPeriodsError(err.response?.data?.message || 'Failed to load payroll periods');
            })
            .finally(() => { if (!cancelled) setPeriodsLoading(false); });
        return () => { cancelled = true; };
    }, [calendarCode, calendarYear]);

    // Keep the selected period valid for the currently loaded list.
    useEffect(() => {
        if (periods.length === 0) {
            if (payrollPeriod) setPayrollPeriod('');
            return;
        }
        if (!periods.some((p) => String(p.periodNo) === String(payrollPeriod))) {
            setPayrollPeriod(String(periods[0].periodNo));
        }
    }, [periods]); // eslint-disable-line react-hooks/exhaustive-deps

    const selectedPeriod = useMemo(
        () => periods.find((p) => String(p.periodNo) === String(payrollPeriod)) || null,
        [periods, payrollPeriod]
    );
    const periodText = periodLabel(selectedPeriod);

    // Mirror BC's "Employee Monthly Salaries" request page: the period's
    // start/end dates auto-populate from the selections above.
    const fromDate = selectedPeriod?.calendarStartDate || null;
    const toDate = selectedPeriod?.calendarEndDate || null;

    const selectedEmployee = useMemo(() => {
        return allEmployees.find((e) => e.employeeCode === filterEmp)
            || (info && info.employeeCode === filterEmp ? info : info);
    }, [allEmployees, filterEmp, info]);

    // Real payslip built from the BC GeneratePaySlip response. `lines` are
    // split into earnings/deductions by the isEarning flag.
    const payslip = useMemo(() => {
        if (!bcPayslip) return null;
        const lines = bcPayslip.lines || [];
        const label = (l) => `${l.payCode != null ? l.payCode + '-' : ''}${l.payCodeDescription || ''}`;
        return {
            earnings: lines.filter((l) => l.isEarning).map((l) => ({ label: label(l), amount: l.amount, days: l.days })),
            deductions: lines.filter((l) => !l.isEarning).map((l) => ({ label: label(l), amount: l.amount, days: l.days })),
            gross: bcPayslip.totalEarnings || 0,
            totalDeductions: bcPayslip.totalDeductions || 0,
            net: bcPayslip.netSalary || 0,
            currency: bcPayslip.currency || ''
        };
    }, [bcPayslip]);

    const money = (n) => `${payslip?.currency ? payslip.currency + ' ' : ''}${inr(n)}`;
    const printDate = useMemo(() => new Date().toLocaleString('en-US'), [bcPayslip]);

    // A previewed payslip becomes stale once the selection changes — hide it.
    useEffect(() => {
        setShowPreview(false);
        setBcPayslip(null);
    }, [calendarCode, payrollPeriod, filterEmp]);

    const onPreview = async () => {
        if (!filterEmp) { setStatus('Select an employee via Filter first.'); return; }
        if (!selectedPeriod) { setStatus('Select a Calendar Code and Payroll Period first.'); return; }
        setStatus(''); setPayslipLoading(true);
        try {
            const { data } = await payslipApi.generate({
                calendarCode,
                year: calendarYear,
                payrollPeriod: selectedPeriod.periodNo,
                employeeCode: filterEmp
            });
            setBcPayslip(data.payslip);
            setShowPreview(true);
        } catch (err) {
            setBcPayslip(null);
            setShowPreview(false);
            setStatus(err.response?.data?.message || err.response?.data?.error || 'Failed to generate payslip from BC');
        } finally {
            setPayslipLoading(false);
        }
    };
    const onPrint = () => { if (payslip) setTimeout(() => window.print(), 250); else onPreview(); };
    // Build a self-contained HTML document of the payslip (same data/layout as
    // the on-screen report) for PDF export via the browser's print dialog.
    const buildPayslipHtml = () => {
        const row = (label, amount) => `<tr><td>${label}</td><td class="r">${inr(amount)}</td></tr>`;
        const earnRows = payslip.earnings.map((e) => row(e.label, e.amount)).join('');
        const dedRows = payslip.deductions.map((d) => row(d.label, d.amount)).join('');
        return `<!DOCTYPE html><html><head><meta charset="utf-8" />
<title>Payslip-${bcPayslip.employeeCode || ''}-Period${bcPayslip.payrollPeriod ?? ''}</title>
<style>
  *{box-sizing:border-box;}
  body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;padding:28px 32px;}
  h1{text-align:center;color:#1f4e9c;font-size:24px;margin:4px 0 22px;}
  .grid2{display:grid;grid-template-columns:1fr 1fr;column-gap:24px;}
  .head{row-gap:8px;font-size:13px;margin-bottom:18px;}
  .head .row{display:flex;}
  .lbl{font-weight:700;width:135px;}
  .blue{color:#1f4e9c;}
  .sec{font-weight:700;font-size:13px;margin-bottom:4px;text-decoration:underline;}
  table{border-collapse:collapse;width:100%;font-size:12px;}
  th{border:1px solid #b9c4d4;padding:5px 8px;background:#4472a4;color:#fff;text-align:left;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  td{border:1px solid #cbd5e1;padding:5px 8px;}
  th.r,td.r{text-align:right;}
  .b{font-weight:700;}
  .net{margin-top:14px;}
  .sign{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:72px;font-size:13px;}
  .line{border-top:1px solid #111;width:190px;margin-bottom:6px;}
  .rwrap{display:flex;justify-content:flex-end;}
  .rcol{width:190px;}
  /* Fixed footer repeats at the bottom of every printed page. */
  .foot{position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:space-between;padding:6px 32px;font-size:11px;font-weight:700;border-top:1px solid #d1d5db;background:#fff;}
  body{padding-bottom:48px;}
  @page{size:A4;margin:16mm;}
</style></head><body>
  <h1>Employee Payslip</h1>
  <div class="grid2 head">
    <div class="row"><span class="lbl">Employee Code :</span><span class="blue">${bcPayslip.employeeCode || ''}</span></div>
    <div class="row"><span class="lbl">Payroll Period :</span><span class="blue">${bcPayslip.payrollPeriod ?? ''}</span></div>
    <div class="row"><span class="lbl">Employee Name :</span><span class="blue">${bcPayslip.employeeName || ''}</span></div>
    <div class="row"><span class="lbl">From Date :</span><span>${fmtDate(fromDate)}</span></div>
    <div class="row"><span class="lbl">Job Title :</span><span class="blue">${bcPayslip.jobTitle || ''}</span></div>
    <div class="row"><span class="lbl">To Date :</span><span>${fmtDate(toDate)}</span></div>
  </div>
  <div class="grid2">
    <div>
      <div class="sec">Earnings Details :</div>
      <table><thead><tr><th>Pay Code Description</th><th class="r" style="width:110px">Amount</th></tr></thead>
      <tbody>${earnRows}<tr><td class="r b">Sub Total</td><td class="r b">${inr(payslip.gross)}</td></tr></tbody></table>
    </div>
    <div>
      <div class="sec">Deductions Details :</div>
      <table><thead><tr><th>Pay Code Description</th><th class="r" style="width:110px">Amount</th></tr></thead>
      <tbody>${dedRows}<tr><td class="r b">Sub Total</td><td class="r b">${inr(payslip.totalDeductions)}</td></tr></tbody></table>
    </div>
  </div>
  <table class="net"><tbody><tr><td class="r b">Net Salary</td><td class="r b" style="width:110px">${inr(payslip.net)}</td></tr></tbody></table>
  <div class="sign">
    <div><div class="line"></div><div class="b">Manager Signature</div><div class="b" style="margin-top:12px">Date</div></div>
    <div class="rwrap"><div class="rcol"><div class="line"></div><div class="b">Receiver Signature</div><div class="b" style="margin-top:12px">Date</div></div></div>
  </div>
  <div class="foot"><span>Print Date : ${printDate}</span><span>Page : 1 of 1</span></div>
</body></html>`;
    };

    const onExport = () => {
        if (!payslip) { setStatus('Click Preview first to load the payslip.'); return; }
        const w = window.open('', '_blank');
        if (!w) { setStatus('Allow pop-ups for this site to export the payslip PDF.'); return; }
        w.document.write(buildPayslipHtml());
        w.document.close();
        w.focus();
        // Let the new window render, then open the print dialog (Save as PDF).
        setTimeout(() => { w.print(); }, 350);
    };
    const onEmail = () => {
        if (!payslip) { setStatus('Click Preview first to load the payslip.'); return; }
        const to = user.email || '';
        const subject = encodeURIComponent(`Payslip ${periodText} — ${selectedEmployee?.employeeCode || ''}`);
        const body = encodeURIComponent(`Net Pay: ${money(payslip.net)}\nGross: ${money(payslip.gross)}\nDeductions: ${money(payslip.totalDeductions)}`);
        window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    };

    const filteredEmps = allEmployees.filter((e) => {
        const t = (filterSearch || '').toLowerCase();
        if (!t) return true;
        const fields = {
            'Employee': [e.employeeCode, e.firstName, e.lastName, e.user?.email].join(' '),
            'Department': e.department || '',
            'Designation': e.designation || ''
        };
        const haystack = (fields[filterField] || fields.Employee).toLowerCase();
        if (filterOp === 'Equals') return haystack === t;
        if (filterOp === 'Starts with') return haystack.startsWith(t);
        return haystack.includes(t);
    });

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName="Payslip" />
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">Payslip</div>
                        <div className="erp-titlebar-actions">
                            <button type="button" className="erp-action-btn" onClick={onPreview}>👁️ Preview</button>
                            <button type="button" className="erp-action-btn" onClick={onPrint}>🖨️ Print</button>
                            <button type="button" className="erp-action-btn" onClick={onExport}>📤 Export</button>
                            <button type="button" className="erp-action-btn" onClick={onEmail}>📧 EMail</button>
                            <button type="button" className="erp-action-btn" onClick={() => setShowFilter(true)}>🔎 Filter</button>
                        </div>
                    </div>

                    <div className="erp-body">
                        <div className="erp-form">
                            {status && <div className="error">{status}</div>}

                            <div className="erp-section">
                                <div className="erp-section-header">Filters</div>
                                <div className="erp-grid">
                                    <div className="erp-field">
                                        <label>Calendar Code</label>
                                        <select value={calendarCode} onChange={(e) => setCalendarCode(e.target.value)}>
                                            {calendars.length === 0 && <option value="">No calendars</option>}
                                            {calendars.map((c) => (
                                                <option key={c._id} value={c.calendarCode}>
                                                    {c.calendarCode}{c.description ? ` — ${c.description}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="erp-field">
                                        <label>Calendar Year</label>
                                        <input value={calendarYear} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Payroll Period</label>
                                        <select
                                            value={payrollPeriod}
                                            onChange={(e) => setPayrollPeriod(e.target.value)}
                                            disabled={periodsLoading || periods.length === 0}
                                        >
                                            {periodsLoading && <option value="">Loading periods…</option>}
                                            {!periodsLoading && periods.length === 0 && (
                                                <option value="">{periodsError || 'No periods for this calendar'}</option>
                                            )}
                                            {periods.map((p) => (
                                                <option key={p.periodNo} value={p.periodNo}>{periodLabel(p)}</option>
                                            ))}
                                        </select>
                                        {periodsError && <span className="error" style={{ fontSize: 11 }}>{periodsError}</span>}
                                    </div>
                                    <div className="erp-field">
                                        <label>Calendar Start Date</label>
                                        <input value={fmtDate(fromDate)} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Calendar End Date</label>
                                        <input value={fmtDate(toDate)} readOnly className="erp-readonly" />
                                    </div>
                                    <div className="erp-field">
                                        <label>Employee</label>
                                        <input value={filterEmp} readOnly placeholder="Click Filter to choose" className="erp-readonly" />
                                    </div>
                                </div>
                            </div>

                            {payslipLoading && (
                                <div className="erp-section"><p style={{ padding: 16 }}>Generating payslip from Business Central…</p></div>
                            )}

                            {showPreview && payslip && !payslipLoading && (
                                <div className="erp-section">
                                    <div className="erp-section-header">Payslip Preview — {periodText || '—'}</div>
                                    <div className="payslip-print" style={{ background: '#fff', padding: '32px 36px', border: '1px solid #e5e7eb', minHeight: 1000, display: 'flex', flexDirection: 'column', maxWidth: 900, margin: '0 auto' }}>
                                        {/* Print only this sheet — hide the app chrome (sidebar, filters, actions). */}
                                        <style>{`@media print {
                                            body * { visibility: hidden !important; }
                                            .payslip-print, .payslip-print * { visibility: visible !important; }
                                            .payslip-print { position: absolute; left: 0; top: 0; width: 100%; min-height: 0 !important; border: none !important; margin: 0 !important; }
                                            @page { size: A4; margin: 16mm; }
                                        }`}</style>
                                        <h2 style={{ textAlign: 'center', color: '#1f4e9c', margin: '4px 0 22px', fontSize: 22 }}>Employee Payslip</h2>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 8, columnGap: 24, fontSize: 13, marginBottom: 18 }}>
                                            <div style={{ display: 'flex' }}><span style={labelCell}>Employee Code :</span><span style={{ color: '#1f4e9c' }}>{bcPayslip.employeeCode || ''}</span></div>
                                            <div style={{ display: 'flex' }}><span style={labelCell}>Payroll Period :</span><span style={{ color: '#1f4e9c' }}>{bcPayslip.payrollPeriod ?? ''}</span></div>
                                            <div style={{ display: 'flex' }}><span style={labelCell}>Employee Name :</span><span style={{ color: '#1f4e9c' }}>{bcPayslip.employeeName || ''}</span></div>
                                            <div style={{ display: 'flex' }}><span style={labelCell}>From Date :</span><span>{fmtDate(fromDate)}</span></div>
                                            <div style={{ display: 'flex' }}><span style={labelCell}>Job Title :</span><span style={{ color: '#1f4e9c' }}>{bcPayslip.jobTitle || ''}</span></div>
                                            <div style={{ display: 'flex' }}><span style={labelCell}>To Date :</span><span>{fmtDate(toDate)}</span></div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, textDecoration: 'underline' }}>Earnings Details :</div>
                                                <table style={TBL}>
                                                    <thead><tr><th style={TH}>Pay Code Description</th><th style={{ ...TH, width: 110, textAlign: 'right' }}>Amount</th></tr></thead>
                                                    <tbody>
                                                        {payslip.earnings.map((e) => (
                                                            <tr key={e.label}><td style={TD}>{e.label}</td><td style={{ ...TD, textAlign: 'right' }}>{inr(e.amount)}</td></tr>
                                                        ))}
                                                        <tr><td style={{ ...TD, textAlign: 'right', fontWeight: 700 }}>Sub Total</td><td style={{ ...TD, textAlign: 'right', fontWeight: 700 }}>{inr(payslip.gross)}</td></tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, textDecoration: 'underline' }}>Deductions Details :</div>
                                                <table style={TBL}>
                                                    <thead><tr><th style={TH}>Pay Code Description</th><th style={{ ...TH, width: 110, textAlign: 'right' }}>Amount</th></tr></thead>
                                                    <tbody>
                                                        {payslip.deductions.map((d) => (
                                                            <tr key={d.label}><td style={TD}>{d.label}</td><td style={{ ...TD, textAlign: 'right' }}>{inr(d.amount)}</td></tr>
                                                        ))}
                                                        <tr><td style={{ ...TD, textAlign: 'right', fontWeight: 700 }}>Sub Total</td><td style={{ ...TD, textAlign: 'right', fontWeight: 700 }}>{inr(payslip.totalDeductions)}</td></tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        <table style={{ ...TBL, marginTop: 14 }}>
                                            <tbody>
                                                <tr>
                                                    <td style={{ ...TD, textAlign: 'right', fontWeight: 700 }}>Net Salary</td>
                                                    <td style={{ ...TD, width: 110, textAlign: 'right', fontWeight: 700 }}>{inr(payslip.net)}</td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 72, fontSize: 13 }}>
                                            <div>
                                                <div style={{ borderTop: '1px solid #111', width: 190, marginBottom: 6 }} />
                                                <div style={{ fontWeight: 700 }}>Manager Signature</div>
                                                <div style={{ fontWeight: 700, marginTop: 12 }}>Date</div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <div style={{ width: 190 }}>
                                                    <div style={{ borderTop: '1px solid #111', marginBottom: 6 }} />
                                                    <div style={{ fontWeight: 700 }}>Receiver Signature</div>
                                                    <div style={{ fontWeight: 700, marginTop: 12 }}>Date</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer pinned to the bottom of the page sheet */}
                                        <div style={{ marginTop: 'auto', paddingTop: 24, display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
                                            <span>Print Date : {printDate}</span>
                                            <span>Page : 1 of 1</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <aside className="erp-actions-panel">
                            <div className="erp-actions-header"><span>Actions</span></div>
                            <ul className="erp-actions-list">
                                <li onClick={onPreview}>👁️ Preview</li>
                                <li onClick={onPrint}>🖨️ Print</li>
                                <li onClick={onExport}>📤 Export</li>
                                <li onClick={onEmail}>📧 EMail</li>
                                <li onClick={() => setShowFilter(true)}>🔎 Filter</li>
                            </ul>
                            <div className="erp-side-tabs">
                                <span>Actions</span><span>Info</span><span>Reports</span><span>Shortcut</span>
                            </div>
                        </aside>
                    </div>
                </div>

                {showFilter && (
                    <div className="erp-modal-backdrop" onClick={() => setShowFilter(false)}>
                        <div className="erp-modal emp-filter-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="erp-modal-header">
                                Employee Filter
                                <button className="erp-actions-close" onClick={() => setShowFilter(false)}>×</button>
                            </div>
                            <div className="erp-modal-body">
                                <div className="emp-filter-top">
                                    <div className="erp-field">
                                        <label>Select Cost Center</label>
                                        <select value={costCenter} onChange={(e) => setCostCenter(e.target.value)}>
                                            <option>Employee Master</option>
                                            <option>Department</option>
                                            <option>Project</option>
                                        </select>
                                    </div>
                                    <div className="erp-field">
                                        <label>Payment Mode</label>
                                        <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                                            <option>All</option>
                                            <option>Bank</option>
                                            <option>Cash</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="emp-filter-row">
                                    <select value={filterField} onChange={(e) => setFilterField(e.target.value)}>
                                        <option>Employee</option>
                                        <option>Department</option>
                                        <option>Designation</option>
                                    </select>
                                    <select value={filterOp} onChange={(e) => setFilterOp(e.target.value)}>
                                        <option>Contains</option>
                                        <option>Equals</option>
                                        <option>Starts with</option>
                                    </select>
                                    <select value={filterMatch} onChange={(e) => setFilterMatch(e.target.value)}>
                                        <option>Full Text</option>
                                        <option>Code</option>
                                        <option>Name</option>
                                    </select>
                                    <input
                                        value={filterSearch}
                                        onChange={(e) => setFilterSearch(e.target.value)}
                                        placeholder="Search..."
                                    />
                                    <button type="button" className="emp-filter-funnel" title="Apply filter">▽</button>
                                </div>

                                <div className="emp-filter-tree">
                                    <table className="erp-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: 160 }}>Code</th>
                                                <th style={{ width: 120 }}>ID Number</th>
                                                <th>Name</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="emp-tree-group" onClick={() => setEmployeeGroupOpen(!employeeGroupOpen)}>
                                                <td>
                                                    <span className="emp-tree-toggle">{employeeGroupOpen ? '−' : '+'}</span>
                                                    Employee
                                                </td>
                                                <td></td>
                                                <td>Employee</td>
                                            </tr>
                                            {employeeGroupOpen && filteredEmps.length === 0 && (
                                                <tr><td colSpan={3} style={{ padding: 16, color: '#888' }}>No matches.</td></tr>
                                            )}
                                            {employeeGroupOpen && filteredEmps.map((e) => (
                                                <tr key={e._id}
                                                    className={filterEmp === e.employeeCode ? 'erp-row-selected' : ''}
                                                    onClick={() => setFilterEmp(e.employeeCode)}
                                                    style={{ cursor: 'pointer' }}>
                                                    <td style={{ paddingLeft: 28 }}>{e.employeeCode}</td>
                                                    <td>{e.user?.empId || '—'}</td>
                                                    <td>{e.firstName} {e.lastName}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="erp-modal-footer emp-filter-footer">
                                <button type="button" className="emp-helpdesk-btn">📄 Help desk Service Ticket</button>
                                <button type="button" className="emp-helpdesk-btn emp-helpdesk-btn-dark">📄 Help desk Service Ticket</button>
                                <div style={{ flex: 1 }} />
                                <button className="btn" onClick={() => setShowFilter(false)}>OK</button>
                                <button className="erp-action-btn" onClick={() => { setFilterEmp(''); setShowFilter(false); }}>× Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Payslip;
