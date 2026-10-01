import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';
import { getAllAppointments } from '../../api/appointmentApi';
import { getDepartments } from '../../api/departmentApi';
import { formatTime } from '../../utils/formatTime';

export default function AllAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      getAllAppointments().then(r => setAppointments(r.data)),
      getDepartments().then(r => setDepartments(r.data)).catch(() => {})
    ]).finally(() => setLoading(false));
  }, []);

  const filtered = appointments
    .filter(a => filter === 'ALL' || a.status === filter)
    .filter(a => !selectedDept || a.departmentName === selectedDept)
    .filter(a => !selectedDate || a.appointmentDate === selectedDate)
    .filter(a => !search || a.patientName?.toLowerCase().includes(search.toLowerCase()) || a.doctorName?.toLowerCase().includes(search.toLowerCase()));

  const tabs = ['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED'];
  const hasActiveFilters = selectedDept || selectedDate || search || filter !== 'ALL';

  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">All Appointments</h1>
              <p className="page-subtitle">View and filter complete hospital appointment records</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <input
              className="form-input"
              placeholder="Search patient or doctor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: 220 }}
            />

            {/* Department Filter */}
            <select
              className="form-select"
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              style={{ maxWidth: 200 }}
              aria-label="Filter by department"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.departmentName}>{d.departmentName}</option>
              ))}
            </select>

            {/* Date Filter */}
            <input
              className="form-input"
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ maxWidth: 170 }}
              title="Filter by appointment date"
              aria-label="Filter by date"
            />

            {/* Status Tabs */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {tabs.map(t => (
                <button
                  key={t}
                  className={`btn btn-sm ${filter === t ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setSelectedDept('');
                  setSelectedDate('');
                  setSearch('');
                  setFilter('ALL');
                }}
                style={{ color: 'var(--brand-primary)', fontWeight: 600 }}
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="card">
            {loading ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Department</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(a => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 500 }}>{a.patientName}</td>
                        <td>Dr. {a.doctorName}</td>
                        <td>
                          <span className="badge badge-approved" style={{ fontSize: '0.7rem' }}>
                            {a.departmentName}
                          </span>
                        </td>
                        <td>{format(new Date(a.appointmentDate), 'dd MMM yyyy')}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                          {formatTime(a.startTime)} – {formatTime(a.endTime)}
                        </td>
                        <td><StatusBadge status={a.status} /></td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                          No appointments match the selected filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
