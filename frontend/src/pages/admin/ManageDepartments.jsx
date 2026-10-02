import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Modal from '../../components/Modal';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../../api/departmentApi';
import toast from 'react-hot-toast';

const empty = { departmentName: '', departmentDescription: '' };

export default function ManageDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getDepartments().then(r => setDepartments(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(empty); setModal('create'); };
  const openEdit = (d) => { setForm({ departmentName: d.departmentName, departmentDescription: d.departmentDescription }); setModal(d); };

  const handleSave = async () => {
    if (!form.departmentName.trim()) { toast.error('Department name is required'); return; }
    setSaving(true);
    try {
      if (modal === 'create') {
        await createDepartment(form);
        toast.success('Department created');
      } else {
        await updateDepartment(modal.id, form);
        toast.success('Department updated');
      }
      setModal(null);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this department? All associated doctors and their appointments will also be deleted.')) return;
    try {
      await deleteDepartment(id);
      toast.success('Department deleted successfully');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete department');
    }
  };

  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <h1 className="page-title">Departments</h1>
            <button id="add-dept-btn" className="btn btn-primary" onClick={openCreate}>+ Add Department</button>
          </div>

          <div className="card">
            {loading ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>#</th><th>Name</th><th>Description</th><th>Actions</th></tr></thead>
                  <tbody>
                    {departments.map((d, i) => (
                      <tr key={d.id}>
                        <td style={{ color: 'var(--text-tertiary)', width: 40, fontFamily: 'var(--font-mono)' }}>{i + 1}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.departmentName}</td>
                        <td style={{ color: 'var(--text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.departmentDescription || '—'}</td>
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
          title={modal === 'create' ? 'Add Department' : 'Edit Department'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button id="save-dept-btn" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          }
        >
          <div className="form-grid" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Department Name *</label>
              <input className="form-input" placeholder="e.g. Cardiology" value={form.departmentName} onChange={e => setForm(p => ({ ...p, departmentName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" placeholder="Brief description..." value={form.departmentDescription} onChange={e => setForm(p => ({ ...p, departmentDescription: e.target.value }))} rows={3} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
