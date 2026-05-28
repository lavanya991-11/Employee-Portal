// One-time migration: copy records from the old standalone `insurances`
// collection into each employee's EmployeeInfo.insuranceDetails sub-object.
//
// Run from the backend dir with:  node scripts/migrateInsuranceToEmployeeInfo.js
//
// Safe to re-run: it skips employees that already have insuranceDetails set,
// and does NOT delete the old collection (drop it manually once verified).

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const EmployeeInfo = require('../models/employeeInfo');

const FIELDS = [
    'insuranceType', 'insurancePolicyNumber', 'insuranceProvider',
    'coverageAmount', 'issueDate', 'expiryDate', 'insuranceStatus'
];

(async () => {
    await connectDB();

    const oldRecords = await mongoose.connection
        .collection('insurances')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

    console.log(`Found ${oldRecords.length} record(s) in the old 'insurances' collection.`);

    let migrated = 0;
    let skippedNoEmployee = 0;
    let skippedAlready = 0;
    const seenUsers = new Set();

    for (const rec of oldRecords) {
        const userId = String(rec.user);

        // Old model allowed multiple records per user; keep only the newest.
        if (seenUsers.has(userId)) continue;
        seenUsers.add(userId);

        const employee = await EmployeeInfo.findOne({ user: rec.user });
        if (!employee) {
            skippedNoEmployee++;
            continue;
        }

        if (employee.insuranceDetails && employee.insuranceDetails.insurancePolicyNumber) {
            skippedAlready++;
            continue;
        }

        const details = {};
        FIELDS.forEach((f) => {
            if (rec[f] !== undefined) details[f] = rec[f];
        });

        employee.insuranceDetails = details;
        await employee.save();
        migrated++;
    }

    console.log(`Migrated: ${migrated}`);
    console.log(`Skipped (no matching EmployeeInfo): ${skippedNoEmployee}`);
    console.log(`Skipped (insuranceDetails already set): ${skippedAlready}`);

    await mongoose.connection.close();
    console.log('Done. Old collection left intact — drop it manually once verified.');
    process.exit(0);
})().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
