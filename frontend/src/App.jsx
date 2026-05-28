import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ApplyLeave from './pages/ApplyLeave';
import MyLeaves from './pages/MyLeaves';
import Profile from './pages/Profile';
import MyInformation from './pages/MyInformation';
import EmployeeInformation from './pages/EmployeeInformation';
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
        </Routes>
    );
}

export default App;
