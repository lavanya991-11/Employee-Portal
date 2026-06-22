const mongoose = require('mongoose');

// Mirror of the BC "Calendar" master, refreshed by the Scan Calendars action.
// calendarCode is BC's unique key for a calendar.
const calendarSchema = new mongoose.Schema({
    calendarCode: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    calendarYear: { type: Number, default: 0 },
    payrollPeriod: { type: String, default: '' },
    workingDaysPerMonth: { type: Number, default: 0 },
    calendarType: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Calendar', calendarSchema);
