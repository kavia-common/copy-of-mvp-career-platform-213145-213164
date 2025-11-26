import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PUBLIC_INTERFACE
 * Register page for new accounts. On success, redirects to login.
 */
export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setOk(false);
    setLoading(true);
    try {
      await register({ email, password, full_name: name });
      setOk(true);
      setTimeout(() => navigate('/login'), 800);
    } catch (err) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="container small">
        <h1>Create account</h1>
        <form onSubmit={handleSubmit} className="form" aria-describedby="register-error">
          <div className="form-group">
            <label htmlFor="reg-name">Name</label>
            <input id="reg-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="reg-email">Email</label>
            <input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <input id="reg-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && (
            <div id="register-error" className="error" role="alert" aria-live="assertive">
              {error}
            </div>
          )}
          {ok && <div className="success" role="status" aria-live="polite">Registration successful! Redirecting…</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating…' : 'Register'}
          </button>
        </form>
        <p className="muted">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
