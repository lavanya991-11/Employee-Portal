const mongoose = require('mongoose');

// Mirror of the BC "Calendar Period" data, refreshed by the Scan Calendar
// Periods action. BC may return repeated periodNo/year combinations, so this
// table has no unique key — every scan wipes and re-inserts the full set.
const calendarPeriodSchema = new mongoose.Schema({
    periodNo: { type: Number, default: 0 },
    month: { type: Number, default: 0 },
    year: { type: Number, default: 0, index: true },
    calendarStartDate: { type: Date },
    calendarEndDate: { type: Date },
    payPeriodStatus: { type: String, default: '' },
    isPosted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('CalendarPeriod', calendarPeriodSchema);
