import api from './axiosInstance';

export const getCurrentUserProfile = () => api.get('/users/me');
export const updateCurrentUserProfile = (data) => api.put('/users/me', data);
export const changePassword = (data) => api.put('/users/me/change-password', data);
export const getAllUsers = (role) => api.get('/users', { params: role ? { role } : {} });
export const getAllPatients = () => api.get('/users/patients');
export const getUserById = (id) => api.get(`/users/${id}`);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
