import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';
import { getDepartments } from '../../api/departmentApi';
import { getDoctors } from '../../api/doctorApi';
import { getAllAppointments } from '../../api/appointmentApi';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ departments: 0, doctors: 0, appointments: 0, completed: 0 });
  const [recentAppts, setRecentAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDepartments(), getDoctors(), getAllAppointments()])
      .then(([d, doc, a]) => {
        setStats({
          departments: d.data.length,
          doctors: doc.data.length,
          appointments: a.data.length,
          completed: a.data.filter(x => x.status === 'COMPLETED').length,
        });
        setRecentAppts(a.data.slice(0, 6));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">Admin Overview</h1>
              <p className="page-subtitle">Hospital management at a glance</p>
            </div>
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-num">{stats.departments}</div>
                  <div className="stat-label">Departments</div>
                </div>
                <div className="stat-card">
                  <div className="stat-num">{stats.doctors}</div>
                  <div className="stat-label">Medical Staff</div>
                </div>
                <div className="stat-card">
                  <div className="stat-num">{stats.appointments}</div>
                  <div className="stat-label">All Appointments</div>
                </div>
                <div className="stat-card">
                  <div className="stat-num">{stats.completed}</div>
                  <div className="stat-label">Completed Visits</div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Recent Appointments</h2>
                </div>
                {recentAppts.length === 0 ? (
                  <div className="empty-state"><p>No appointments yet.</p></div>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead><tr><th>Patient</th><th>Doctor</th><th>Department</th><th>Date</th><th>Status</th></tr></thead>
                      <tbody>
                        {recentAppts.map(a => (
                          <tr key={a.id}>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.patientName}</td>
                            <td>Dr. {a.doctorName}</td>
                            <td>{a.departmentName}</td>
                            <td>{format(new Date(a.appointmentDate), 'dd MMM yyyy')}</td>
                            <td><StatusBadge status={a.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
