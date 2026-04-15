import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
    const { auth, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const displayName = auth?.role === 'admin'
        ? 'Admin'
        : auth?.flatName || auth?.flatId;

    return (
        <nav className="navbar">
            <div className="navbar-brand" onClick={() => navigate(auth?.role === 'admin' ? '/admin' : '/dashboard')}>
                <span className="navbar-icon">🏢</span>
                <span className="navbar-title">MyTower</span>
            </div>
            <div className="navbar-right">
                <span className="navbar-user">
                    <span className="navbar-user-icon">👤</span>
                    {displayName}
                </span>
                <button className="btn btn-logout" onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </nav>
    );
}
