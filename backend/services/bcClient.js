// Lightweight Business Central client.
// Uses Azure AD client_credentials to fetch a token, caches it, and provides
// helpers to query BC OData endpoints.
//
// Required env vars (set in backend/.env locally and on Render):
//   BC_TENANT_ID
//   BC_CLIENT_ID
//   BC_CLIENT_SECRET
//   BC_SCOPE           (default: https://api.businesscentral.dynamics.com/.default)
//   BC_ENVIRONMENT     (e.g. Production, Sandbox, Delivery_App)
//   BC_COMPANY_ID      (BC company GUID)
//   BC_API_PATH        (custom AL API path, e.g. api/Novasoft/Novasoft/v2.0)
//   BC_PAYROLL_API_PATH (payroll AL API path, e.g. api/novasoft/novapay/v1.0)

const tokenCache = { value: null, expiresAt: 0 };

const bcConfigured = () =>
    process.env.BC_TENANT_ID &&
    process.env.BC_CLIENT_ID &&
    process.env.BC_CLIENT_SECRET &&
    process.env.BC_ENVIRONMENT &&
    process.env.BC_COMPANY_ID &&
    process.env.BC_API_PATH;

const getAccessToken = async () => {
    const now = Date.now();
    if (tokenCache.value && tokenCache.expiresAt > now + 60_000) {
        return tokenCache.value;
    }

    const tokenUrl = `https://login.microsoftonline.com/${process.env.BC_TENANT_ID}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
        client_id: process.env.BC_CLIENT_ID,
        client_secret: process.env.BC_CLIENT_SECRET,
        scope: process.env.BC_SCOPE || 'https://api.businesscentral.dynamics.com/.default',
        grant_type: 'client_credentials'
    });

    const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`BC token request failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    tokenCache.value = data.access_token;
    tokenCache.expiresAt = now + (Number(data.expires_in || 3600) * 1000);
    return tokenCache.value;
};

const baseCompanyUrl = () =>
    `https://api.businesscentral.dynamics.com/v2.0/${process.env.BC_TENANT_ID}` +
    `/${process.env.BC_ENVIRONMENT}/${process.env.BC_API_PATH}` +
    `/companies(${process.env.BC_COMPANY_ID})`;

const basePayrollCompanyUrl = () =>
    `https://api.businesscentral.dynamics.com/v2.0/${process.env.BC_TENANT_ID}` +
    `/${process.env.BC_ENVIRONMENT}/${process.env.BC_PAYROLL_API_PATH || 'api/novasoft/novapay/v1.0'}` +
    `/companies(${process.env.BC_COMPANY_ID})`;

// Environment root for ODataV4 web-service (codeunit/page) endpoints, e.g.
// {root}/ODataV4/NOVAPAYWebService_GetCalendars?company={companyId}
const odataV4Root = () =>
    `https://api.businesscentral.dynamics.com/v2.0/${process.env.BC_TENANT_ID}` +
    `/${process.env.BC_ENVIRONMENT}/ODataV4`;

const updateEmployee = async (systemId, payload) => {
    if (!bcConfigured()) throw new Error('BC not configured (set BC_* env vars).');
    if (!systemId) throw new Error('systemId is required.');

    const token = await getAccessToken();
    const url = `${baseCompanyUrl()}/employees(${systemId})`;

    const res = await fetch(url, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'If-Match': '*'
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`BC employee PATCH failed: ${res.status} ${text}`);
    }

    return res.json().catch(() => ({}));
};

const findEmployeeSystemId = async (employeeCode) => {
    if (!bcConfigured()) {
        throw new Error('BC not configured (set BC_* env vars).');
    }
    if (!employeeCode) {
        throw new Error('employeeCode is required.');
    }

    const token = await getAccessToken();
    const filter = encodeURIComponent(`employeeCode eq '${String(employeeCode).replace(/'/g, "''")}'`);
    const url = `${baseCompanyUrl()}/employees?$filter=${filter}`;

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`BC employees lookup failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    const rows = data.value || [];
    if (rows.length === 0) return null;
    return rows[0].systemId || rows[0].SystemId || null;
};

const getAllFinMasters = async () => {
    if (!bcConfigured()) throw new Error('BC not configured (set BC_* env vars).');

    const token = await getAccessToken();
    const url = `${baseCompanyUrl()}/finMasters`;

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`BC finMasters GET failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    return data.value || [];
};

const checkLeaveBalance = async (employeeCode, finId, asOfDate) => {
    if (!bcConfigured()) throw new Error('BC not configured (set BC_* env vars).');
    if (!employeeCode) throw new Error('employeeCode is required.');
    if (finId == null) throw new Error('finId is required.');

    const token = await getAccessToken();
    const safeCode = String(employeeCode).replace(/'/g, "''");
    const url = `${basePayrollCompanyUrl()}/employeeLeaveBalancesByPayCode('${safeCode}')/Microsoft.NAV.checkLeaveBalance`;

    const body = { finId: Number(finId), asOfDate: asOfDate || new Date().toISOString().slice(0, 10) };

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`BC checkLeaveBalance failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    // BC returns { value: "<stringified-json>" } — parse it.
    let parsed = data.value;
    if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch (e) { /* leave as-is */ }
    }
    return parsed;
};

const createEmployeeLeave = async ({ employeeNumber, payCode, leaveStartDate, leaveEndDate, payType, leaveReferenceNumber }) => {
    if (!bcConfigured()) throw new Error('BC not configured (set BC_* env vars).');
    if (!employeeNumber) throw new Error('employeeNumber is required.');
    if (payCode == null) throw new Error('payCode is required.');

    const token = await getAccessToken();
    const url = `${basePayrollCompanyUrl()}/employeeLeaves`;

    const body = {
        employeeNumber: String(employeeNumber),
        payCode: Number(payCode),
        leaveStartDate,
        leaveEndDate,
        payType,
        ...(leaveReferenceNumber ? { leaveReferenceNumber } : {})
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const text = await res.text();
        // Surface BC's own dialog message cleanly (drop the JSON wrapper, status
        // code and CorrelationId) so the user sees a normal, readable message.
        let msg = text;
        try { msg = JSON.parse(text)?.error?.message || text; } catch (e) { /* keep raw */ }
        msg = String(msg).replace(/\s*CorrelationId:\s*[0-9a-fA-F-]+\.?\s*$/, '').trim();
        const err = new Error(msg);
        err.bcMessage = msg;
        throw err;
    }

    return res.json().catch(() => ({}));
};

const getHolidays = async (year) => {
    if (!bcConfigured()) throw new Error('BC not configured (set BC_* env vars).');

    const token = await getAccessToken();
    const y = year || new Date().getFullYear();
    // BC `year` is Edm.Int32 — must be unquoted in the filter:  ?$filter=year eq 2026
    const filter = encodeURIComponent(`year eq ${Number(y)}`);
    const url = `${basePayrollCompanyUrl()}/publicHolidays?$filter=${filter}`;

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    });

    if (!res.ok) {
        const text = await res.text();
        const err = new Error(`BC publicHolidays failed: ${res.status} ${text}`);
        if (res.status === 404) err.bcNotFound = true;
        throw err;
    }

    const data = await res.json();
    return data.value || [];
};

// Returns every public holiday in BC (no year filter). Used to derive the
// distinct list of years available in BC so the ESS dropdown can stay in
// sync with whatever has actually been entered.
const getAllHolidays = async () => {
    if (!bcConfigured()) throw new Error('BC not configured (set BC_* env vars).');
    const token = await getAccessToken();
    const url = `${basePayrollCompanyUrl()}/publicHolidays`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    });
    if (!res.ok) {
        const text = await res.text();
        const err = new Error(`BC publicHolidays (all) failed: ${res.status} ${text}`);
        if (res.status === 404) err.bcNotFound = true;
        throw err;
    }
    const data = await res.json();
    return data.value || [];
};

// Fetch the calendar master from the NOVAPAY web service. The codeunit returns
// the rows as a stringified JSON array inside `value`, so we parse it before
// handing it back.
const getCalendars = async () => {
    if (!bcConfigured()) throw new Error('BC not configured (set BC_* env vars).');

    const token = await getAccessToken();
    const url = `${odataV4Root()}/NOVAPAYWebService_GetCalendars?company=${process.env.BC_COMPANY_ID}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: '{}'
    });

    if (!res.ok) {
        const text = await res.text();
        const err = new Error(`BC GetCalendars failed: ${res.status} ${text}`);
        if (res.status === 404) err.bcNotFound = true;
        throw err;
    }

    const data = await res.json();
    // BC returns { value: "<stringified-json-array>" } — parse it.
    let parsed = data.value;
    if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch (e) { parsed = []; }
    }
    return Array.isArray(parsed) ? parsed : [];
};

// Fetch the calendar periods from the NOVAPAY web service. The action takes an
// `inputJson` parameter and returns the rows as a stringified JSON array in
// `value`, so we parse it before handing it back.
const getCalendarPeriods = async ({ calendarCode = 'ALL', year = 0 } = {}) => {
    if (!bcConfigured()) throw new Error('BC not configured (set BC_* env vars).');

    const token = await getAccessToken();
    const url = `${odataV4Root()}/NOVAPAYWebService_GetCalendarPeriods?company=${process.env.BC_COMPANY_ID}`;
    const body = JSON.stringify({ inputJson: JSON.stringify({ calendarCode, year }) });

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body
    });

    if (!res.ok) {
        const text = await res.text();
        const err = new Error(`BC GetCalendarPeriods failed: ${res.status} ${text}`);
        if (res.status === 404) err.bcNotFound = true;
        throw err;
    }

    const data = await res.json();
    // BC returns { value: "<stringified-json-array>" } — parse it.
    let parsed = data.value;
    if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch (e) { parsed = []; }
    }
    return Array.isArray(parsed) ? parsed : [];
};

// Generate an employee payslip from the NOVAPAY web service. Takes an
// `inputJson` parameter and returns a single payslip object (with earning/
// deduction `lines`) as a stringified JSON in `value`.
const generatePayslip = async ({ calendarCode, year = 0, payrollPeriod, employeeCode } = {}) => {
    if (!bcConfigured()) throw new Error('BC not configured (set BC_* env vars).');

    const token = await getAccessToken();
    const url = `${odataV4Root()}/NOVAPAYWebService_GeneratePaySlip?company=${process.env.BC_COMPANY_ID}`;
    const body = JSON.stringify({
        inputJson: JSON.stringify({ calendarCode, year: Number(year) || 0, payrollPeriod: Number(payrollPeriod), employeeCode })
    });

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body
    });

    if (!res.ok) {
        const text = await res.text();
        // Surface BC's own dialog message (e.g. "Please provide an employee code.") if present.
        let msg = text;
        try { msg = JSON.parse(text)?.error?.message || text; } catch (e) { /* keep raw text */ }
        const err = new Error(`BC GeneratePaySlip failed: ${res.status} ${msg}`);
        err.bcMessage = msg;
        if (res.status === 404) err.bcNotFound = true;
        throw err;
    }

    const data = await res.json();
    // BC returns { value: "<stringified-json-object>" } — parse it.
    let parsed = data.value;
    if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch (e) { parsed = null; }
    }
    return parsed;
};

// Fetch loan products from the NOVAPAY web service. Returns the rows as a
// stringified JSON array inside `value`, so we parse it before returning.
const getLoanProducts = async () => {
    if (!bcConfigured()) throw new Error('BC not configured (set BC_* env vars).');

    const token = await getAccessToken();
    const url = `${odataV4Root()}/NOVAPAYWebService_GetLoanProducts?company=${process.env.BC_COMPANY_ID}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: '{}'
    });

    if (!res.ok) {
        const text = await res.text();
        const err = new Error(`BC GetLoanProducts failed: ${res.status} ${text}`);
        if (res.status === 404) err.bcNotFound = true;
        throw err;
    }

    const data = await res.json();
    let parsed = data.value;
    if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch (e) { parsed = []; }
    }
    return Array.isArray(parsed) ? parsed : [];
};

// Submit a loan request to the NOVAPAY web service. Returns { requestNo, status }
// (BC sends it as a stringified JSON object in `value`).
const submitLoanRequest = async ({ employeeCode, loanPayCode, loanAmount, installmentCalculation = 0, noOfInstallments, comments = '' } = {}) => {
    if (!bcConfigured()) throw new Error('BC not configured (set BC_* env vars).');

    const token = await getAccessToken();
    const url = `${odataV4Root()}/NOVAPAYWebService_SubmitLoanRequest?company=${process.env.BC_COMPANY_ID}`;
    const body = JSON.stringify({
        inputJson: JSON.stringify({
            employeeCode: String(employeeCode),
            loanPayCode: Number(loanPayCode),
            loanAmount: Number(loanAmount),
            installmentCalculation: Number(installmentCalculation) || 0,
            noOfInstallments: Number(noOfInstallments) || 0,
            comments: comments || ''
        })
    });

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body
    });

    if (!res.ok) {
        const text = await res.text();
        let msg = text;
        try { msg = JSON.parse(text)?.error?.message || text; } catch (e) { /* keep raw */ }
        const err = new Error(`BC SubmitLoanRequest failed: ${res.status} ${msg}`);
        err.bcMessage = msg;
        if (res.status === 404) err.bcNotFound = true;
        throw err;
    }

    const data = await res.json();
    let parsed = data.value;
    if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch (e) { parsed = null; }
    }
    return parsed;
};

// Submit a travel/earning request to the NOVAPAY web service via the
// SubmitEarningRequest unbound action. `lines` and `attachments` mirror the BC
// inputJson shape. BC returns { requestNo, status, totalAmount } as a
// stringified JSON object inside `value`.
const submitEarningRequest = async ({ employeeCode, comments = '', lines = [], attachments = [] } = {}) => {
    if (!bcConfigured()) throw new Error('BC not configured (set BC_* env vars).');

    const token = await getAccessToken();
    const url = `${odataV4Root()}/NOVAPAYWebService_SubmitEarningRequest?company=${process.env.BC_COMPANY_ID}`;
    const body = JSON.stringify({
        inputJson: JSON.stringify({
            employeeCode: String(employeeCode),
            comments: comments || '',
            lines: (lines || []).map((l) => ({
                earningPayCode: Number(l.earningPayCode),
                amount: Number(l.amount),
                unitCount: Number(l.unitCount) || 1,
                earningDate: l.earningDate
            })),
            attachments: (attachments || []).map((a) => ({
                fileName: a.fileName,
                mimeType: a.mimeType,
                contentBase64: a.contentBase64
            }))
        })
    });

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body
    });

    if (!res.ok) {
        const text = await res.text();
        let msg = text;
        try { msg = JSON.parse(text)?.error?.message || text; } catch (e) { /* keep raw */ }
        // Strip BC's technical "CorrelationId: <guid>" suffix so the user sees a clean message.
        msg = String(msg).replace(/\s*CorrelationId:\s*[0-9a-fA-F-]+\.?\s*$/, '').trim();
        const err = new Error(`BC SubmitEarningRequest failed: ${res.status} ${msg}`);
        err.bcMessage = msg;
        if (res.status === 404) err.bcNotFound = true;
        throw err;
    }

    const data = await res.json();
    let parsed = data.value;
    if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch (e) { parsed = null; }
    }
    return parsed;
};

// Fetch an employee's loan installments (amortization) from the NOVAPAY web
// service, filtered by employeeCode + transactionNo + finId. BC returns a
// stringified JSON object { ...summary, installments: [...] } in `value`.
const getEmployeeInstallments = async ({ employeeCode, transactionNo, finId } = {}) => {
    if (!bcConfigured()) throw new Error('BC not configured (set BC_* env vars).');

    const token = await getAccessToken();
    const url = `${odataV4Root()}/NOVAPAYWebService_GetEmployeeInstallments?company=${process.env.BC_COMPANY_ID}`;
    const body = JSON.stringify({
        inputJson: JSON.stringify({
            employeeCode: String(employeeCode),
            transactionNo: String(transactionNo),
            finId: Number(finId)
        })
    });

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body
    });

    if (!res.ok) {
        const text = await res.text();
        let msg = text;
        try { msg = JSON.parse(text)?.error?.message || text; } catch (e) { /* keep raw */ }
        const err = new Error(`BC GetEmployeeInstallments failed: ${res.status} ${msg}`);
        err.bcMessage = msg;
        if (res.status === 404) err.bcNotFound = true;
        throw err;
    }

    const data = await res.json();
    let parsed = data.value;
    if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch (e) { parsed = null; }
    }
    return parsed || {};
};

module.exports = { bcConfigured, getAccessToken, findEmployeeSystemId, updateEmployee, getAllFinMasters, checkLeaveBalance, createEmployeeLeave, getHolidays, getAllHolidays, getCalendars, getCalendarPeriods, generatePayslip, getLoanProducts, submitLoanRequest, submitEarningRequest, getEmployeeInstallments };
