import api from './axios';

export const submitTimesheet = (data) =>
  api.post('/api/timesheets', data);

export const getMyTimesheets = (userId) =>
  api.get(`/api/timesheets/my/${userId}`);

export const getPendingTimesheets = () =>
  api.get('/api/timesheets/pending');

export const approveTimesheet = (id, data) =>
  api.post(`/api/timesheets/${id}/approve`, data);
