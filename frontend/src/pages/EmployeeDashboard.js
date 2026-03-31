import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const STATUS_BADGE = {
  PENDING: 'badge-pending',
  APPROVED: 'badge-approved',
  REJECTED: 'badge-rejected',
};

export default function EmployeeDashboard() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [timesheets, setTimesheets] = useState([]);
  const [form, setForm] = useState({ projectId: '', date: '', hours: '' });
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const fetchTimesheets = useCallback(async () => {
    setFetchError('');
    try {
      const { data } = await api.get(`/timesheets/my/${auth.userId}`);
      setTimesheets(data);
    } catch (err) {
      setFetchError('Failed to load timesheets.');
    }
  }, [auth.userId]);

  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setLoading(true);
    try {
      await api.post('/timesheets', {
        userId: Number(auth.userId),
        projectId: Number(form.projectId),
        date: form.date,
        hours: Number(form.hours),
      });
      setSubmitSuccess('Timesheet submitted successfully!');
      setForm({ projectId: '', date: '', hours: '' });
      fetchTimesheets();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit timesheet.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2>Employee Dashboard</h2>
        <div className="header-right">
          <span className="user-email">{auth.email}</span>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <section className="card">
        <h3>Submit Timesheet</h3>
        {submitError && <p className="error">{submitError}</p>}
        {submitSuccess && <p className="success">{submitSuccess}</p>}
        <form onSubmit={handleSubmit} className="inline-form">
          <div className="form-group">
            <label>Project ID</label>
            <input
              type="number"
              name="projectId"
              value={form.projectId}
              onChange={handleChange}
              required
              min="1"
              placeholder="Project ID"
            />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Hours</label>
            <input
              type="number"
              name="hours"
              value={form.hours}
              onChange={handleChange}
              required
              min="1"
              max="24"
              placeholder="1–24"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Submitting…' : 'Submit'}
          </button>
        </form>
      </section>

      <section className="card">
        <h3>My Timesheets</h3>
        {fetchError && <p className="error">{fetchError}</p>}
        {timesheets.length === 0 ? (
          <p className="empty-msg">No timesheets found.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Project</th>
                  <th>Date</th>
                  <th>Hours</th>
                  <th>Status</th>
                  <th>Approved By</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {timesheets.map((ts) => (
                  <tr key={ts.id}>
                    <td>{ts.id}</td>
                    <td>{ts.projectName}</td>
                    <td>{ts.date}</td>
                    <td>{ts.hours}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[ts.status]}`}>{ts.status}</span>
                    </td>
                    <td>{ts.approvedByName || '—'}</td>
                    <td>{ts.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
