import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isValidPassword, PASSWORD_REQUIREMENT_MSG } from '../../utils/validation';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phoneNumber: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidPassword(form.password)) {
      toast.error(PASSWORD_REQUIREMENT_MSG);
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created successfully!');
      navigate('/patient/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="brand-mark-text">MB</span>
          <span className="auth-logo-text">MediBook</span>
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Register as a patient</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input id="reg-name" className="form-input" name="name" placeholder="John Doe" value={form.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input id="reg-email" className="form-input" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Phone number</label>
            <input id="reg-phone" className="form-input" name="phoneNumber" placeholder="+91 98765 43210" value={form.phoneNumber} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="reg-password" className="form-input" type="password" name="password" placeholder="Min. 6 characters (letters + numbers)" value={form.password} onChange={handleChange} required />
            <span className="form-hint">At least 6 characters with both letters and numbers</span>
          </div>

          <button id="reg-submit" className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
