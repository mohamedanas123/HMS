import api from './axiosInstance';
import { format } from 'date-fns';

const fmt = (date) => format(date, 'yyyy-MM-dd');

export const bookAppointment = (data) => api.post('/appointments', {
  ...data,
  appointmentDate: fmt(data.appointmentDate),
});
export const getMyAppointments = () => api.get('/appointments/my');
export const getAppointmentById = (id) => api.get(`/appointments/${id}`);
export const getAllAppointments = () => api.get('/appointments/all');
export const getDoctorSchedule = (doctorId, date) =>
  api.get(`/appointments/doctor/${doctorId}/date/${fmt(date)}`);
export const getBookedSlots = (doctorId, date) =>
  api.get(`/appointments/slots/${doctorId}?date=${fmt(date)}`);
export const cancelAppointment = (id) => api.patch(`/appointments/${id}/cancel`);
export const approveAppointment = (id) => api.patch(`/appointments/${id}/approve`);
export const completeAppointment = (id, prescriptionNotes) =>
  api.patch(`/appointments/${id}/complete`, { prescriptionNotes });
