/**
 * AuthOverlay.jsx — Login / Signup overlay component.
 * Handles authentication state transitions and error display.
 */
import { useState } from 'react';
import { authApi } from '../api/moneyApi';

/**
 * @param {Object} props
 * @param {Function} props.onAuthenticated - callback when login/signup succeeds
 */
export default function AuthOverlay({ onAuthenticated }) {
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    /** Toggle between login and signup mode */
    const toggleMode = (e) => {
        e.preventDefault();
        setIsSignup((prev) => !prev);
        setError('');
    };

    /** Handle form submission for login or signup */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (isSignup && password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            if (isSignup) {
                await authApi.signup(email, password);
                setError('');
                alert('Account created! Please check your email to verify.');
                setIsSignup(false);
            } else {
                await authApi.login(email, password);
                onAuthenticated();
            }
        } catch (err) {
            setError(err.message || 'Authentication failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-overlay">
            <div className="auth-card">
                {/* Brand */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        fontSize: '1.75rem', fontWeight: 700,
                        background: 'linear-gradient(135deg, #fff 0%, #818cf8 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                        marginBottom: '0.75rem',
                    }}>
                        <span style={{ WebkitTextFillColor: '#6366f1' }}>◈</span>
                        MoneyPro
                    </div>
                    <h2 style={{ fontSize: '1.4rem', marginBottom: '0.35rem' }}>
                        {isSignup ? 'Create Account' : 'Welcome back'}
                    </h2>
                    <p className="text-muted small">
                        {isSignup
                            ? 'Start your financial journey today'
                            : 'Sign in to manage your finances'}
                    </p>
                </div>

                {/* Error */}
                {error && <div className="auth-alert">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Email */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label className="auth-label">Email</label>
                        <input
                            id="authEmail"
                            type="email"
                            className="auth-input"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {/* Password */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label className="auth-label">Password</label>
                        <input
                            id="authPassword"
                            type="password"
                            className="auth-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {/* Confirm password (signup only) */}
                    {isSignup && (
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label className="auth-label">Confirm Password</label>
                            <input
                                id="authConfirmPassword"
                                type="password"
                                className="auth-input"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    )}

                    <button
                        id="authSubmitBtn"
                        type="submit"
                        className="btn-premium"
                        disabled={loading}
                        style={{ width: '100%', padding: '0.9rem', fontSize: '1.05rem', marginBottom: '1.25rem', justifyContent: 'center' }}
                    >
                        {loading ? 'Please wait…' : isSignup ? 'Sign Up' : 'Sign In'}
                    </button>

                    <p style={{ textAlign: 'center', fontSize: '0.88rem', color: '#64748b' }}>
                        {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <a
                            href="#"
                            onClick={toggleMode}
                            style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}
                        >
                            {isSignup ? 'Sign in' : 'Sign up'}
                        </a>
                    </p>
                </form>
            </div>
        </div>
    );
}
