import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ApplyLeave from './pages/ApplyLeave';
import MyLeaves from './pages/MyLeaves';
import Profile from './pages/Profile';
import MyInformation from './pages/MyInformation';
import EmployeeInformation from './pages/EmployeeInformation';
import Approvals from './pages/Approvals';
import ApplyLoan from './pages/ApplyLoan';
import ApplyRequest from './pages/ApplyRequest';
import Payslip from './pages/Payslip';
import Attendance from './pages/Attendance';
import OnDuty from './pages/OnDuty';
import Holidays from './pages/Holidays';
import TravelRequest from './pages/TravelRequest';
import TravelRequests from './pages/TravelRequests';
import TravelExpenses from './pages/TravelExpenses';
import NonTravelExpenses from './pages/NonTravelExpenses';
import ExpensesList from './pages/ExpensesList';
import OvertimeRequest from './pages/OvertimeRequest';
import FinElements from './pages/FinElements';
import FinElementForm from './pages/FinElementForm';
import IncomeTaxDeclarations from './pages/IncomeTaxDeclarations';
import IncomeTaxComputation from './pages/IncomeTaxComputation';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminCollection from './pages/AdminCollection';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/leaves/apply"
                element={
                    <ProtectedRoute>
                        <ApplyLeave />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/leaves/my"
                element={
                    <ProtectedRoute>
                        <MyLeaves />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/my-information"
                element={
                    <ProtectedRoute>
                        <MyInformation />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/employee-information"
                element={
                    <ProtectedRoute>
                        <EmployeeInformation />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/approvals"
                element={
                    <ProtectedRoute>
                        <Approvals />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/loans/apply"
                element={
                    <ProtectedRoute>
                        <ApplyLoan />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/assets/apply"
                element={
                    <ProtectedRoute>
                        <ApplyRequest />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/payslip"
                element={
                    <ProtectedRoute>
                        <Payslip />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/attendance"
                element={
                    <ProtectedRoute>
                        <Attendance />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/on-duty"
                element={
                    <ProtectedRoute>
                        <OnDuty />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/holidays"
                element={
                    <ProtectedRoute>
                        <Holidays />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/travels/apply"
                element={
                    <ProtectedRoute>
                        <TravelRequest />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/travels"
                element={
                    <ProtectedRoute>
                        <TravelRequests />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/expenses/travel"
                element={
                    <ProtectedRoute>
                        <ExpensesList />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/expenses/travel/new"
                element={
                    <ProtectedRoute>
                        <TravelExpenses />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/expenses/non-travel"
                element={
                    <ProtectedRoute>
                        <ExpensesList />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/expenses/non-travel/new"
                element={
                    <ProtectedRoute>
                        <NonTravelExpenses />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/overtimes/apply"
                element={
                    <ProtectedRoute>
                        <OvertimeRequest />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/fin-elements"
                element={
                    <ProtectedRoute>
                        <FinElements />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/fin-elements/new"
                element={
                    <ProtectedRoute>
                        <FinElementForm />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/fin-elements/:id"
                element={
                    <ProtectedRoute>
                        <FinElementForm />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/tax/declarations"
                element={
                    <ProtectedRoute>
                        <IncomeTaxDeclarations />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/tax/computation"
                element={
                    <ProtectedRoute>
                        <IncomeTaxComputation />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin"
                element={
                    <ProtectedRoute>
                        <SuperAdminDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/:collection"
                element={
                    <ProtectedRoute>
                        <AdminCollection />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}

export default App;
