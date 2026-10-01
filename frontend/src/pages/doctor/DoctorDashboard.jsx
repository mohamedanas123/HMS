import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';
import { getMyAppointments } from '../../api/appointmentApi';
import { formatTime } from '../../utils/formatTime';

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyAppointments()
      .then(r => setAppointments(r.data))
      .finally(() => setLoading(false));
  }, []);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayAppts = appointments.filter(a => a.appointmentDate === today && a.status !== 'CANCELLED');
  const pending = appointments.filter(a => a.status === 'PENDING').length;
  const approved = appointments.filter(a => a.status === 'APPROVED').length;
  const completed = appointments.filter(a => a.status === 'COMPLETED').length;

  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">Your Schedule</h1>
              <p className="page-subtitle">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-num">{pending}</div>
              <div className="stat-label">Pending Review</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{approved}</div>
              <div className="stat-label">Approved</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{completed}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{todayAppts.length}</div>
              <div className="stat-label">Today's Visits</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Today's Appointments</h2>
            </div>
            {loading ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : todayAppts.length === 0 ? (
              <div className="empty-state"><p>No appointments scheduled for today.</p></div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Patient</th><th>Time</th><th>Status</th></tr></thead>
                  <tbody>
                    {todayAppts.map(a => (
                      <tr key={a.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.patientName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{a.patientEmail}</div>
                        </td>
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
