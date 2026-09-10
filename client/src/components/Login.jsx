import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, AlertTriangle } from 'lucide-react';

const API_URL = '/api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--warm-white)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        padding: 40,
        background: 'white',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 'var(--radius)',
            background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Lock size={28} color="var(--charcoal)" />
          </div>
          <h1 style={{ fontSize: 24, marginBottom: 6 }}>Contract & Estimate Parser</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Sign in to access your documents</p>
        </div>

        {error && (
          <div style={{
            padding: 12, borderRadius: 'var(--radius)', background: '#fff0f0',
            border: '1px solid #e0c0c0', display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 20, fontSize: 13, color: '#8a2d2d'
          }}>
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                style={{
                  width: '100%', padding: '10px 12px 10px 40px', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', fontSize: 14, background: 'white'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{
                  width: '100%', padding: '10px 40px 10px 40px', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', fontSize: 14, background: 'white'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            style={{
              padding: '12px', background: 'var(--charcoal)', color: 'white',
              border: 'none', borderRadius: 'var(--radius)', fontSize: 15, fontWeight: 600,
              cursor: loading || !username || !password ? 'not-allowed' : 'pointer',
              marginTop: 8, transition: 'background 0.2s'
            }}
            onMouseEnter={e => { if (!loading && username && password) e.currentTarget.style.background = '#333'; }}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--charcoal)'}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 20 }}>
          Default login: <strong>admin</strong> / <strong>changeme123</strong>
        </p>
      </div>
    </div>
  );
}
