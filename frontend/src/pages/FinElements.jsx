import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { finElementApi } from '../services/api';

const FIN_TYPES = ['', 'Earning', 'Deduction', 'PaidLeave', 'OverTime', 'UnPaidLeave', 'EOS'];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB') : '';
const bool = (v) => v ? '✓' : '';

// Every field from the spec — order matches the user's table.
const ALL_COLUMNS = [
    { key: 'finId', header: 'FIN Id' },
    { key: 'description', header: 'Description' },
    { key: 'repetition', header: 'Repetition' },
    { key: 'finType', header: 'Fin Type' },
    { key: 'frequency', header: 'Frequency' },
    { key: 'isDisabled', header: 'Is Disabled', type: 'bool' },
    { key: 'restrictedWithGrade', header: 'Restricted With Grade', type: 'bool' },
    { key: 'postDirectlyToLedger', header: 'Post Directly To Ledger', type: 'bool' },
    { key: 'standardEquation', header: 'Standard Equation' },
    { key: 'maxInstAmountEquation', header: 'Max. Inst. Amount Equation' },
    { key: 'partialEquation', header: 'Partial Equation' },
    { key: 'publicHolidaysEquation', header: 'Public Holidays Equation' },
    { key: 'offDaysEquation', header: 'Off Days Equation' },
    { key: 'lateWorkingDaysEquation', header: 'Late Working Days Equation' },
    { key: 'leavePeriodBased', header: 'Leave Period Based' },
    { key: 'isEquation', header: 'Is Equation', type: 'bool' },
    { key: 'includeInGrossSalary', header: 'Include In Gross Salary', type: 'bool' },
    { key: 'elementOfPayslip', header: 'Element Of Payslip', type: 'bool' },
    { key: 'isExpense', header: 'Is Expense', type: 'bool' },
    { key: 'expenseSubLedger', header: 'Expense SubLedger' },
    { key: 'isLoan', header: 'Is Loan', type: 'bool' },
    { key: 'maximumInstallmentPeriod', header: 'Maximum Installment Period' },
    { key: 'isJobRelated', header: 'Is Job Related', type: 'bool' },
    { key: 'payrollCategory', header: 'Payroll Category' },
    { key: 'isFlightTicket', header: 'Is Flight Ticket', type: 'bool' },
    { key: 'isReimbursement', header: 'Is Reimbursement', type: 'bool' },
    { key: 'isChildRequired', header: 'Is Child Required', type: 'bool' },
    { key: 'description2', header: 'Description 2' },
    { key: 'transactionDescription', header: 'Transaction Description' },
    { key: 'relatedDeduction', header: 'Related Deduction' },
    { key: 'reimbursementCode', header: 'Reimbursement Code' },
    { key: 'deductionType', header: 'Deduction Type' },
    { key: 'socialSecurity', header: 'Social Security' },
    { key: 'postToEmployeeTransHist', header: 'Post to Employee Trans. Hist', type: 'bool' },
    { key: 'transactionDescription1', header: 'Transaction Description 1' },
    { key: 'transactionDescription2', header: 'Transaction Description 2' },
    { key: 'transactionDescription3', header: 'Transaction Description 3' },
    { key: 'fixedAmount', header: 'Fixed Amount' },
    { key: 'siWillBeAddedToBasic', header: 'SI Will Be Added to Basic', type: 'bool' },
    { key: 'maximumTotSSecuritySalary', header: 'Maximum Tot. SSecurity Salary' },
    { key: 'pensionCompanyContribution', header: 'Pension Company Contribution' },
    { key: 'esolDeductFullAmtInMOJ', header: 'ESOL Deduct Full Amt In MOJ', type: 'bool' },
    { key: 'esolDeductFullAmtInLastM', header: 'ESOL Deduct Full Amt In Last M', type: 'bool' },
    { key: 'esolCalculateOnProRata', header: 'ESOL Calculate On Pro Rata', type: 'bool' },
    { key: 'minimumOfServiceMonth', header: 'Minimum Of Service Month' },
    { key: 'hourlyLeave', header: 'Hourly Leave', type: 'bool' },
    { key: 'hourlyLeaveType', header: 'Hourly Leave Type' },
    { key: 'cashLeave', header: 'Cash Leave', type: 'bool' },
    { key: 'esolMaxDaysPerYear', header: 'ESOL Max Days Per Year' },
    { key: 'leavePeriodReference', header: 'Leave Period Reference' },
    { key: 'esolMaxConsecutiveDays', header: 'ESOL Max Consecutive Days' },
    { key: 'deductFromYearlyLeaveBal', header: 'Deduct From Yearly Leave Bal.', type: 'bool' },
    { key: 'parentLeaveBalance', header: 'Parent Leave Balance' },
    { key: 'permitPaidMoreActual', header: 'Permit Paid More Actual', type: 'bool' },
    { key: 'stopSalaryIfNotReturn', header: 'Stop Salary If Not Return', type: 'bool' },
    { key: 'stopSalaryInLeaveMonth', header: 'Stop Salary In Leave Month', type: 'bool' },
    { key: 'extendToEMthInNoReturn', header: 'Extend To EMth In No Return', type: 'bool' },
    { key: 'deductWeeklyVacation', header: 'Deduct Weekly Vacation', type: 'bool' },
    { key: 'officalHolidaysDeducted', header: 'Official Holidays Deducted', type: 'bool' },
    { key: 'deductRestDays', header: 'Deduct Rest Days', type: 'bool' },
    { key: 'deductFromPayroll', header: 'Deduct From Payroll', type: 'bool' },
    { key: 'prepraidSalary', header: 'Prepaid Salary', type: 'bool' },
    { key: 'completeVacationPayment', header: 'Complete Vacation Payment', type: 'bool' },
    { key: 'publicHolidayPaid', header: 'Public Holiday Paid', type: 'bool' },
    { key: 'annualLeaveGenerateUnPaid', header: 'Annual Leave Generate UnPaid', type: 'bool' },
    { key: 'leaveSalaryAsLoan', header: 'Leave Salary As Loan', type: 'bool' },
    { key: 'minLeaveDaysForLeaveSal', header: 'Min. Leave Days For Leave Sal.', type: 'bool' },
    { key: 'accumulatedYears', header: 'Accumulated Years' },
    { key: 'consumedFromAnnual', header: 'Consumed From Annual', type: 'bool' },
    { key: 'fixedDeductBalance', header: 'Fixed Deduct Balance', type: 'bool' },
    { key: 'fixedDaysDeducted', header: 'Fixed Days Deducted' },
    { key: 'allowToAffectBalByMinus', header: 'Allow To Affect Bal. By Minus', type: 'bool' },
    { key: 'publicAddedToBalance', header: 'Public Added To Balance', type: 'bool' },
    { key: 'offDaysAddedToBalance', header: 'Off Days Added To Balance', type: 'bool' },
    { key: 'restDayAddedToBalance', header: 'Rest Day Added To Balance', type: 'bool' },
    { key: 'excludeLastOffDays', header: 'Exclude Last Off Days', type: 'bool' },
    { key: 'validLeaveReturn', header: 'Valid Leave Return', type: 'bool' },
    { key: 'returnToBalance', header: 'Return To Balance', type: 'bool' },
    { key: 'unPaidLeaveId', header: 'UnPaidLeave ID' },
    { key: 'examLeave', header: 'Exam Leave', type: 'bool' },
    { key: 'leaveDaysPriorExam', header: 'Leave Days Prior Exam' },
    { key: 'includeExamDayInLeaveDays', header: 'Include Exam Day In Leave Days', type: 'bool' },
    { key: 'stopDaysAffectLeaveEq', header: 'Stop Days Affect Leave Eq.', type: 'bool' },
    { key: 'deductedFromExperience', header: 'Deducted From Experience', type: 'bool' },
    { key: 'daysToAffectExp', header: 'Days To Affect Exp' },
    { key: 'overideEosPerPeriod', header: 'Override EOS Per Period', type: 'bool' },
    { key: 'paidNoticePeriod', header: 'Paid Notice Period', type: 'bool' },
    { key: 'eosPartialCalculate', header: 'EOS Partial Calculate', type: 'bool' },
    { key: 'leaveCalcReference', header: 'Leave Calc Reference' },
    { key: 'payTransactionType', header: 'Pay Transaction Type' },
    { key: 'isBasicSalary', header: 'Is Basic Salary', type: 'bool' },
    { key: 'minimumOfServiceYear', header: 'Minimum Of Service Year' },
    { key: 'isSystemReserved', header: 'Is System Reserved', type: 'bool' },
    { key: 'unAuthorizedAbsense', header: 'UnAuthorized Absense', type: 'bool' },
    { key: 'leaveSalaryLoanCode', header: 'Leave Salary Loan Code' },
    { key: 'finIdShortName', header: 'FIN Id Short Name' },
    { key: 'availableOnESS', header: 'Available On ESS', type: 'bool' },
    { key: 'unPaidLeaveIdForEarly', header: 'UnPaidLeave ID For Early' },
    { key: 'usedInTaxCalc', header: 'Used In Tax Calc', type: 'bool' },
    { key: 'usedInSocialCalc', header: 'Used In Social Calc', type: 'bool' },
    { key: 'isTaxDeduction', header: 'Is Tax Deduction', type: 'bool' },
    { key: 'isSocialInsurance', header: 'Is Social Insurance', type: 'bool' },
    { key: 'isPerdiem', header: 'Is Perdiem', type: 'bool' },
    { key: 'isAttachmentRequired', header: 'Is Attachment Required', type: 'bool' },
    { key: 'isValidForEOSManualEntry', header: 'Is Valid For EOS Manual Entry', type: 'bool' },
    { key: 'includeInTaxSalaryCalc', header: 'Include In Tax Salary Calc', type: 'bool' },
    { key: 'excludeFromTaxSalaryCalc', header: 'Exclude From Tax Salary Calc', type: 'bool' },
    { key: 'taxCalculationAs', header: 'Tax Calculation As' },
    { key: 'eosPartialSlab', header: 'EOS Partial Slab', type: 'bool' },
    { key: 'bcSystemId', header: '$systemId' },
    { key: 'bcSystemCreatedAt', header: 'SystemCreatedAt', type: 'datetime' },
    { key: 'bcSystemCreatedBy', header: 'SystemCreatedBy' },
    { key: 'bcSystemModifiedAt', header: 'SystemModifiedAt', type: 'datetime' },
    { key: 'bcSystemModifiedBy', header: 'SystemModifiedBy' }
];

const renderValue = (col, row) => {
    const v = row[col.key];
    if (col.type === 'bool') return bool(v);
    if (col.type === 'date') return fmtDate(v);
    if (col.type === 'datetime') return fmtDateTime(v);
    if (v == null || v === '') return '';
    return v;
};

function FinElements() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filterType, setFilterType] = useState('');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);

    useEffect(() => { load(); }, [filterType]);

    const load = async () => {
        setLoading(true); setError('');
        try {
            const params = filterType ? { finType: filterType } : {};
            const { data } = await finElementApi.list(params);
            setItems(data.items || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load');
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const t = search.trim().toLowerCase();
        if (!t) return items;
        return items.filter((x) =>
            String(x.finId).includes(t) ||
            (x.description || '').toLowerCase().includes(t) ||
            (x.finIdShortName || '').toLowerCase().includes(t)
        );
    }, [items, search]);

    const onDelete = async (id) => {
        if (!confirm('Delete this FIN element? This cannot be undone.')) return;
        try {
            await finElementApi.remove(id);
            setSuccess('Deleted');
            setSelected(null);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    const onScanFromBC = async () => {
        setError(''); setSuccess('');
        setSuccess('Scan from BC started…');
        try {
            const { data } = await finElementApi.scanFromBc();
            await load();
            setSuccess(data.message || `Imported ${data.upserted} record(s) from BC.`);
            if (data.errors && data.errors.length > 0) {
                const lines = data.errors.map((e) => `finId=${e.finId}: ${e.reason}`).join(' | ');
                setError(`First errors: ${lines}`);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Scan failed');
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">FIN Elements <span style={{ fontSize: 12, color: '#6b7280' }}>▼</span></div>
                        <div className="erp-titlebar-actions">
                            <button className="erp-action-btn" onClick={onScanFromBC}>📡 Scan from BC</button>
                            <button className="erp-action-btn" onClick={() => selected && onDelete(selected._id)} disabled={!selected}>🗑️ Delete</button>
                        </div>
                    </div>

                    <div className="erp-body">
                        <div className="erp-list-card" style={{ width: '100%' }}>
                            {error && <div className="error">{error}</div>}
                            {success && <div className="success">{success}</div>}

                            <div style={{ display: 'flex', gap: 12, padding: 10, borderBottom: '1px solid #e5e7eb', alignItems: 'center' }}>
                                <label style={{ fontSize: 12, color: '#6b7280' }}>Fin Type:</label>
                                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 3 }}>
                                    {FIN_TYPES.map((t) => <option key={t} value={t}>{t || 'All'}</option>)}
                                </select>
                                <input
                                    placeholder="Search by ID, description, short name…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ flex: 1, padding: '4px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 3 }}
                                />
                                <span style={{ fontSize: 11, color: '#6b7280' }}>{filtered.length} records · {ALL_COLUMNS.length} columns</span>
                            </div>

                            {loading && <p style={{ padding: 16 }}>Loading…</p>}
                            <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <table className="erp-table fin-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 50, position: 'sticky', left: 0, background: '#eff6ff', zIndex: 2 }}>Select</th>
                                            {ALL_COLUMNS.map((c) => (
                                                <th key={c.key} title={c.header}>{c.header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {!loading && filtered.length === 0 && (
                                            <tr><td colSpan={ALL_COLUMNS.length + 1} style={{ padding: 20, color: '#888' }}>
                                                No FIN elements yet. Click <b>New</b> to add one.
                                            </td></tr>
                                        )}
                                        {filtered.map((it) => {
                                            const isSel = selected?._id === it._id;
                                            return (
                                                <tr key={it._id}
                                                    className={isSel ? 'erp-row-selected' : ''}
                                                    onClick={() => setSelected(it)}
                                                    onDoubleClick={() => navigate(`/fin-elements/${it._id}`)}>
                                                    <td style={{ position: 'sticky', left: 0, background: isSel ? '#fef3c7' : 'white', zIndex: 1 }}>
                                                        <input type="checkbox" checked={isSel} readOnly />
                                                    </td>
                                                    {ALL_COLUMNS.map((c) => (
                                                        <td key={c.key} title={String(it[c.key] ?? '')}>{renderValue(c, it)}</td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default FinElements;
