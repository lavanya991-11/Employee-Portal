const { defineModel } = require('./_sql');
module.exports = defineModel({
    name: 'TravelRequest', table: 'TravelRequests',
    refs: { employee: { col: 'employeeId', ref: 'Users' } },
    children: {
        lines: {
            table: 'TravelRequestLines', fk: 'travelRequestId', orderCol: '[lineNo]',
            map: (it, n) => ({
                lineNo: n, earningPayCode: it.earningPayCode || 0, earningPayCodeDesc: it.earningPayCodeDesc || '',
                amount: it.amount || 0, unitCount: it.unitCount != null ? it.unitCount : 1, earningDate: it.earningDate || ''
            }),
            unmap: (r) => ({ earningPayCode: r.earningPayCode, earningPayCodeDesc: r.earningPayCodeDesc, amount: r.amount, unitCount: r.unitCount, earningDate: r.earningDate })
        },
        attachments: {
            table: 'TravelRequestAttachments', fk: 'travelRequestId', orderCol: 'id',
            map: (it) => ({ fileName: it.fileName || '', mimeType: it.mimeType || '' }),
            unmap: (r) => ({ fileName: r.fileName, mimeType: r.mimeType })
        }
    }
});
