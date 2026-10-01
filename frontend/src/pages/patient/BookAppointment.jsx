import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Navbar from '../../components/Navbar';
import { getDepartments } from '../../api/departmentApi';
import { getDoctorsByDepartment } from '../../api/doctorApi';
import { bookAppointment, getBookedSlots } from '../../api/appointmentApi';
import { formatTime, formatTimeRange } from '../../utils/formatTime';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function timeToMinutes(t) {
  if (!t) return 0;
  const parts = t.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}

function minutesToTime(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export default function BookAppointment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); 
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getDepartments().then(r => setDepartments(r.data));
  }, []);

  const selectDept = (dept) => {
    setSelectedDept(dept);
    setSelectedDoctor(null);
    setLoading(true);
    getDoctorsByDepartment(dept.id)
      .then(r => setDoctors(r.data))
      .catch(err => toast.error(err.response?.data?.message || 'Failed to load doctors'))
      .finally(() => setLoading(false));
    setStep(2);
  };

  const selectDoctor = (doc) => {
    setSelectedDoctor(doc);
    setStep(3);
  };

  const onDateChange = (date) => {
    setSelectedDate(date);
    setBookedSlots([]);
    setStartTime('');
    setEndTime('');
    if (date && selectedDoctor) {
      getBookedSlots(selectedDoctor.id, date)
        .then(r => setBookedSlots(r.data))
        .catch(() => {});
    }
  };

  const validateSlotSelection = () => {
    if (!startTime || !endTime) {
      return { valid: false, message: 'Please select or enter both start and end time.' };
    }

    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);

    if (endMin <= startMin) {
      return { valid: false, message: 'End time must be after start time.' };
    }

    const duration = endMin - startMin;
    if (duration < 15) {
      return { valid: false, message: 'Appointment duration must be at least 15 minutes.' };
    }
    if (duration > 60) {
      return { valid: false, message: 'Maximum appointment duration is 1 hour (60 minutes).' };
    }

    if (selectedDoctor) {
      const docStart = timeToMinutes(selectedDoctor.startTime);
      const docEnd = timeToMinutes(selectedDoctor.endTime);
      if (startMin < docStart || endMin > docEnd) {
        return {
          valid: false,
          message: `Time must be within Dr. ${selectedDoctor.name}'s working hours (${formatTime(selectedDoctor.startTime)} – ${formatTime(selectedDoctor.endTime)}).`
        };
      }

      if (selectedDoctor.breakTime && selectedDoctor.breakEndTime) {
        const breakStart = timeToMinutes(selectedDoctor.breakTime);
        const breakEnd = timeToMinutes(selectedDoctor.breakEndTime);
        if (startMin < breakEnd && endMin > breakStart) {
          return {
            valid: false,
            message: `Selected time overlaps with doctor's break (${formatTime(selectedDoctor.breakTime)} – ${formatTime(selectedDoctor.breakEndTime)}) and is NOT available.`
          };
        }
      }
    }

    if (bookedSlots && bookedSlots.length > 0) {
      for (const slot of bookedSlots) {
        const slotStart = timeToMinutes(slot.startTime);
        const slotEnd = timeToMinutes(slot.endTime);
        if (startMin < slotEnd && endMin > slotStart) {
          return {
            valid: false,
            message: `Selected time overlaps with an existing booking (${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}) and is NOT available.`
          };
        }
      }
    }

    return { valid: true, message: `Available slot (${duration} mins)` };
  };

  const slotValidation = validateSlotSelection();

  const getAvailableSlots = () => {
    if (!selectedDoctor || !selectedDoctor.startTime || !selectedDoctor.endTime) return [];
    const docStart = timeToMinutes(selectedDoctor.startTime);
    const docEnd = timeToMinutes(selectedDoctor.endTime);
    const breakStart = selectedDoctor.breakTime ? timeToMinutes(selectedDoctor.breakTime) : -1;
    const breakEnd = selectedDoctor.breakEndTime ? timeToMinutes(selectedDoctor.breakEndTime) : -1;

    const available = [];
    for (let s = docStart; s + 30 <= docEnd; s += 30) {
      const e = s + 30;
      if (breakStart !== -1 && s < breakEnd && e > breakStart) {
        continue;
      }
      const isBooked = bookedSlots.some(b => {
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        return s < bEnd && e > bStart;
      });
      if (!isBooked) {
        available.push({
          start: minutesToTime(s),
          end: minutesToTime(e)
        });
      }
    }
    return available;
  };

  const availableQuickSlots = selectedDate ? getAvailableSlots() : [];

  const handleBook = async () => {
    if (!slotValidation.valid) {
      toast.error(slotValidation.message || 'Please select a valid time');
      return;
    }

    setSubmitting(true);
    try {
      await bookAppointment({
        doctorId: selectedDoctor.id,
        appointmentDate: selectedDate,
        startTime,
        endTime,
      });
      toast.success('Appointment booked! Waiting for doctor approval.');
      setStep(5); 
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = ['Department', 'Doctor', 'Schedule', 'Confirm'];

  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">Book an Appointment</h1>
              <p className="page-subtitle">Choose your doctor and preferred time slot</p>
            </div>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {stepLabels.map((label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 'var(--radius-xs)',
                  background: step > i ? 'var(--brand-primary)' : step === i + 1 ? 'var(--brand-primary)' : 'var(--bg-surface-elevated)',
                  border: `1px solid ${step >= i + 1 ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700,
                  color: step >= i + 1 ? '#fff' : 'var(--text-tertiary)',
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: '0.825rem', color: step === i + 1 ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: step === i + 1 ? 600 : 500 }}>
                  {label}
                </span>
                {i < stepLabels.length - 1 && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>&rarr;</span>}
              </div>
            ))}
          </div>

          {/* Step 1 — Department */}
          {step === 1 && (
            <div className="card">
              <h2 className="card-title" style={{ marginBottom: '1.25rem' }}>Select a Clinical Department</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {departments.map(d => (
                  <div
                    key={d.id}
                    className="card"
                    style={{ cursor: 'pointer', padding: '1.25rem', transition: 'all var(--transition-fast)' }}
                    onClick={() => selectDept(d)}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{d.departmentName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>{d.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Doctor */}
          {step === 2 && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Doctors in {selectedDept?.departmentName}</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>&larr; Back</button>
              </div>
              {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
              ) : doctors.length === 0 ? (
                <div className="empty-state"><p>No doctors in this department yet.</p></div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                  {doctors.map(d => (
                    <div key={d.id} className={`doctor-card ${selectedDoctor?.id === d.id ? 'selected' : ''}`} onClick={() => selectDoctor(d)}>
                      <div className="doctor-avatar">{initials(d.name)}</div>
                      <div className="doctor-name">Dr. {d.name}</div>
                      <div className="doctor-spec">{d.specialization}</div>
                      <div className="doctor-dept">{d.departmentName}</div>
                      <div className="doctor-hours">
                        Hours: {formatTime(d.startTime)} – {formatTime(d.endTime)}
                        {d.breakTime && ` (Break: ${formatTime(d.breakTime)} – ${formatTime(d.breakEndTime)})`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Date & Time */}
          {step === 3 && selectedDoctor && (
            <div className="grid-2">
              {/* Date Picker */}
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Select Date</h2>
                  <button className="btn btn-ghost btn-sm" onClick={() => setStep(2)}>&larr; Back to Doctors</button>
                </div>
                <DatePicker
                  inline
                  selected={selectedDate}
                  onChange={onDateChange}
                  minDate={new Date()}
                  filterDate={d => d.getDay() !== 0}
                />
              </div>

              {/* Time Selection & Availability Visualizer */}
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Select Time Slot</h2>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Max 1 hour</span>
                </div>

                {/* Doctor Shift Schedule Banner */}
                <div style={{ padding: '0.85rem 1rem', background: 'var(--brand-primary-soft)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--brand-border)', marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--brand-primary)' }}>
                  <strong>Dr. {selectedDoctor.name} schedule:</strong> {formatTime(selectedDoctor.startTime)} – {formatTime(selectedDoctor.endTime)}
                  {selectedDoctor.breakTime && ` (Break: ${formatTime(selectedDoctor.breakTime)} – ${formatTime(selectedDoctor.breakEndTime)})`}
                </div>

                {/* Unavailable Timings Section (Booked Slots + Break Time) */}
                {selectedDate && (
                  <div style={{ marginBottom: '1.25rem', padding: '0.85rem', background: 'var(--danger-light)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(225,29,72,0.2)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>Unavailable Timings on {format(selectedDate, 'dd MMM yyyy')}:</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {/* Doctor Break Time */}
                      {selectedDoctor.breakTime && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ padding: '2px 6px', background: '#fff', borderRadius: 'var(--radius-xs)', fontWeight: 600 }}>
                            {formatTime(selectedDoctor.breakTime)} – {formatTime(selectedDoctor.breakEndTime)}
                          </span>
                          <span>Doctor Break (Unavailable)</span>
                        </div>
                      )}

                      {/* Already Booked Slots by Other Users */}
                      {bookedSlots.length > 0 ? (
                        bookedSlots.map((s, i) => (
                          <div key={i} style={{ fontSize: '0.75rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ padding: '2px 6px', background: '#fff', borderRadius: 'var(--radius-xs)', fontWeight: 600 }}>
                              {formatTime(s.startTime)} – {formatTime(s.endTime)}
                            </span>
                            <span>Booked by another patient (Not Available)</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          No appointments booked yet on this date.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Pick Available Slots */}
                {selectedDate && availableQuickSlots.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                      Quick Pick Available 30-min Slots:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {availableQuickSlots.map((s, i) => {
                        const isSelected = startTime === s.start && endTime === s.end;
                        return (
                          <button
                            key={i}
                            type="button"
                            className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                            onClick={() => {
                              setStartTime(s.start);
                              setEndTime(s.end);
                            }}
                          >
                            {formatTime(s.start)} – {formatTime(s.end)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Custom Time Pickers */}
                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Start time</label>
                    <input
                      id="book-start"
                      className="form-input"
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End time</label>
                    <input
                      id="book-end"
                      className="form-input"
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Real-time Validation Message Banner */}
                {startTime && endTime && (
                  <div style={{
                    marginTop: '0.85rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.785rem',
                    fontWeight: 600,
                    background: slotValidation.valid ? 'var(--success-light)' : 'var(--danger-light)',
                    color: slotValidation.valid ? 'var(--success)' : 'var(--danger)',
                    border: `1px solid ${slotValidation.valid ? 'rgba(5,150,105,0.2)' : 'rgba(225,29,72,0.2)'}`
                  }}>
                    {slotValidation.valid ? `✓ ${slotValidation.message}` : `⚠ ${slotValidation.message}`}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setStep(2)}
                  >
                    &larr; Back
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: 'center' }}
                    disabled={!selectedDate || !slotValidation.valid}
                    onClick={() => setStep(4)}
                  >
                    Review Booking &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Confirm */}
          {step === 4 && (
            <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
              <div className="card-header">
                <h2 className="card-title">Confirm Appointment</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => setStep(3)}>&larr; Back to Schedule</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  ['Department', selectedDept?.departmentName],
                  ['Doctor', `Dr. ${selectedDoctor?.name} — ${selectedDoctor?.specialization}`],
                  ['Date', selectedDate ? format(selectedDate, 'EEEE, dd MMMM yyyy') : ''],
                  ['Time', `${formatTime(startTime)} – ${formatTime(endTime)} (${timeToMinutes(endTime) - timeToMinutes(startTime)} mins)`],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{label}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
                  </div>
                ))}
              </div>

              <p style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Your appointment will be set to <strong style={{ color: 'var(--warning)' }}>Pending</strong> until the doctor approves it.
              </p>

              {/* Action Buttons with clear Back button */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setStep(3)}
                  disabled={submitting}
                >
                  &larr; Back to Schedule
                </button>
                <button
                  id="confirm-book"
                  className="btn btn-primary"
                  style={{ flex: 1.5, justifyContent: 'center' }}
                  onClick={handleBook}
                  disabled={submitting}
                >
                  {submitting ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          )}

          {/* Step 5 — Success View */}
          {step === 5 && (
            <div className="card" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', padding: '2.5rem 2rem' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', margin: '0 auto 1.25rem' }}>
                ✓
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Appointment Requested!
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
                Your booking with <strong>Dr. {selectedDoctor?.name}</strong> on <strong>{selectedDate ? format(selectedDate, 'dd MMM yyyy') : ''}</strong> from <strong>{formatTime(startTime)} to {formatTime(endTime)}</strong> has been submitted.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setStep(1);
                    setSelectedDept(null);
                    setSelectedDoctor(null);
                    setSelectedDate(null);
                    setStartTime('');
                    setEndTime('');
                  }}
                >
                  Book Another Appointment
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate('/patient/appointments')}
                >
                  View My Appointments &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
