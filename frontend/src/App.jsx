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
        </Routes>
    );
}

export default App;
