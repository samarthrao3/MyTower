import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [auth, setAuth] = useState(() => {
        const stored = localStorage.getItem('mytower_auth');
        return stored ? JSON.parse(stored) : null;
    });

    useEffect(() => {
        if (auth) {
            localStorage.setItem('mytower_auth', JSON.stringify(auth));
        } else {
            localStorage.removeItem('mytower_auth');
        }
    }, [auth]);

    const login = (role, flatId = null, flatName = null) => {
        setAuth({ role, flatId, flatName });
    };

    const logout = () => {
        setAuth(null);
    };

    return (
        <AuthContext.Provider value={{ auth, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
