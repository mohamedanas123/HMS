import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { getMyDoctorProfile, updateMyDoctorProfile } from '../../api/doctorApi';
import { getDepartments } from '../../api/departmentApi';
import { changePassword } from '../../api/userApi';
import { formatTime } from '../../utils/formatTime';
import { useAuth } from '../../context/AuthContext';
import { isValidPassword, PASSWORD_REQUIREMENT_MSG } from '../../utils/validation';
import toast from 'react-hot-toast';

function initials(name = '') {
  return name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || 'DR';
}

export default function DoctorProfile() {
  const { updateUserData } = useAuth();
  const [profile, setProfile] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Clinical Profile Form
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [breakTime, setBreakTime] = useState('13:00');
  const [breakEndTime, setBreakEndTime] = useState('14:00');
  const [savingProfile, setSavingProfile] = useState(false);

  // Security Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docRes, deptRes] = await Promise.all([
        getMyDoctorProfile(),
        getDepartments()
      ]);

      const doc = docRes.data;
      setProfile(doc);
      setDepartments(deptRes.data);

      setName(doc.name || '');
      setPhoneNumber(doc.phoneNumber || '');
      setDepartmentId(doc.departmentId || '');
      setSpecialization(doc.specialization || '');
      setStartTime(doc.startTime ? doc.startTime.slice(0, 5) : '09:00');
      setEndTime(doc.endTime ? doc.endTime.slice(0, 5) : '17:00');
      setBreakTime(doc.breakTime ? doc.breakTime.slice(0, 5) : '13:00');
      setBreakEndTime(doc.breakEndTime ? doc.breakEndTime.slice(0, 5) : '14:00');
    } catch (err) {
      toast.error('Failed to load doctor profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    if (startTime >= endTime) {
      toast.error('Start time must be before end time');
      return;
    }

    try {
      setSavingProfile(true);
      const res = await updateMyDoctorProfile({
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        departmentId: parseInt(departmentId, 10),
        specialization: specialization.trim(),
        startTime,
        endTime,
        breakTime: breakTime || null,
        breakEndTime: breakEndTime || null,
      });

      setProfile(res.data);
      updateUserData({ name: res.data.name, phoneNumber: res.data.phoneNumber });
      toast.success('Clinical profile and schedule updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update clinical profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter current password');
      return;
    }
    if (!isValidPassword(newPassword)) {
      toast.error(PASSWORD_REQUIREMENT_MSG);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setSavingPassword(true);
      await changePassword({ currentPassword, newPassword });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">Doctor Profile</h1>
              <p className="page-subtitle">Manage your clinical schedule, specialization, and credentials</p>
            </div>
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div>
              {/* Profile Header Hero */}
              <div className="card" style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div className="doctor-avatar" style={{ width: 68, height: 68, fontSize: '1.4rem', margin: 0, borderRadius: 'var(--radius-md)' }}>
                  {initials(name || profile?.name)}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Dr. {name || profile?.name}
                    </h2>
                    {profile?.departmentName && (
                      <span className="badge badge-completed">{profile?.departmentName}</span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {profile?.email} &bull; {specialization || profile?.specialization}
                  </p>
                </div>
              </div>

              {/* Settings Forms */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {/* Clinical Details */}
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Clinical & Personal Details</h2>
                  </div>
                  <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label className="form-label">Doctor Name</label>
                      <input
                        className="form-input"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Dr. Full Name"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        className="form-input"
                        type="email"
                        value={profile?.email || ''}
                        disabled
                        style={{ background: 'var(--bg-surface-elevated)', cursor: 'not-allowed', color: 'var(--text-secondary)' }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        className="form-input"
                        type="tel"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        placeholder="Contact Phone"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <select
                        className="form-select"
                        value={departmentId}
                        onChange={e => setDepartmentId(e.target.value)}
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.departmentName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Specialization</label>
                      <input
                        className="form-input"
                        type="text"
                        value={specialization}
                        onChange={e => setSpecialization(e.target.value)}
                        placeholder="e.g. Cardiologist, Orthopedic Surgeon"
                        required
                      />
                    </div>

                    {/* Schedule Hours */}
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                        Working Hours & Schedule
                      </div>

                      <div className="form-grid form-grid-2" style={{ marginBottom: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label">Shift Start ({formatTime(startTime)})</label>
                          <input
                            className="form-input"
                            type="time"
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Shift End ({formatTime(endTime)})</label>
                          <input
                            className="form-input"
                            type="time"
                            value={endTime}
                            onChange={e => setEndTime(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-grid form-grid-2">
                        <div className="form-group">
                          <label className="form-label">Break Start ({formatTime(breakTime)})</label>
                          <input
                            className="form-input"
                            type="time"
                            value={breakTime}
                            onChange={e => setBreakTime(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Break End ({formatTime(breakEndTime)})</label>
                          <input
                            className="form-input"
                            type="time"
                            value={breakEndTime}
                            onChange={e => setBreakEndTime(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={savingProfile}
                      style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                    >
                      {savingProfile ? 'Saving...' : 'Save Clinical Profile'}
                    </button>
                  </form>
                </div>

                {/* Change Password */}
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Security & Password</h2>
                  </div>
                  <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label className="form-label">Current Password</label>
                      <input
                        className="form-input"
                        type="password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">New Password</label>
                      <input
                        className="form-input"
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters (letters and numbers)"
                        required
                      />
                      <span className="form-hint">Must be at least 6 characters and contain both letters and numbers</span>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Confirm New Password</label>
                      <input
                        className="form-input"
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={savingPassword}
                      style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                    >
                      {savingPassword ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
