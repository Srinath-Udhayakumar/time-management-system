import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const STATUS_BADGE = {
  PENDING: 'badge-pending',
  APPROVED: 'badge-approved',
  REJECTED: 'badge-rejected',
};

export default function ManagerDashboard() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [fetchError, setFetchError] = useState('');
  const [actionState, setActionState] = useState({});

  const fetchPending = useCallback(async () => {
    setFetchError('');
    try {
      const { data } = await api.get('/timesheets/pending');
      setPending(data);
    } catch (err) {
      setFetchError('Failed to load pending timesheets.');
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  async function handleAction(id, status) {
    const remarks = actionState[id]?.remarks || '';
    try {
      await api.post(`/timesheets/${id}/approve`, {
        status,
        remarks,
        approverId: Number(auth.userId),
      });
      fetchPending();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${status.toLowerCase()} timesheet.`);
    }
  }

  function handleRemarksChange(id, value) {
    setActionState((prev) => ({ ...prev, [id]: { ...prev[id], remarks: value } }));
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2>Manager Dashboard</h2>
        <div className="header-right">
          <span className="user-email">{auth.email}</span>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <section className="card">
        <h3>Pending Timesheets</h3>
        {fetchError && <p className="error">{fetchError}</p>}
        {pending.length === 0 ? (
          <p className="empty-msg">No pending timesheets.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th>Project</th>
                  <th>Date</th>
                  <th>Hours</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((ts) => (
                  <tr key={ts.id}>
                    <td>{ts.id}</td>
                    <td>{ts.userName}</td>
                    <td>{ts.projectName}</td>
                    <td>{ts.date}</td>
                    <td>{ts.hours}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[ts.status]}`}>{ts.status}</span>
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Remarks (optional)"
                        value={actionState[ts.id]?.remarks || ''}
                        onChange={(e) => handleRemarksChange(ts.id, e.target.value)}
                        className="remarks-input"
                      />
                    </td>
                    <td className="action-btns">
                      <button
                        className="btn-approve"
                        onClick={() => handleAction(ts.id, 'APPROVED')}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => handleAction(ts.id, 'REJECTED')}
                      >
                        Reject
                      </button>
                    </td>
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
