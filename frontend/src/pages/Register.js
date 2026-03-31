import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    managerId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      };
      if (form.role === 'EMPLOYEE' && form.managerId) {
        payload.managerId = Number(form.managerId);
      }
      const { data } = await api.post('/auth/register', payload);
      login(data);
      navigate(data.role === 'MANAGER' ? '/manager' : '/employee', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Time Management System</h2>
        <h3>Create Account</h3>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Jane Doe"
          />
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="you@example.com"
          />
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="••••••••"
          />
          <label>Role</label>
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="EMPLOYEE">Employee</option>
            <option value="MANAGER">Manager</option>
          </select>
          {form.role === 'EMPLOYEE' && (
            <>
              <label>Manager ID (optional)</label>
              <input
                type="number"
                name="managerId"
                value={form.managerId}
                onChange={handleChange}
                placeholder="Enter your manager's user ID"
                min="1"
              />
            </>
          )}
          <button type="submit" disabled={loading}>
            {loading ? 'Registering…' : 'Register'}
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
