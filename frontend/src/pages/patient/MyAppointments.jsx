import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { getMyAppointments, cancelAppointment } from '../../api/appointmentApi';
import { formatTime } from '../../utils/formatTime';
import toast from 'react-hot-toast';

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const load = () => {
    setLoading(true);
    getMyAppointments()
      .then(r => setAppointments(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'ALL' ? appointments : appointments.filter(a => a.status === filter);

  const handleCancel = async (id) => {
    setCancelling(true);
    try {
      await cancelAppointment(id);
      toast.success('Appointment cancelled');
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  const tabs = ['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED'];

  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <h1 className="page-title">My Appointments</h1>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
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

          <div className="card">
            {loading ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
              <div className="empty-state"><p>No {filter === 'ALL' ? '' : filter.toLowerCase()} appointments found.</p></div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Doctor</th><th>Department</th><th>Date</th><th>Time</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map(a => (
                      <tr key={a.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Dr. {a.doctorName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{a.doctorSpecialization}</div>
                        </td>
                        <td>{a.departmentName}</td>
                        <td>{format(new Date(a.appointmentDate), 'dd MMM yyyy')}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{formatTime(a.startTime)} – {formatTime(a.endTime)}</td>
                        <td><StatusBadge status={a.status} /></td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {a.status === 'COMPLETED' && a.prescriptionNotes && (
                              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(a)}>
                                Prescription
                              </button>
                            )}
                            {['PENDING', 'APPROVED'].includes(a.status) && (
                              <button className="btn btn-sm" style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: 'none' }} onClick={() => handleCancel(a.id)} disabled={cancelling}>
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prescription modal */}
      {selected && (
        <Modal title="Prescription Notes" onClose={() => setSelected(null)}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
            Dr. {selected.doctorName} · {format(new Date(selected.appointmentDate), 'dd MMM yyyy')}
          </div>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', lineHeight: 1.7, border: '1px solid var(--border-subtle)' }}>
            {selected.prescriptionNotes}
          </div>
        </Modal>
      )}
    </div>
  );
}
