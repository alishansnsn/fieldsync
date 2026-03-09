import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight } from '@phosphor-icons/react';
import Logo from '../components/Logo';

const DEMO_CREDENTIALS = [
  { role: 'technician', email: 'technician@demo.com', label: 'Technician', desc: 'Alex Chen', color: 'var(--role-technician)' },
  { role: 'supervisor', email: 'supervisor@demo.com', label: 'Supervisor', desc: 'Sarah Williams', color: 'var(--role-supervisor)' },
  { role: 'admin', email: 'admin@demo.com', label: 'Admin', desc: 'Marcus Johnson', color: 'var(--role-admin)' },
];

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch {
      setError('Invalid credentials. Use password: demo123');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (cred: typeof DEMO_CREDENTIALS[0]) => {
    setSelectedRole(cred.role);
    setEmail(cred.email);
    setLoading(true);
    setError('');
    try {
      await login(cred.email, 'demo123');
    } catch {
      setError('Login failed');
      setSelectedRole(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container fade-in">
        {/* Brand */}
        <div className="login-brand">
          <div className="brand-mark">
            <Logo size={20} />
          </div>
          <div className="brand-text">
            <span className="brand-name">FieldSync</span>
          </div>
        </div>

        {/* Card */}
        <div className="login-card">
          <div className="login-header">
            <h2>Sign in</h2>
            <p>Select a demo role or enter credentials</p>
          </div>

          {/* Quick Demo */}
          <div className="quick-login">
            <div className="quick-login-label">Quick access</div>
            <div className="quick-login-grid">
              {DEMO_CREDENTIALS.map(cred => (
                <button
                  key={cred.role}
                  className={`quick-login-btn ${selectedRole === cred.role ? 'active' : ''}`}
                  onClick={() => quickLogin(cred)}
                  disabled={loading}
                >
                  <div className="ql-indicator" style={{ background: cred.color }} />
                  <div className="ql-content">
                    <span className="ql-role">{cred.label}</span>
                    <span className="ql-name">{cred.desc}</span>
                  </div>
                  <ArrowRight size={14} className="ql-arrow" />
                </button>
              ))}
            </div>
          </div>

          <div className="login-divider"><span>or</span></div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="demo123"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="login-error">{error}</div>}
            <button
              type="submit"
              className="btn btn-primary login-submit"
              disabled={loading}
            >
              {loading ? <div className="loading-spinner" style={{ width: 16, height: 16 }} /> : 'Sign in'}
            </button>
          </form>
        </div>

      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-base);
          padding: 24px;
        }
        .login-container {
          width: 100%;
          max-width: 380px;
        }
        .login-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
        }
        .brand-mark {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
        }
        .brand-text {
          display: flex;
          flex-direction: column;
        }
        .brand-name {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }
        .login-card {
          background: var(--bg-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 28px;
        }
        .login-header {
          margin-bottom: 24px;
        }
        .login-header h2 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 4px;
          letter-spacing: -0.02em;
        }
        .login-header p {
          font-size: 0.8125rem;
          color: var(--text-tertiary);
          margin: 0;
        }
        .quick-login-label {
          font-size: 0.6875rem;
          font-weight: 500;
          color: var(--text-tertiary);
          margin-bottom: 8px;
        }
        .quick-login-grid {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .quick-login-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          background: var(--bg-base);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
          text-align: left;
        }
        .quick-login-btn:hover {
          background: var(--bg-overlay);
          border-color: var(--border-default);
        }
        .quick-login-btn.active {
          border-color: var(--accent);
          background: var(--accent-subtle);
        }
        .quick-login-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .ql-indicator {
          width: 3px;
          height: 24px;
          border-radius: 2px;
          flex-shrink: 0;
        }
        .ql-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .ql-role {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .ql-name {
          font-size: 0.6875rem;
          color: var(--text-tertiary);
          margin-top: 1px;
        }
        .ql-arrow {
          color: var(--text-tertiary);
          opacity: 0;
          transition: opacity 0.15s;
        }
        .quick-login-btn:hover .ql-arrow {
          opacity: 1;
        }
        .login-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
          color: var(--text-tertiary);
          font-size: 0.75rem;
        }
        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border-subtle);
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .form-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .login-error {
          background: var(--danger-muted);
          border: 1px solid var(--danger-border);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          font-size: 0.8125rem;
          color: var(--danger);
        }
        .login-submit {
          width: 100%;
          justify-content: center;
          padding: 10px;
          margin-top: 2px;
          font-weight: 600;
        }
        @media (max-width: 640px) {
          .login-page {
            padding: 16px;
            align-items: flex-start;
            padding-top: 48px;
          }
          .login-card {
            padding: 20px;
          }
          .login-brand {
            margin-bottom: 24px;
          }
          .quick-login-btn {
            min-height: 48px;
            padding: 12px 12px;
          }
          .login-submit {
            min-height: 48px;
            font-size: 0.9375rem;
          }
        }
      `}</style>
    </div>
  );
}
