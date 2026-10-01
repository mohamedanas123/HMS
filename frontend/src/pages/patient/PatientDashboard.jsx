import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';
import { getMyAppointments } from '../../api/appointmentApi';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { formatTime } from '../../utils/formatTime';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyAppointments()
      .then(r => setAppointments(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const upcoming = appointments.filter(a => ['PENDING', 'APPROVED'].includes(a.status));
  const completed = appointments.filter(a => a.status === 'COMPLETED').length;
  const cancelled = appointments.filter(a => a.status === 'CANCELLED').length;

  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">Hello, {user?.name?.split(' ')[0]}</h1>
              <p className="page-subtitle">Here's an overview of your health appointments</p>
            </div>
            <Link to="/patient/book" className="btn btn-primary">+ Book Appointment</Link>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-num">{upcoming.length}</div>
              <div className="stat-label">Upcoming</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{completed}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{cancelled}</div>
              <div className="stat-label">Cancelled</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{appointments.length}</div>
              <div className="stat-label">Total Visits</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Upcoming Appointments</h2>
              <Link to="/patient/appointments" className="btn btn-ghost btn-sm">View all</Link>
            </div>

            {loading ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : upcoming.length === 0 ? (
              <div className="empty-state">
                <p>No upcoming appointments. <Link to="/patient/book" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Book one now &rarr;</Link></p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Doctor</th><th>Department</th><th>Date</th><th>Time</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.slice(0, 5).map(a => (
                      <tr key={a.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Dr. {a.doctorName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{a.doctorSpecialization}</div>
                        </td>
                        <td>{a.departmentName}</td>
                        <td>{format(new Date(a.appointmentDate), 'dd MMM yyyy')}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{formatTime(a.startTime)} – {formatTime(a.endTime)}</td>
                        <td><StatusBadge status={a.status} /></td>
                      </tr>
                    ))}
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
