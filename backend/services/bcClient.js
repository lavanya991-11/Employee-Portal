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

module.exports = { bcConfigured, getAccessToken, findEmployeeSystemId, updateEmployee };
