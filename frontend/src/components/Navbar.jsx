import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

function Navbar() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch (err) {
            // ignore
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <Link to="/dashboard" className="logo">ESS Portal</Link>
            <div className="nav-links">
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/leaves/my">My Leaves</Link>
                <Link to="/profile">Hi, {user.name || 'User'}</Link>
                <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
            </div>
        </nav>
    );
}

export default Navbar;
