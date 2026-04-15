import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [flats, setFlats] = useState([]);
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedFlat, setSelectedFlat] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { auth, login } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        if (auth) {
            navigate(auth.role === 'admin' ? '/admin' : '/dashboard');
        }
    }, [auth, navigate]);

    // Load flats on mount
    useEffect(() => {
        async function loadFlats() {
            if (!supabase) return;
            const { data, error } = await supabase.rpc('get_flats_public');
            if (!error && data) {
                setFlats(data);
            }
        }
        loadFlats();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!supabase) {
                setError('Supabase is not configured. Please add your .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
                setLoading(false);
                return;
            }
            if (selectedRole === 'admin') {
                const { data, error } = await supabase.rpc('verify_admin_pin', { p_pin: pin });
                if (error) throw error;
                if (data) {
                    login('admin');
                    navigate('/admin');
                } else {
                    setError('Invalid admin PIN');
                }
            } else {
                if (!selectedFlat) {
                    setError('Please select your flat');
                    setLoading(false);
                    return;
                }
                const { data, error } = await supabase.rpc('verify_flat_pin', {
                    p_flat_id: selectedFlat,
                    p_pin: pin,
                });
                if (error) throw error;
                if (data) {
                    const flat = flats.find(f => f.flat_id === selectedFlat);
                    login('flat', selectedFlat, flat?.name || selectedFlat);
                    navigate('/dashboard');
                } else {
                    setError('Invalid PIN');
                }
            }
        } catch (err) {
            setError('Connection error. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <div className="login-icon">🏢</div>
                    <h1>MyTower</h1>
                    <p>Apartment Maintenance Portal</p>
                </div>

                {!supabase && (
                    <div className="setup-banner">
                        <span className="setup-banner-icon">⚙️</span>
                        <div>
                            <strong>Setup Required</strong>
                            <p>Create a Supabase project, add your credentials to a <code>.env</code> file, and run the SQL setup script. See <code>supabase_setup.sql</code> and <code>.env.example</code>.</p>
                        </div>
                    </div>
                )}

                <form className="login-form" onSubmit={handleSubmit}>
                    {error && <div className="form-error">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="role">Login As</label>
                        <select
                            id="role"
                            value={selectedRole}
                            onChange={(e) => {
                                setSelectedRole(e.target.value);
                                setError('');
                            }}
                            required
                        >
                            <option value="">— Select —</option>
                            <option value="admin">🔐 Admin</option>
                            <option value="flat">🏠 Flat Owner / Tenant</option>
                        </select>
                    </div>

                    {selectedRole === 'flat' && (
                        <div className="form-group">
                            <label htmlFor="flat">Select Flat</label>
                            <select
                                id="flat"
                                value={selectedFlat}
                                onChange={(e) => {
                                    setSelectedFlat(e.target.value);
                                    setError('');
                                }}
                                required
                            >
                                <option value="">— Select your flat —</option>
                                {flats.map(flat => (
                                    <option key={flat.flat_id} value={flat.flat_id}>
                                        {flat.name} — {flat.owner_name}
                                        {flat.tenant_name ? ` / ${flat.tenant_name}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {selectedRole && (
                        <div className="form-group">
                            <label htmlFor="pin">PIN</label>
                            <input
                                id="pin"
                                type="password"
                                placeholder="Enter your PIN"
                                value={pin}
                                onChange={(e) => {
                                    setPin(e.target.value);
                                    setError('');
                                }}
                                required
                                autoFocus
                            />
                        </div>
                    )}

                    {selectedRole && (
                        <button type="submit" className="btn btn-primary btn-login" disabled={loading}>
                            {loading ? 'Verifying...' : 'Login →'}
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
