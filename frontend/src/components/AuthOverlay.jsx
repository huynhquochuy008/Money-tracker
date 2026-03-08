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
    const [mode, setMode] = useState('login'); // 'login', 'signup', 'recover'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [uid, setUid] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    /** Switch between modes */
    const switchMode = (newMode) => {
        setMode(newMode);
        setError('');
        setSuccess('');
    };

    /** Handle form submission for login, signup, or recovery */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (mode === 'signup' && password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            if (mode === 'signup') {
                await authApi.signup(email, password);
                setMode('login');
                setEmail(email);
                setPassword('');
                setSuccess('Account created! You can now sign in.');
            } else if (mode === 'recover') {
                await authApi.recover(uid, email, password);
                setMode('login');
                setSuccess('Account recovered! Please sign in with your new credentials.');
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
        <div className="auth-overlay animate-fade-in">
            <div id="authCard" className={`auth-card auth-glass animate-slide-up ${error ? 'shake' : ''}`}>
                {/* Brand */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        fontSize: '2rem', fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                        marginBottom: '0.75rem',
                        letterSpacing: '-0.02em'
                    }}>
                        <span style={{
                            color: '#6366f1',
                            fontSize: '2.5rem',
                            textShadow: '0 0 20px rgba(99, 102, 241, 0.3)'
                        }}>◈</span>
                        <span style={{
                            background: 'linear-gradient(135deg, #1e293b 0%, #64748b 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>MoneyPro</span>
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                        {mode === 'signup' ? 'Create Account' : mode === 'recover' ? 'Recover Account' : 'Welcome back'}
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>
                        {mode === 'signup'
                            ? 'Join thousands managing wealth better'
                            : mode === 'recover'
                                ? 'Reset credentials using your UID'
                                : 'Sign in to continue your progress'}
                    </p>
                </div>

                {/* Messages */}
                {error && <div className="auth-alert animate-fade-in">{error}</div>}
                {success && <div className="auth-alert animate-fade-in" style={{ borderColor: '#22c55e', color: '#15803d', background: 'rgba(34, 197, 94, 0.1)' }}>{success}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* UID (Recovery only) */}
                    {mode === 'recover' && (
                        <div className="animate-fade-in">
                            <label className="auth-label" htmlFor="authUid">Recovery UID</label>
                            <input
                                id="authUid"
                                type="text"
                                className="auth-input"
                                placeholder="247c4204-..."
                                value={uid}
                                onChange={(e) => setUid(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    {/* Email */}
                    <div>
                        <label className="auth-label" htmlFor="authEmail">
                            {mode === 'recover' ? 'New Email Address' : 'Email Address'}
                        </label>
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
                    <div>
                        <label className="auth-label" htmlFor="authPassword">
                            {mode === 'recover' ? 'New Password' : 'Password'}
                        </label>
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
                    {mode === 'signup' && (
                        <div className="animate-fade-in">
                            <label className="auth-label" htmlFor="authConfirmPassword">Confirm Password</label>
                            <input
                                id="authConfirmPassword"
                                type="password"
                                className="auth-input"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div style={{ marginTop: '0.5rem' }}>
                        <button
                            id="authSubmitBtn"
                            type="submit"
                            className="btn-premium"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                fontSize: '1.1rem',
                                justifyContent: 'center',
                                borderRadius: '16px'
                            }}
                        >
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}></span>
                                    Processing...
                                </span>
                            ) : mode === 'signup' ? 'Create Account' : mode === 'recover' ? 'Reset Credentials' : 'Sign In'}
                        </button>
                    </div>

                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                            {mode === 'signup' ? 'Already have an account?' : mode === 'recover' ? 'Remembered your details?' : "New to MoneyPro?"}{' '}
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); switchMode(mode === 'signup' || mode === 'recover' ? 'login' : 'signup'); }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#6366f1',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    padding: 0,
                                    fontSize: '0.9rem',
                                    marginLeft: '4px'
                                }}
                            >
                                {mode === 'signup' || mode === 'recover' ? 'Sign in' : 'Create one now'}
                            </button>
                        </p>

                        {mode === 'login' && (
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); switchMode('recover'); }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#64748b',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    padding: 0,
                                    fontSize: '0.85rem',
                                    textDecoration: 'underline'
                                }}
                            >
                                Forgot email or password? Recover with UID
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
