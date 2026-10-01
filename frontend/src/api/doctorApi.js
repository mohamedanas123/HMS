import api from './axiosInstance';

export const getDoctors = () => api.get('/doctors');
export const getDoctorById = (id) => api.get(`/doctors/${id}`);
export const getDoctorsByDepartment = (departmentId) => api.get(`/doctors/department/${departmentId}`);
export const getMyDoctorProfile = () => api.get('/doctors/me');
export const updateMyDoctorProfile = (data) => api.put('/doctors/me', data);
export const createDoctor = (data) => api.post('/doctors', data);
export const updateDoctor = (id, data) => api.put(`/doctors/${id}`, data);
export const deleteDoctor = (id) => api.delete(`/doctors/${id}`);
