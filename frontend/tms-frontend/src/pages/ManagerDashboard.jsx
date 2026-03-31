import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getPendingTimesheets,
  approveTimesheet,
  getApprovedByManager,
  submitTimesheet,
  getMyTimesheets,
} from '../api/timesheets';
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

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(date) {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function getCurrentWeekDays(today) {
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export default function ManagerDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('approvals');

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
          <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className={styles.tabBar}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'approvals' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('approvals')}
        >
          Approvals
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'mytimesheet' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('mytimesheet')}
        >
          My Timesheet
        </button>
      </div>

      <main className={styles.main}>
        {activeTab === 'approvals' ? (
          <ApprovalsTab user={user} />
        ) : (
          <MyTimesheetTab />
        )}
      </main>
    </div>
  );
}

/* ─────────────────────────────────────── Approvals Tab ─── */

function ApprovalsTab({ user }) {
  const [pending, setPending] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [pendingError, setPendingError] = useState('');
  const [actionState, setActionState] = useState({});

  // Pending filters
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // History
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');

  // History all-timesheets filters
  const [histFilterEmployee, setHistFilterEmployee] = useState('');
  const [histFilterDate, setHistFilterDate] = useState('');
  const [histFilterStatus, setHistFilterStatus] = useState('');

  const fetchPending = useCallback(async (params = {}) => {
    setLoadingPending(true);
    setPendingError('');
    try {
      const { data } = await getPendingTimesheets(params);
      setPending(data);
    } catch {
      setPendingError('Failed to load pending timesheets.');
    } finally {
      setLoadingPending(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    setHistoryError('');
    try {
      const { data } = await getApprovedByManager(user.userId);
      setHistory(data);
    } catch {
      setHistoryError('Failed to load approval history.');
    } finally {
      setLoadingHistory(false);
    }
  }, [user.userId]);

  useEffect(() => {
    fetchPending();
    fetchHistory();
  }, [fetchPending, fetchHistory]);

  async function handleAction(id, status, remarks) {
    setActionState((prev) => ({ ...prev, [id]: { loading: true, error: '' } }));
    try {
      await approveTimesheet(id, { status, remarks });
      setPending((prev) => prev.filter((ts) => ts.id !== id));
      setActionState((prev) => { const n = { ...prev }; delete n[id]; return n; });
      fetchHistory();
    } catch (err) {
      setActionState((prev) => ({
        ...prev,
        [id]: { loading: false, error: err.response?.data?.message || 'Action failed.' },
      }));
    }
  }

  function applyPendingFilter(e) {
    e.preventDefault();
    const params = {};
    if (filterEmployee) params.employeeName = filterEmployee;
    if (filterDate) params.date = filterDate;
    fetchPending(params);
  }

  function applyHistoryFilter(e) {
    e.preventDefault();
    // filteredHistory is computed reactively from state; no re-fetch needed
  }

  // Apply client-side filter on history since getApprovedByManager doesn't take params
  const filteredHistory = history.filter((ts) => {
    const matchEmployee = !histFilterEmployee ||
      ts.userName.toLowerCase().includes(histFilterEmployee.toLowerCase());
    const matchDate = !histFilterDate || ts.date === histFilterDate;
    const matchStatus = !histFilterStatus || ts.status === histFilterStatus;
    return matchEmployee && matchDate && matchStatus;
  });

  return (
    <>
      {/* Pending approvals */}
      <section className={styles.card}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Pending Approvals</h2>
          <button
            className={styles.refreshBtn}
            onClick={() => fetchPending()}
            disabled={loadingPending}
          >
            {loadingPending ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        <form onSubmit={applyPendingFilter} className={styles.filterBar}>
          <label className={styles.filterLabel}>
            Employee Name
            <input
              className={styles.filterInput}
              type="text"
              placeholder="Search name…"
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
            />
          </label>
          <label className={styles.filterLabel}>
            Date
            <input
              className={styles.filterInput}
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </label>
          <button className={styles.filterBtn} type="submit">Filter</button>
          <button
            type="button"
            className={styles.filterBtn}
            style={{ background: '#6b7280' }}
            onClick={() => { setFilterEmployee(''); setFilterDate(''); fetchPending(); }}
          >
            Clear
          </button>
        </form>

        {pendingError && <p className={styles.error}>{pendingError}</p>}
        {!loadingPending && pending.length === 0 && (
          <p className={styles.empty}>No pending timesheets.</p>
        )}

        {pending.length > 0 && (
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
                {pending.map((ts) => (
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

      {/* Approval History */}
      <section className={styles.card}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Approval History</h2>
          <button
            className={styles.refreshBtn}
            onClick={fetchHistory}
            disabled={loadingHistory}
          >
            {loadingHistory ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        <form onSubmit={applyHistoryFilter} className={styles.filterBar}>
          <label className={styles.filterLabel}>
            Employee Name
            <input
              className={styles.filterInput}
              type="text"
              placeholder="Search name…"
              value={histFilterEmployee}
              onChange={(e) => setHistFilterEmployee(e.target.value)}
            />
          </label>
          <label className={styles.filterLabel}>
            Date
            <input
              className={styles.filterInput}
              type="date"
              value={histFilterDate}
              onChange={(e) => setHistFilterDate(e.target.value)}
            />
          </label>
          <label className={styles.filterLabel}>
            Status
            <select
              className={styles.filterInput}
              value={histFilterStatus}
              onChange={(e) => setHistFilterStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </label>
          <button className={styles.filterBtn} type="submit">Filter</button>
          <button
            type="button"
            className={styles.filterBtn}
            style={{ background: '#6b7280' }}
            onClick={() => { setHistFilterEmployee(''); setHistFilterDate(''); setHistFilterStatus(''); }}
          >
            Clear
          </button>
        </form>

        {historyError && <p className={styles.error}>{historyError}</p>}
        {!loadingHistory && filteredHistory.length === 0 && (
          <p className={styles.empty}>No approval history found.</p>
        )}

        {filteredHistory.length > 0 && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Project</th>
                  <th>Hours</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((ts) => (
                  <tr key={ts.id}>
                    <td>{ts.userName}</td>
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
    </>
  );
}

/* ─────────────────────────────────── My Timesheet Tab (Manager as Employee) ─── */

function MyTimesheetTab() {
  const today = new Date();
  const todayISO = toISODate(today);
  const weekDays = getCurrentWeekDays(today);

  const [projectId, setProjectId] = useState('');
  const [weekHours, setWeekHours] = useState({});
  const [daySubmitting, setDaySubmitting] = useState({});
  const [dayMessages, setDayMessages] = useState({});

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
      await submitTimesheet({ projectId: Number(projectId), date: dateISO, hours });
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

  return (
    <>
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
          <button className={styles.filterBtn} type="submit">Filter</button>
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
    </>
  );
}

/* ─────────────────────────────────────── Shared Row Component ─── */

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
