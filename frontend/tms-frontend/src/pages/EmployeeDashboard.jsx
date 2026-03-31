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

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function formatDisplayDate(date) {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Returns Mon–Fri Date objects for the week containing `today`. */
function getCurrentWeekDays(today) {
  const day = today.getDay(); // 0=Sun … 6=Sat
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export default function EmployeeDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const today = new Date();
  const todayISO = toISODate(today);
  const weekDays = getCurrentWeekDays(today);

  // ------ Submission state ------
  const [projectId, setProjectId] = useState('');
  const [weekHours, setWeekHours] = useState({}); // { dateISO: hourString }
  const [daySubmitting, setDaySubmitting] = useState({});
  const [dayMessages, setDayMessages] = useState({}); // { dateISO: {error, success} }

  // ------ History / filters ------
  const [timesheets, setTimesheets] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState('');
  const [filterMonth, setFilterMonth] = useState(today.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(today.getFullYear());
  const [filterStatus, setFilterStatus] = useState('');

  const fetchTimesheets = useCallback(async (params) => {
    setLoadingList(true);
    setListError('');
    try {
      const { data } = await getMyTimesheets(params);
      setTimesheets(data);
    } catch {
      setListError('Failed to load timesheets.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchTimesheets({ month: filterMonth, year: filterYear });
  }, [fetchTimesheets, filterMonth, filterYear]);

  // Map of date → timesheet for the current week
  const submittedDates = new Set(timesheets.map((ts) => ts.date));

  async function handleDaySubmit(dateISO) {
    const hours = Number(weekHours[dateISO]);
    if (!hours || hours < 1 || hours > 24) {
      setDayMessages((prev) => ({
        ...prev,
        [dateISO]: { error: 'Enter hours between 1 and 24.', success: '' },
      }));
      return;
    }
    if (!projectId) {
      setDayMessages((prev) => ({
        ...prev,
        [dateISO]: { error: 'Select a Project ID first.', success: '' },
      }));
      return;
    }

    setDaySubmitting((prev) => ({ ...prev, [dateISO]: true }));
    setDayMessages((prev) => ({ ...prev, [dateISO]: { error: '', success: '' } }));
    try {
      await submitTimesheet({
        projectId: Number(projectId),
        date: dateISO,
        hours,
      });
      setDayMessages((prev) => ({
        ...prev,
        [dateISO]: { error: '', success: 'Submitted!' },
      }));
      setWeekHours((prev) => ({ ...prev, [dateISO]: '' }));
      fetchTimesheets({ month: filterMonth, year: filterYear });
    } catch (err) {
      setDayMessages((prev) => ({
        ...prev,
        [dateISO]: {
          error: err.response?.data?.message || 'Submission failed.',
          success: '',
        },
      }));
    } finally {
      setDaySubmitting((prev) => ({ ...prev, [dateISO]: false }));
    }
  }

  function applyFilters(e) {
    e.preventDefault();
    const params = { month: filterMonth, year: filterYear };
    if (filterStatus) params.status = filterStatus;
    fetchTimesheets(params);
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

        {/* Today + Weekly Entry */}
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Submit Timesheet</h2>
            <span className={styles.todayLabel}>Today: {formatDisplayDate(today)}</span>
          </div>

          <div className={styles.projectRow}>
            <label className={styles.label}>
              Project ID
              <input
                className={styles.input}
                type="number"
                min="1"
                placeholder="e.g. 1"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              />
            </label>
          </div>

          <div className={styles.weekGrid}>
            {weekDays.map((day, i) => {
              const iso = toISODate(day);
              const isFuture = iso > todayISO;
              const isSubmitted = submittedDates.has(iso);
              const submittedTs = timesheets.find((ts) => ts.date === iso);
              const msg = dayMessages[iso] || {};

              return (
                <div
                  key={iso}
                  className={`${styles.dayCell} ${isFuture ? styles.dayCellDisabled : ''} ${isSubmitted ? styles.dayCellSubmitted : ''}`}
                >
                  <div className={styles.dayName}>{DAY_NAMES[i]}</div>
                  <div className={styles.dayDate}>
                    {day.getDate()}/{day.getMonth() + 1}
                  </div>

                  {isSubmitted ? (
                    <div className={styles.daySubmittedInfo}>
                      <div className={styles.dayHours}>{submittedTs.hours}h</div>
                      <span
                        className={styles.statusBadge}
                        style={{ background: STATUS_COLOR[submittedTs.status] }}
                      >
                        {submittedTs.status}
                      </span>
                    </div>
                  ) : isFuture ? (
                    <div className={styles.dayCellDisabledText}>—</div>
                  ) : (
                    <div className={styles.dayInputGroup}>
                      <input
                        className={styles.dayInput}
                        type="number"
                        min="1"
                        max="24"
                        placeholder="hrs"
                        value={weekHours[iso] || ''}
                        onChange={(e) =>
                          setWeekHours((prev) => ({ ...prev, [iso]: e.target.value }))
                        }
                        disabled={daySubmitting[iso]}
                      />
                      <button
                        className={styles.daySubmitBtn}
                        onClick={() => handleDaySubmit(iso)}
                        disabled={daySubmitting[iso]}
                      >
                        {daySubmitting[iso] ? '…' : '✓'}
                      </button>
                    </div>
                  )}

                  {msg.error && <p className={styles.dayCellError}>{msg.error}</p>}
                  {msg.success && <p className={styles.dayCellSuccess}>{msg.success}</p>}
                </div>
              );
            })}
          </div>
        </section>

        {/* History with Filters */}
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>My Timesheets</h2>
          </div>

          <form onSubmit={applyFilters} className={styles.filterBar}>
            <label className={styles.filterLabel}>
              Month
              <select
                className={styles.filterInput}
                value={filterMonth}
                onChange={(e) => setFilterMonth(Number(e.target.value))}
              >
                {MONTH_NAMES.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </label>
            <label className={styles.filterLabel}>
              Year
              <input
                className={styles.filterInput}
                type="number"
                value={filterYear}
                min="2020"
                max="2099"
                onChange={(e) => setFilterYear(Number(e.target.value))}
              />
            </label>
            <label className={styles.filterLabel}>
              Status
              <select
                className={styles.filterInput}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </label>
            <button className={styles.filterBtn} type="submit">
              Filter
            </button>
          </form>

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
                    <th>Approved By</th>
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
                      <td>{ts.approvedByName || '—'}</td>
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
