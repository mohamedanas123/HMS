import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Modal from '../../components/Modal';
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from '../../api/doctorApi';
import { getDepartments } from '../../api/departmentApi';
import { formatTime } from '../../utils/formatTime';
import { isValidPassword, PASSWORD_REQUIREMENT_MSG } from '../../utils/validation';
import toast from 'react-hot-toast';

const empty = { name: '', email: '', password: '', phoneNumber: '', departmentId: '', specialization: '', startTime: '09:00', endTime: '17:00', breakTime: '13:00', breakEndTime: '14:00' };

function initials(name = '') { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }

export default function ManageDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getDoctors(), getDepartments()])
      .then(([d, deps]) => { setDoctors(d.data); setDepartments(deps.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(empty); setModal('create'); };
  const openEdit = (d) => {
    setForm({
      name: d.name, email: d.email, password: '', phoneNumber: d.phoneNumber || '',
      departmentId: d.departmentId, specialization: d.specialization,
      startTime: d.startTime, endTime: d.endTime,
      breakTime: d.breakTime || '', breakEndTime: d.breakEndTime || '',
    });
    setModal(d);
  };

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleSave = async () => {
    if (!form.name || !form.email || !form.departmentId || !form.specialization) {
      toast.error('Please fill all required fields'); return;
    }
    if (modal === 'create' && !isValidPassword(form.password)) {
      toast.error(PASSWORD_REQUIREMENT_MSG);
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, departmentId: Number(form.departmentId) };
      if (modal === 'create') { await createDoctor(payload); toast.success('Doctor added'); }
      else { await updateDoctor(modal.id, payload); toast.success('Doctor updated'); }
      setModal(null);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this doctor and their user account?')) return;
    try { await deleteDoctor(id); toast.success('Deleted'); load(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <h1 className="page-title">Doctors</h1>
            <button id="add-doctor-btn" className="btn btn-primary" onClick={openCreate}>+ Add Doctor</button>
          </div>

          <div className="card">
            {loading ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Doctor</th><th>Department</th><th>Specialization</th><th>Working Hours</th><th>Actions</th></tr></thead>
                  <tbody>
                    {doctors.map(d => (
                      <tr key={d.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div className="user-avatar-pill" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>{initials(d.name)}</div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Dr. {d.name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{d.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>{d.departmentName}</td>
                        <td>{d.specialization}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          {formatTime(d.startTime)} – {formatTime(d.endTime)}
                          {d.breakTime && (
                            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                              Break: {formatTime(d.breakTime)} – {formatTime(d.breakEndTime)}
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(d)}>Edit</button>
                            <button className="btn btn-sm" style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: 'none' }} onClick={() => handleDelete(d.id)}>Delete</button>
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

      {modal && (
        <Modal
          title={modal === 'create' ? 'Add New Doctor' : `Edit — Dr. ${modal.name}`}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button id="save-doctor-btn" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Doctor'}
              </button>
            </>
          }
        >
          <div className="form-grid" style={{ gap: '1rem' }}>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="Dr. Jane Smith" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" placeholder="jane@hospital.com" value={form.email} onChange={e => set('email', e.target.value)} disabled={modal !== 'create'} />
              </div>
            </div>

            {modal === 'create' && (
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input className="form-input" type="password" placeholder="Min. 6 characters (letters and numbers)" value={form.password} onChange={e => set('password', e.target.value)} />
                <span className="form-hint">Must be at least 6 characters and contain both letters and numbers</span>
              </div>
            )}

            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Department *</label>
                <select className="form-select" value={form.departmentId} onChange={e => set('departmentId', e.target.value)}>
                  <option value="">Select department...</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.departmentName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Specialization *</label>
                <input className="form-input" placeholder="e.g. Interventional Cardiology" value={form.specialization} onChange={e => set('specialization', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" placeholder="+91 98765 43210" value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} />
            </div>

            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Shift Start *</label>
                <input className="form-input" type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Shift End *</label>
                <input className="form-input" type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} />
              </div>
            </div>

            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Break Start</label>
                <input className="form-input" type="time" value={form.breakTime} onChange={e => set('breakTime', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Break End</label>
                <input className="form-input" type="time" value={form.breakEndTime} onChange={e => set('breakEndTime', e.target.value)} />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
