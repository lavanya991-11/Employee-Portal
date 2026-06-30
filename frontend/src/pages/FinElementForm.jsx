import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ActionButton from '../components/ActionButton';
import { finElementApi } from '../services/api';

const ENUMS = {
    repetition: ['OneTime', 'Periodic'],
    finType: ['Earning', 'Deduction', 'PaidLeave', 'OverTime', 'UnPaidLeave', 'EOS'],
    frequency: ['Monthly', 'Weekly', 'Quartely', 'Semiannual', 'Yearly', 'CalendarPeriods', 'Other'],
    leavePeriodBased: ['CalenderYear', 'EmployeeYear'],
    leavePeriodReference: ['Year', 'Month', 'Day'],
    hourlyLeaveType: ['Period', 'Day'],
    payrollCategory: ['Standard', 'NonStandard'],
    payTransactionType: ['None', 'PaidLeave', 'UnPaidLeave', 'OneTimeEarDedOT', 'MonthlyPayroll', 'EOS', 'LeaveProvision', 'OtherProvision', 'LeaveEncashment'],
    expenseSubLedger: ['Vendor', 'Ledger'],
    deductionType: ['Others', 'SocialSecurity', 'Penalty'],
    taxCalculationAs: ['', 'Yearly', 'Monthly']
};

const emptyForm = {
    finId: 0,
    description: '', description2: '', finIdShortName: '',
    repetition: 'OneTime', finType: 'Earning', frequency: 'Monthly',
    isDisabled: false, restrictedWithGrade: false, postDirectlyToLedger: false,
    availableOnESS: false, isSystemReserved: false,
    isEquation: false,
    standardEquation: '', maxInstAmountEquation: '', partialEquation: '',
    publicHolidaysEquation: '', offDaysEquation: '', lateWorkingDaysEquation: '',
    leavePeriodBased: 'CalenderYear', leavePeriodReference: 'Year',
    hourlyLeave: false, hourlyLeaveType: 'Period',
    cashLeave: false,
    esolMaxDaysPerYear: 0, esolMaxConsecutiveDays: 0,
    deductFromYearlyLeaveBal: false, parentLeaveBalance: 0,
    permitPaidMoreActual: false, stopSalaryIfNotReturn: false,
    stopSalaryInLeaveMonth: false, extendToEMthInNoReturn: false,
    deductWeeklyVacation: false, officalHolidaysDeducted: false,
    deductRestDays: false, deductFromPayroll: false,
    prepraidSalary: false, completeVacationPayment: false,
    publicHolidayPaid: false, annualLeaveGenerateUnPaid: false,
    leaveSalaryAsLoan: false, minLeaveDaysForLeaveSal: false,
    accumulatedYears: 0, consumedFromAnnual: false,
    fixedDeductBalance: false, fixedDaysDeducted: 0,
    allowToAffectBalByMinus: false,
    publicAddedToBalance: false, offDaysAddedToBalance: false, restDayAddedToBalance: false,
    excludeLastOffDays: false, validLeaveReturn: false, returnToBalance: false,
    unPaidLeaveId: 0, unPaidLeaveIdForEarly: 0,
    examLeave: false, leaveDaysPriorExam: 0, includeExamDayInLeaveDays: false,
    stopDaysAffectLeaveEq: false,
    deductedFromExperience: false, daysToAffectExp: 0,
    includeInGrossSalary: false, elementOfPayslip: false,
    payrollCategory: 'Standard', payTransactionType: 'None',
    isBasicSalary: false,
    isExpense: false, expenseSubLedger: 'Ledger',
    isReimbursement: false, reimbursementCode: 0,
    isFlightTicket: false, isChildRequired: false, isPerdiem: false,
    isAttachmentRequired: false, isJobRelated: false,
    isLoan: false, maximumInstallmentPeriod: 0, leaveSalaryLoanCode: 0,
    relatedDeduction: 0, deductionType: 'Others',
    socialSecurity: 0, fixedAmount: 0,
    siWillBeAddedToBasic: false, maximumTotSSecuritySalary: 0,
    pensionCompanyContribution: 0,
    esolDeductFullAmtInMOJ: false, esolDeductFullAmtInLastM: false,
    esolCalculateOnProRata: false, eosPartialCalculate: false,
    eosPartialSlab: false, overideEosPerPeriod: false,
    paidNoticePeriod: false,
    minimumOfServiceMonth: 0, minimumOfServiceYear: 0,
    usedInTaxCalc: false, usedInSocialCalc: false,
    isTaxDeduction: false, isSocialInsurance: false,
    includeInTaxSalaryCalc: false, excludeFromTaxSalaryCalc: false,
    taxCalculationAs: '',
    postToEmployeeTransHist: false,
    transactionDescription: '', transactionDescription1: '',
    transactionDescription2: '', transactionDescription3: '',
    leaveCalcReference: 0, unAuthorizedAbsense: false,
    isValidForEOSManualEntry: false
};

function Field({ label, name, value, onChange, type = 'text', options, readOnly = false, span }) {
    const cls = span === 2 ? 'erp-field erp-field-wide' : 'erp-field';
    if (type === 'checkbox') {
        return (
            <div className={cls}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', height: '100%' }}>
                    <input type="checkbox" name={name} checked={!!value} onChange={onChange} disabled={readOnly} />
                    <span>{label}</span>
                </label>
            </div>
        );
    }
    if (options) {
        return (
            <div className={cls}>
                <label>{label}</label>
                <select name={name} value={value ?? ''} onChange={onChange} disabled={readOnly}>
                    {options.map((o) => <option key={o} value={o}>{o || '(none)'}</option>)}
                </select>
            </div>
        );
    }
    return (
        <div className={cls}>
            <label>{label}</label>
            <input type={type} name={name} value={value ?? ''} onChange={onChange} readOnly={readOnly}
                step={type === 'number' ? 'any' : undefined} />
        </div>
    );
}

function Section({ title, children, open: openProp = true }) {
    const [open, setOpen] = useState(openProp);
    return (
        <div className="erp-section">
            <div className="erp-section-header" onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
                {open ? '▼' : '▶'} {title}
            </div>
            {open && <div className="erp-grid">{children}</div>}
        </div>
    );
}

function FinElementForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isNew = !id || id === 'new';

    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isNew) return;
        finElementApi.getOne(id).then(({ data }) => {
            setForm({ ...emptyForm, ...data.item });
        }).catch((err) => {
            setError(err.response?.data?.message || 'Failed to load');
        }).finally(() => setLoading(false));
    }, [id]);

    const onChange = (e) => {
        const { name, value, type, checked } = e.target;
        const next = type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : Number(value)) : value;
        setForm({ ...form, [name]: next });
        setError(''); setSuccess('');
    };

    const onSubmit = async (e) => {
        e?.preventDefault?.();
        setError(''); setSuccess(''); setSaving(true);
        try {
            if (isNew) {
                const { data } = await finElementApi.create(form);
                setSuccess(data.message || 'Created');
                setTimeout(() => navigate(`/fin-elements/${data.item._id}`), 800);
            } else {
                const { data } = await finElementApi.update(id, form);
                setSuccess(data.message || 'Updated');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="app-layout"><Sidebar /><main className="main-content"><p style={{ padding: 20 }}>Loading…</p></main></div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">
                            FIN Element <span className="erp-badge">{isNew ? 'New' : 'Edit'}</span>
                        </div>
                        <div className="erp-titlebar-actions">
                            <ActionButton kind="back" onClick={() => navigate('/fin-elements')}>Back</ActionButton>
                            <ActionButton kind="save" onClick={onSubmit} disabled={saving}>
                                {saving ? 'Saving…' : 'Save'}
                            </ActionButton>
                        </div>
                    </div>

                    <div className="erp-body">
                        <form className="erp-form" onSubmit={onSubmit}>
                            {error && <div className="error">{error}</div>}
                            {success && <div className="success">{success}</div>}

                            <Section title="Identity">
                                <Field label="FIN Id *" name="finId" value={form.finId} onChange={onChange} type="number" readOnly={!isNew} />
                                <Field label="Short Name (Code7)" name="finIdShortName" value={form.finIdShortName} onChange={onChange} />
                                <Field label="Description" name="description" value={form.description} onChange={onChange} span={2} />
                                <Field label="Description 2" name="description2" value={form.description2} onChange={onChange} span={2} />
                            </Section>

                            <Section title="Classification">
                                <Field label="Fin Type *" name="finType" value={form.finType} onChange={onChange} options={ENUMS.finType} />
                                <Field label="Repetition" name="repetition" value={form.repetition} onChange={onChange} options={ENUMS.repetition} />
                                <Field label="Frequency" name="frequency" value={form.frequency} onChange={onChange} options={ENUMS.frequency} />
                                <Field label="Payroll Category" name="payrollCategory" value={form.payrollCategory} onChange={onChange} options={ENUMS.payrollCategory} />
                                <Field label="Pay Transaction Type" name="payTransactionType" value={form.payTransactionType} onChange={onChange} options={ENUMS.payTransactionType} span={2} />
                            </Section>

                            <Section title="Flags">
                                <Field label="Is Disabled" name="isDisabled" value={form.isDisabled} onChange={onChange} type="checkbox" />
                                <Field label="Restricted With Grade" name="restrictedWithGrade" value={form.restrictedWithGrade} onChange={onChange} type="checkbox" />
                                <Field label="Post Directly To Ledger" name="postDirectlyToLedger" value={form.postDirectlyToLedger} onChange={onChange} type="checkbox" />
                                <Field label="Available On ESS" name="availableOnESS" value={form.availableOnESS} onChange={onChange} type="checkbox" />
                                <Field label="Is System Reserved" name="isSystemReserved" value={form.isSystemReserved} onChange={onChange} type="checkbox" />
                                <Field label="Is Basic Salary" name="isBasicSalary" value={form.isBasicSalary} onChange={onChange} type="checkbox" />
                                <Field label="Include In Gross Salary" name="includeInGrossSalary" value={form.includeInGrossSalary} onChange={onChange} type="checkbox" />
                                <Field label="Element Of Payslip" name="elementOfPayslip" value={form.elementOfPayslip} onChange={onChange} type="checkbox" />
                            </Section>

                            <Section title="Equations">
                                <Field label="Is Equation" name="isEquation" value={form.isEquation} onChange={onChange} type="checkbox" />
                                <div className="erp-field" />
                                <Field label="Standard Equation" name="standardEquation" value={form.standardEquation} onChange={onChange} span={2} />
                                <Field label="Max. Inst. Amount Equation" name="maxInstAmountEquation" value={form.maxInstAmountEquation} onChange={onChange} span={2} />
                                <Field label="Partial Equation" name="partialEquation" value={form.partialEquation} onChange={onChange} span={2} />
                                <Field label="Public Holidays Equation" name="publicHolidaysEquation" value={form.publicHolidaysEquation} onChange={onChange} span={2} />
                                <Field label="Off Days Equation" name="offDaysEquation" value={form.offDaysEquation} onChange={onChange} span={2} />
                                <Field label="Late Working Days Equation" name="lateWorkingDaysEquation" value={form.lateWorkingDaysEquation} onChange={onChange} span={2} />
                            </Section>

                            <Section title="Leave Configuration">
                                <Field label="Leave Period Based" name="leavePeriodBased" value={form.leavePeriodBased} onChange={onChange} options={ENUMS.leavePeriodBased} />
                                <Field label="Leave Period Reference" name="leavePeriodReference" value={form.leavePeriodReference} onChange={onChange} options={ENUMS.leavePeriodReference} />
                                <Field label="Hourly Leave" name="hourlyLeave" value={form.hourlyLeave} onChange={onChange} type="checkbox" />
                                <Field label="Hourly Leave Type" name="hourlyLeaveType" value={form.hourlyLeaveType} onChange={onChange} options={ENUMS.hourlyLeaveType} />
                                <Field label="Cash Leave" name="cashLeave" value={form.cashLeave} onChange={onChange} type="checkbox" />
                                <Field label="ESOL Max Days Per Year" name="esolMaxDaysPerYear" value={form.esolMaxDaysPerYear} onChange={onChange} type="number" />
                                <Field label="ESOL Max Consecutive Days" name="esolMaxConsecutiveDays" value={form.esolMaxConsecutiveDays} onChange={onChange} type="number" />
                                <Field label="Parent Leave Balance" name="parentLeaveBalance" value={form.parentLeaveBalance} onChange={onChange} type="number" />
                                <Field label="UnPaidLeave ID" name="unPaidLeaveId" value={form.unPaidLeaveId} onChange={onChange} type="number" />
                                <Field label="UnPaidLeave ID For Early" name="unPaidLeaveIdForEarly" value={form.unPaidLeaveIdForEarly} onChange={onChange} type="number" />
                                <Field label="Accumulated Years" name="accumulatedYears" value={form.accumulatedYears} onChange={onChange} type="number" />
                                <Field label="Fixed Days Deducted" name="fixedDaysDeducted" value={form.fixedDaysDeducted} onChange={onChange} type="number" />
                                <Field label="Leave Calc Reference" name="leaveCalcReference" value={form.leaveCalcReference} onChange={onChange} type="number" />
                            </Section>

                            <Section title="Leave Behaviour Flags">
                                <Field label="Deduct From Yearly Leave Bal." name="deductFromYearlyLeaveBal" value={form.deductFromYearlyLeaveBal} onChange={onChange} type="checkbox" />
                                <Field label="Permit Paid More Actual" name="permitPaidMoreActual" value={form.permitPaidMoreActual} onChange={onChange} type="checkbox" />
                                <Field label="Stop Salary If Not Return" name="stopSalaryIfNotReturn" value={form.stopSalaryIfNotReturn} onChange={onChange} type="checkbox" />
                                <Field label="Stop Salary In Leave Month" name="stopSalaryInLeaveMonth" value={form.stopSalaryInLeaveMonth} onChange={onChange} type="checkbox" />
                                <Field label="Extend To EMth In No Return" name="extendToEMthInNoReturn" value={form.extendToEMthInNoReturn} onChange={onChange} type="checkbox" />
                                <Field label="Deduct Weekly Vacation" name="deductWeeklyVacation" value={form.deductWeeklyVacation} onChange={onChange} type="checkbox" />
                                <Field label="Official Holidays Deducted" name="officalHolidaysDeducted" value={form.officalHolidaysDeducted} onChange={onChange} type="checkbox" />
                                <Field label="Deduct Rest Days" name="deductRestDays" value={form.deductRestDays} onChange={onChange} type="checkbox" />
                                <Field label="Deduct From Payroll" name="deductFromPayroll" value={form.deductFromPayroll} onChange={onChange} type="checkbox" />
                                <Field label="Prepaid Salary" name="prepraidSalary" value={form.prepraidSalary} onChange={onChange} type="checkbox" />
                                <Field label="Complete Vacation Payment" name="completeVacationPayment" value={form.completeVacationPayment} onChange={onChange} type="checkbox" />
                                <Field label="Public Holiday Paid" name="publicHolidayPaid" value={form.publicHolidayPaid} onChange={onChange} type="checkbox" />
                                <Field label="Annual Leave Generate UnPaid" name="annualLeaveGenerateUnPaid" value={form.annualLeaveGenerateUnPaid} onChange={onChange} type="checkbox" />
                                <Field label="Leave Salary As Loan" name="leaveSalaryAsLoan" value={form.leaveSalaryAsLoan} onChange={onChange} type="checkbox" />
                                <Field label="Min. Leave Days For Leave Sal." name="minLeaveDaysForLeaveSal" value={form.minLeaveDaysForLeaveSal} onChange={onChange} type="checkbox" />
                                <Field label="Consumed From Annual" name="consumedFromAnnual" value={form.consumedFromAnnual} onChange={onChange} type="checkbox" />
                                <Field label="Fixed Deduct Balance" name="fixedDeductBalance" value={form.fixedDeductBalance} onChange={onChange} type="checkbox" />
                                <Field label="Allow To Affect Bal. By Minus" name="allowToAffectBalByMinus" value={form.allowToAffectBalByMinus} onChange={onChange} type="checkbox" />
                                <Field label="Public Added To Balance" name="publicAddedToBalance" value={form.publicAddedToBalance} onChange={onChange} type="checkbox" />
                                <Field label="Off Days Added To Balance" name="offDaysAddedToBalance" value={form.offDaysAddedToBalance} onChange={onChange} type="checkbox" />
                                <Field label="Rest Day Added To Balance" name="restDayAddedToBalance" value={form.restDayAddedToBalance} onChange={onChange} type="checkbox" />
                                <Field label="Exclude Last Off Days" name="excludeLastOffDays" value={form.excludeLastOffDays} onChange={onChange} type="checkbox" />
                                <Field label="Valid Leave Return" name="validLeaveReturn" value={form.validLeaveReturn} onChange={onChange} type="checkbox" />
                                <Field label="Return To Balance" name="returnToBalance" value={form.returnToBalance} onChange={onChange} type="checkbox" />
                                <Field label="Stop Days Affect Leave Eq." name="stopDaysAffectLeaveEq" value={form.stopDaysAffectLeaveEq} onChange={onChange} type="checkbox" />
                                <Field label="UnAuthorized Absense" name="unAuthorizedAbsense" value={form.unAuthorizedAbsense} onChange={onChange} type="checkbox" />
                            </Section>

                            <Section title="Exam Leave">
                                <Field label="Exam Leave" name="examLeave" value={form.examLeave} onChange={onChange} type="checkbox" />
                                <Field label="Leave Days Prior Exam" name="leaveDaysPriorExam" value={form.leaveDaysPriorExam} onChange={onChange} type="number" />
                                <Field label="Include Exam Day In Leave Days" name="includeExamDayInLeaveDays" value={form.includeExamDayInLeaveDays} onChange={onChange} type="checkbox" />
                            </Section>

                            <Section title="Experience">
                                <Field label="Deducted From Experience" name="deductedFromExperience" value={form.deductedFromExperience} onChange={onChange} type="checkbox" />
                                <Field label="Days To Affect Exp" name="daysToAffectExp" value={form.daysToAffectExp} onChange={onChange} type="number" />
                            </Section>

                            <Section title="Expense / Reimbursement">
                                <Field label="Is Expense" name="isExpense" value={form.isExpense} onChange={onChange} type="checkbox" />
                                <Field label="Expense SubLedger" name="expenseSubLedger" value={form.expenseSubLedger} onChange={onChange} options={ENUMS.expenseSubLedger} />
                                <Field label="Is Reimbursement" name="isReimbursement" value={form.isReimbursement} onChange={onChange} type="checkbox" />
                                <Field label="Reimbursement Code" name="reimbursementCode" value={form.reimbursementCode} onChange={onChange} type="number" />
                                <Field label="Is Flight Ticket" name="isFlightTicket" value={form.isFlightTicket} onChange={onChange} type="checkbox" />
                                <Field label="Is Child Required" name="isChildRequired" value={form.isChildRequired} onChange={onChange} type="checkbox" />
                                <Field label="Is Perdiem" name="isPerdiem" value={form.isPerdiem} onChange={onChange} type="checkbox" />
                                <Field label="Is Attachment Required" name="isAttachmentRequired" value={form.isAttachmentRequired} onChange={onChange} type="checkbox" />
                                <Field label="Is Job Related" name="isJobRelated" value={form.isJobRelated} onChange={onChange} type="checkbox" />
                            </Section>

                            <Section title="Loan">
                                <Field label="Is Loan" name="isLoan" value={form.isLoan} onChange={onChange} type="checkbox" />
                                <Field label="Maximum Installment Period" name="maximumInstallmentPeriod" value={form.maximumInstallmentPeriod} onChange={onChange} type="number" />
                                <Field label="Leave Salary Loan Code" name="leaveSalaryLoanCode" value={form.leaveSalaryLoanCode} onChange={onChange} type="number" />
                            </Section>

                            <Section title="Deduction Details">
                                <Field label="Deduction Type" name="deductionType" value={form.deductionType} onChange={onChange} options={ENUMS.deductionType} />
                                <Field label="Related Deduction" name="relatedDeduction" value={form.relatedDeduction} onChange={onChange} type="number" />
                                <Field label="Social Security" name="socialSecurity" value={form.socialSecurity} onChange={onChange} type="number" />
                                <Field label="Fixed Amount" name="fixedAmount" value={form.fixedAmount} onChange={onChange} type="number" />
                                <Field label="SI Will Be Added To Basic" name="siWillBeAddedToBasic" value={form.siWillBeAddedToBasic} onChange={onChange} type="checkbox" />
                                <Field label="Max Tot. SSecurity Salary" name="maximumTotSSecuritySalary" value={form.maximumTotSSecuritySalary} onChange={onChange} type="number" />
                                <Field label="Pension Company Contribution" name="pensionCompanyContribution" value={form.pensionCompanyContribution} onChange={onChange} type="number" />
                            </Section>

                            <Section title="ESOL / EOS">
                                <Field label="ESOL Deduct Full Amt In MOJ" name="esolDeductFullAmtInMOJ" value={form.esolDeductFullAmtInMOJ} onChange={onChange} type="checkbox" />
                                <Field label="ESOL Deduct Full Amt In Last M" name="esolDeductFullAmtInLastM" value={form.esolDeductFullAmtInLastM} onChange={onChange} type="checkbox" />
                                <Field label="ESOL Calculate On Pro Rata" name="esolCalculateOnProRata" value={form.esolCalculateOnProRata} onChange={onChange} type="checkbox" />
                                <Field label="EOS Partial Calculate" name="eosPartialCalculate" value={form.eosPartialCalculate} onChange={onChange} type="checkbox" />
                                <Field label="EOS Partial Slab" name="eosPartialSlab" value={form.eosPartialSlab} onChange={onChange} type="checkbox" />
                                <Field label="Override EOS Per Period" name="overideEosPerPeriod" value={form.overideEosPerPeriod} onChange={onChange} type="checkbox" />
                                <Field label="Paid Notice Period" name="paidNoticePeriod" value={form.paidNoticePeriod} onChange={onChange} type="checkbox" />
                                <Field label="Minimum Of Service Month" name="minimumOfServiceMonth" value={form.minimumOfServiceMonth} onChange={onChange} type="number" />
                                <Field label="Minimum Of Service Year" name="minimumOfServiceYear" value={form.minimumOfServiceYear} onChange={onChange} type="number" />
                                <Field label="Is Valid For EOS Manual Entry" name="isValidForEOSManualEntry" value={form.isValidForEOSManualEntry} onChange={onChange} type="checkbox" />
                            </Section>

                            <Section title="Tax / Social Insurance">
                                <Field label="Used In Tax Calc" name="usedInTaxCalc" value={form.usedInTaxCalc} onChange={onChange} type="checkbox" />
                                <Field label="Used In Social Calc" name="usedInSocialCalc" value={form.usedInSocialCalc} onChange={onChange} type="checkbox" />
                                <Field label="Is Tax Deduction" name="isTaxDeduction" value={form.isTaxDeduction} onChange={onChange} type="checkbox" />
                                <Field label="Is Social Insurance" name="isSocialInsurance" value={form.isSocialInsurance} onChange={onChange} type="checkbox" />
                                <Field label="Include In Tax Salary Calc" name="includeInTaxSalaryCalc" value={form.includeInTaxSalaryCalc} onChange={onChange} type="checkbox" />
                                <Field label="Exclude From Tax Salary Calc" name="excludeFromTaxSalaryCalc" value={form.excludeFromTaxSalaryCalc} onChange={onChange} type="checkbox" />
                                <Field label="Tax Calculation As" name="taxCalculationAs" value={form.taxCalculationAs} onChange={onChange} options={ENUMS.taxCalculationAs} />
                            </Section>

                            <Section title="Transaction History">
                                <Field label="Post To Employee Trans. Hist" name="postToEmployeeTransHist" value={form.postToEmployeeTransHist} onChange={onChange} type="checkbox" />
                                <div className="erp-field" />
                                <Field label="Transaction Description" name="transactionDescription" value={form.transactionDescription} onChange={onChange} span={2} />
                                <Field label="Transaction Description 1" name="transactionDescription1" value={form.transactionDescription1} onChange={onChange} span={2} />
                                <Field label="Transaction Description 2" name="transactionDescription2" value={form.transactionDescription2} onChange={onChange} span={2} />
                                <Field label="Transaction Description 3" name="transactionDescription3" value={form.transactionDescription3} onChange={onChange} span={2} />
                            </Section>

                            {!isNew && (
                                <Section title="BC Sync (read-only)">
                                    <Field label="BC System Id" name="bcSystemId" value={form.bcSystemId || ''} onChange={onChange} readOnly span={2} />
                                    <Field label="BC Created At" name="bcSystemCreatedAt" value={form.bcSystemCreatedAt ? new Date(form.bcSystemCreatedAt).toLocaleString() : ''} onChange={onChange} readOnly />
                                    <Field label="BC Modified At" name="bcSystemModifiedAt" value={form.bcSystemModifiedAt ? new Date(form.bcSystemModifiedAt).toLocaleString() : ''} onChange={onChange} readOnly />
                                </Section>
                            )}
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default FinElementForm;
