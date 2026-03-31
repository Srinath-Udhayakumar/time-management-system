import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingTimesheets, approveTimesheet } from '../api/timesheets';
import { useAuth } from '../context/useAuth';
import styles from './Dashboard.module.css';

export default function ManagerDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');

  const [actionState, setActionState] = useState({});

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      const { data } = await getPendingTimesheets();
      setTimesheets(data);
    } catch {
      setListError('Failed to load pending timesheets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  async function handleAction(id, status, remarks) {
    setActionState((prev) => ({ ...prev, [id]: { loading: true, error: '' } }));
    try {
      await approveTimesheet(id, {
        status,
        remarks,
        approverId: user.userId,
      });
      setTimesheets((prev) => prev.filter((ts) => ts.id !== id));
      setActionState((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      setActionState((prev) => ({
        ...prev,
        [id]: {
          loading: false,
          error: err.response?.data?.message || 'Action failed.',
        },
      }));
    }
  }

  function handleLogout() {
    signOut();
    navigate('/login');
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.appTitle}>Time Management System</h1>
        <div className={styles.userInfo}>
          <span>{user.email}</span>
          <span className={`${styles.roleBadge} ${styles.managerBadge}`}>Manager</span>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Pending Timesheets</h2>
            <button className={styles.refreshBtn} onClick={fetchPending} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>

          {listError && <p className={styles.error}>{listError}</p>}

          {!loading && timesheets.length === 0 && (
            <p className={styles.empty}>No pending timesheets.</p>
          )}

          {timesheets.length > 0 && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Project</th>
                    <th>Hours</th>
                    <th>Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timesheets.map((ts) => (
                    <TimesheetRow
                      key={ts.id}
                      ts={ts}
                      state={actionState[ts.id]}
                      onAction={handleAction}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function TimesheetRow({ ts, state, onAction }) {
  const [remarks, setRemarks] = useState('');
  const isLoading = state?.loading;

  return (
    <tr>
      <td>{ts.userName}</td>
      <td>{ts.date}</td>
      <td>{ts.projectName}</td>
      <td>{ts.hours}</td>
      <td>
        <input
          className={styles.remarksInput}
          type="text"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Optional remarks"
          disabled={isLoading}
        />
        {state?.error && <p className={styles.rowError}>{state.error}</p>}
      </td>
      <td className={styles.actionCell}>
        <button
          className={`${styles.actionBtn} ${styles.approveBtn}`}
          onClick={() => onAction(ts.id, 'APPROVED', remarks)}
          disabled={isLoading}
        >
          Approve
        </button>
        <button
          className={`${styles.actionBtn} ${styles.rejectBtn}`}
          onClick={() => onAction(ts.id, 'REJECTED', remarks)}
          disabled={isLoading}
        >
          Reject
        </button>
      </td>
    </tr>
  );
}
