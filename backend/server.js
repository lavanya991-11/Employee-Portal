const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const loanRoutes = require('./routes/loanRoutes');
const assetRoutes = require('./routes/assetRoutes');
const overtimeRoutes = require('./routes/overtimeRoutes');
const travelRoutes = require('./routes/travelRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const employeeInfoRoutes = require('./routes/employeeInfoRoutes');
const finElementRoutes = require('./routes/finElementRoutes');
const holidayRoutes = require('./routes/holidayRoutes');
const dataManagementRoutes = require('./routes/dataManagementRoutes');

connectDB();

const app = express();

app.use(express.json());
app.use(cors());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/overtimes', overtimeRoutes);
app.use('/api/travels', travelRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/employee-info', employeeInfoRoutes);
app.use('/api/fin-elements', finElementRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/data-management', dataManagementRoutes);

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'ESS Backend API Running Successfully',
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API Route Not Found',
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server Started on port ${PORT}`);
});
