import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitTimesheet, getMyTimesheets } from '../api/timesheets';
import { useAuth } from '../context/useAuth';
import styles from './Dashboard.module.css';

const STATUS_COLOR = {
  PENDING: '#f59e0b',
  APPROVED: '#10b981',
  REJECTED: '#ef4444',
};

export default function EmployeeDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [timesheets, setTimesheets] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState('');

  const [form, setForm] = useState({
    projectId: '',
    date: '',
    hours: '',
  });
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTimesheets = useCallback(async () => {
    setLoadingList(true);
    setListError('');
    try {
      const { data } = await getMyTimesheets(user.userId);
      setTimesheets(data);
    } catch {
      setListError('Failed to load timesheets.');
    } finally {
      setLoadingList(false);
    }
  }, [user.userId]);

  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setSubmitting(true);
    try {
      await submitTimesheet({
        userId: user.userId,
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
      setSubmitting(false);
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
          <span className={styles.roleBadge}>Employee</span>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Submit Timesheet */}
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Submit Timesheet</h2>

          {submitError && <p className={styles.error}>{submitError}</p>}
          {submitSuccess && <p className={styles.success}>{submitSuccess}</p>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <label className={styles.label}>
                Project ID
                <input
                  className={styles.input}
                  type="number"
                  name="projectId"
                  value={form.projectId}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="e.g. 1"
                />
              </label>
              <label className={styles.label}>
                Date
                <input
                  className={styles.input}
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className={styles.label}>
                Hours
                <input
                  className={styles.input}
                  type="number"
                  name="hours"
                  value={form.hours}
                  onChange={handleChange}
                  required
                  min="1"
                  max="24"
                  placeholder="1–24"
                />
              </label>
            </div>
            <button className={styles.btn} type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </form>
        </section>

        {/* My Timesheets */}
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>My Timesheets</h2>

          {loadingList && <p className={styles.info}>Loading…</p>}
          {listError && <p className={styles.error}>{listError}</p>}

          {!loadingList && timesheets.length === 0 && (
            <p className={styles.empty}>No timesheets found.</p>
          )}

          {timesheets.length > 0 && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Project</th>
                    <th>Hours</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {timesheets.map((ts) => (
                    <tr key={ts.id}>
                      <td>{ts.date}</td>
                      <td>{ts.projectName}</td>
                      <td>{ts.hours}</td>
                      <td>
                        <span
                          className={styles.statusBadge}
                          style={{ background: STATUS_COLOR[ts.status] }}
                        >
                          {ts.status}
                        </span>
                      </td>
                      <td>{ts.remarks || '—'}</td>
                    </tr>
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
