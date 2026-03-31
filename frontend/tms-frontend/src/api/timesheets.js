import api from './axios';

export const submitTimesheet = (data) =>
  api.post('/api/timesheets', data);

export const getMyTimesheets = (params = {}) =>
  api.get('/api/timesheets/my', { params });

export const getPendingTimesheets = (params = {}) =>
  api.get('/api/timesheets/pending', { params });

export const getAllTimesheets = (params = {}) =>
  api.get('/api/timesheets/all', { params });

export const approveTimesheet = (id, data) =>
  api.post(`/api/timesheets/${id}/approve`, data);

export const getApprovedByManager = (managerId) =>
  api.get(`/api/timesheets/approved-by/${managerId}`);
