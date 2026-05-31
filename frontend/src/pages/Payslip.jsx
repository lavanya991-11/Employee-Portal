import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { authApi, employeeInfoApi } from '../services/api';

const monthOptions = (() => {
    const arr = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).replace(' ', '/');
        arr.push({ value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label });
    }
    return arr;
})();

const inr = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

function Payslip() {
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const [info, setInfo] = useState(null);
    const [allEmployees, setAllEmployees] = useState([]);

    const [payrollMonth, setPayrollMonth] = useState(monthOptions[0].value);
    const [layout, setLayout] = useState('FDM_Payslip');
    const [sortOn, setSortOn] = useState('EmpCode');

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

    useEffect(() => {
        authApi.me().then(({ data }) => setUser(data.user || data)).catch(() => {});
        employeeInfoApi.getMy().then(({ data }) => {
            setInfo(data.employeeInfo || null);
            if (data.employeeInfo?.employeeCode) setFilterEmp(data.employeeInfo.employeeCode);
        }).catch(() => {});
        employeeInfoApi.getAll().then(({ data }) => setAllEmployees(data.employees || [])).catch(() => {});
    }, []);

    const selectedEmployee = useMemo(() => {
        return allEmployees.find((e) => e.employeeCode === filterEmp)
            || (info && info.employeeCode === filterEmp ? info : info);
    }, [allEmployees, filterEmp, info]);

    // Mock payslip numbers (real values would come from a payroll backend / Business Central).
    const payslip = useMemo(() => {
        const basic = 8000;
        const hra = 3000;
        const transport = 1000;
        const other = 500;
        const gross = basic + hra + transport + other;
        const tax = Math.round(gross * 0.05);
        const insurance = 250;
        const pf = Math.round(basic * 0.12);
        const totalDeductions = tax + insurance + pf;
        const net = gross - totalDeductions;
        return {
            earnings: [
                { label: 'Basic', amount: basic },
                { label: 'HRA', amount: hra },
                { label: 'Transport Allowance', amount: transport },
                { label: 'Other Allowance', amount: other }
            ],
            deductions: [
                { label: 'Income Tax', amount: tax },
                { label: 'Insurance', amount: insurance },
                { label: 'Provident Fund', amount: pf }
            ],
            gross, totalDeductions, net
        };
    }, [payrollMonth, filterEmp]);

    const onPreview = () => {
        if (!selectedEmployee?.employeeCode) {
            setStatus('Select an employee via Filter first.');
            return;
        }
        setStatus('');
        setShowPreview(true);
    };
    const onPrint = () => { setShowPreview(true); setTimeout(() => window.print(), 250); };
    const onExport = () => {
        if (!showPreview) onPreview();
        const csv = [
            'Section,Item,Amount',
            ...payslip.earnings.map((e) => `Earnings,${e.label},${e.amount}`),
            ...payslip.deductions.map((d) => `Deductions,${d.label},${d.amount}`),
            `Totals,Gross,${payslip.gross}`,
            `Totals,Deductions,${payslip.totalDeductions}`,
            `Totals,Net Pay,${payslip.net}`
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `payslip-${selectedEmployee?.employeeCode || 'me'}-${payrollMonth}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };
    const onEmail = () => {
        const to = user.email || '';
        const subject = encodeURIComponent(`Payslip ${payrollMonth} — ${selectedEmployee?.employeeCode || ''}`);
        const body = encodeURIComponent(`Net Pay: ${inr(payslip.net)}\nGross: ${inr(payslip.gross)}\nDeductions: ${inr(payslip.totalDeductions)}`);
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
                                        <label>Payroll Month</label>
                                        <select value={payrollMonth} onChange={(e) => setPayrollMonth(e.target.value)}>
                                            {monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="erp-field">
                                        <label>Payslip Layout</label>
                                        <select value={layout} onChange={(e) => setLayout(e.target.value)}>
                                            <option>FDM_Payslip</option>
                                            <option>Standard</option>
                                            <option>Detailed</option>
                                        </select>
                                    </div>
                                    <div className="erp-field">
                                        <label>Sort On</label>
                                        <select value={sortOn} onChange={(e) => setSortOn(e.target.value)}>
                                            <option>EmpCode</option>
                                            <option>Name</option>
                                            <option>Department</option>
                                        </select>
                                    </div>
                                    <div className="erp-field">
                                        <label>Employee</label>
                                        <input value={filterEmp} readOnly placeholder="Click Filter to choose" className="erp-readonly" />
                                    </div>
                                </div>
                            </div>

                            {showPreview && selectedEmployee && (
                                <div className="erp-section">
                                    <div className="erp-section-header">Payslip Preview — {payrollMonth}</div>
                                    <div className="payslip-preview">
                                        <div className="payslip-header">
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedEmployee.firstName} {selectedEmployee.lastName}</div>
                                                <div style={{ color: '#6b7280', fontSize: 12 }}>
                                                    Code: {selectedEmployee.employeeCode} · {selectedEmployee.department || '—'} · {selectedEmployee.jobTitle || selectedEmployee.designation || '—'}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 12, color: '#6b7280' }}>Pay Period</div>
                                                <div style={{ fontWeight: 700 }}>{payrollMonth}</div>
                                            </div>
                                        </div>

                                        <div className="payslip-grid">
                                            <div className="payslip-col">
                                                <div className="payslip-col-title">Earnings</div>
                                                {payslip.earnings.map((e) => (
                                                    <div className="payslip-row" key={e.label}>
                                                        <span>{e.label}</span><span>{inr(e.amount)}</span>
                                                    </div>
                                                ))}
                                                <div className="payslip-row payslip-total">
                                                    <span>Gross</span><span>{inr(payslip.gross)}</span>
                                                </div>
                                            </div>
                                            <div className="payslip-col">
                                                <div className="payslip-col-title">Deductions</div>
                                                {payslip.deductions.map((d) => (
                                                    <div className="payslip-row" key={d.label}>
                                                        <span>{d.label}</span><span>{inr(d.amount)}</span>
                                                    </div>
                                                ))}
                                                <div className="payslip-row payslip-total">
                                                    <span>Total Deductions</span><span>{inr(payslip.totalDeductions)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="payslip-net">
                                            <span>Net Pay</span>
                                            <span>{inr(payslip.net)}</span>
                                        </div>
                                        <div style={{ marginTop: 10, fontSize: 11, color: '#9ca3af' }}>
                                            Sample numbers — real payroll figures come from your payroll system (e.g., Business Central).
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
