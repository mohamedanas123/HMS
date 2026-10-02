import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { getCurrentUserProfile, updateCurrentUserProfile, changePassword } from '../../api/userApi';
import { useAuth } from '../../context/AuthContext';
import { isValidPassword, PASSWORD_REQUIREMENT_MSG, isValidPhoneNumber, PHONE_REQUIREMENT_MSG } from '../../utils/validation';
import toast from 'react-hot-toast';

function initials(name = '') {
  return name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || 'P';
}

export default function PatientProfile() {
  const { user: authUser, updateUserData } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await getCurrentUserProfile();
      setProfile(res.data);
      setName(res.data.name || '');
      setPhoneNumber(res.data.phoneNumber || '');
    } catch (err) {
      toast.error('Failed to load profile data');
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
    const cleanedPhone = phoneNumber.replace(/\s+/g, '');
    if (cleanedPhone && !isValidPhoneNumber(cleanedPhone)) {
      toast.error(PHONE_REQUIREMENT_MSG);
      return;
    }

    try {
      setSavingProfile(true);
      const res = await updateCurrentUserProfile({ name: name.trim(), phoneNumber: cleanedPhone });
      setProfile(res.data);
      updateUserData({ name: res.data.name, phoneNumber: res.data.phoneNumber });
      toast.success('Profile details updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password');
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
      toast.error(err.response?.data?.message || 'Failed to change password');
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
              <h1 className="page-title">My Profile</h1>
              <p className="page-subtitle">Manage your personal account details and security settings</p>
            </div>
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div>
              <div className="card" style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div className="doctor-avatar" style={{ width: 68, height: 68, fontSize: '1.4rem', margin: 0, borderRadius: 'var(--radius-md)' }}>
                  {initials(name || profile?.name)}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>{name || profile?.name}</h2>
                    <span className="badge badge-approved">Patient Account</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{profile?.email}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Personal Details</h2>
                  </div>
                  <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        className="form-input"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Your full name"
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
                      <span className="form-hint">Email address cannot be changed</span>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        className="form-input"
                        type="tel"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        placeholder="e.g. +1 234 567 8900"
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={savingProfile}
                      style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                    >
                      {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                  </form>
                </div>

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
