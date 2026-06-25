// Business Central returns request status as a one-letter code (e.g. "D") from
// SubmitEarningRequest / SubmitLoanRequest. Map the known codes to readable
// labels; fall back to whatever BC sent (already-readable strings pass through).
const STATUS_LABELS = { D: 'Pending Approval', P: 'Pending Approval', A: 'Approved', R: 'Rejected' };

export const statusLabel = (s) => {
    if (s == null || s === '') return '';
    const code = String(s).trim();
    return STATUS_LABELS[code.toUpperCase()] || code;
};

// Status text colour: Pending (Approval) = yellow, Approved = green, Rejected = red.
export const statusColor = (s) => {
    const v = statusLabel(s).toLowerCase();
    if (v.includes('reject')) return '#ef4444';
    if (v.includes('pending')) return '#f59e0b';
    if (v.includes('approv')) return '#22c55e';
    return undefined;
};
