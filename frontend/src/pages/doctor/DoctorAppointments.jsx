import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { getMyAppointments, approveAppointment, cancelAppointment, completeAppointment } from '../../api/appointmentApi';
import { formatTime } from '../../utils/formatTime';
import toast from 'react-hot-toast';

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [completing, setCompleting] = useState(null); // appointment being completed
  const [prescription, setPrescription] = useState('');
  const [working, setWorking] = useState(false);

  const load = () => {
    setLoading(true);
    getMyAppointments().then(r => setAppointments(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'ALL' ? appointments : appointments.filter(a => a.status === filter);

  const approve = async (id) => {
    setWorking(true);
    try { await approveAppointment(id); toast.success('Appointment approved'); load(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setWorking(false); }
  };

  const cancel = async (id) => {
    setWorking(true);
    try { await cancelAppointment(id); toast.success('Appointment cancelled'); load(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setWorking(false); }
  };

  const doComplete = async () => {
    setWorking(true);
    try {
      await completeAppointment(completing.id, prescription);
      toast.success('Appointment marked as completed');
      setCompleting(null);
      setPrescription('');
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setWorking(false); }
  };

  const tabs = ['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED'];

  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <h1 className="page-title">Manage Appointments</h1>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {tabs.map(t => (
              <button key={t} className={`btn btn-sm ${filter === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(t)}>{t}</button>
            ))}
          </div>

          <div className="card">
            {loading ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
              <div className="empty-state"><p>No appointments found.</p></div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Patient</th><th>Date</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filtered.map(a => (
                      <tr key={a.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.patientName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{a.patientEmail}</div>
                        </td>
                        <td>{format(new Date(a.appointmentDate), 'dd MMM yyyy')}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{formatTime(a.startTime)} – {formatTime(a.endTime)}</td>
                        <td><StatusBadge status={a.status} /></td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {a.status === 'PENDING' && (
                              <>
                                <button className="btn btn-sm" style={{ background: 'var(--success-light)', color: 'var(--success)', border: 'none' }} onClick={() => approve(a.id)} disabled={working}>
                                  Approve
                                </button>
                                <button className="btn btn-sm" style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: 'none' }} onClick={() => cancel(a.id)} disabled={working}>
                                  Decline
                                </button>
                              </>
                            )}
                            {a.status === 'APPROVED' && (
                              <button className="btn btn-primary btn-sm" onClick={() => { setCompleting(a); setPrescription(''); }}>
                                Complete
                              </button>
                            )}
                            {a.status === 'COMPLETED' && a.prescriptionNotes && (
                              <button className="btn btn-ghost btn-sm" onClick={() => setCompleting({ ...a, viewOnly: true })}>
                                View Prescription
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

      {completing && (
        <Modal
          title={completing.viewOnly ? 'Prescription Notes' : `Complete — ${completing.patientName}`}
          onClose={() => setCompleting(null)}
          footer={!completing.viewOnly && (
            <>
              <button className="btn btn-ghost" onClick={() => setCompleting(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={doComplete} disabled={working}>Mark Completed</button>
            </>
          )}
        >
          {completing.viewOnly ? (
            <div style={{ background: 'var(--bg-surface-elevated)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', lineHeight: 1.7, border: '1px solid var(--border-subtle)' }}>
              {completing.prescriptionNotes}
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Prescription Notes (optional)</label>
              <textarea className="form-textarea" placeholder="Enter prescription, diagnosis, or notes..." value={prescription} onChange={e => setPrescription(e.target.value)} rows={5} />
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
