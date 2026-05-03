import apiClient from './api';

export const fetchMyQrStatus = async () => {
  const res = await apiClient.get('/qr/my-status');
  return res.data;
};

export const submitQrScan = async (payload) => {
  const res = await apiClient.post('/qr/scan', payload);
  return res.data;
};

export const fetchSecurityPin = async () => {
  const res = await apiClient.get('/qr/security-pin');
  return res.data;
};

export const fetchOutsideStudents = async () => {
  const res = await apiClient.get('/qr/outside');
  return res.data;
};

export const fetchLateStudents = async () => {
  const res = await apiClient.get('/qr/late');
  return res.data;
};

export const fetchAllLogs = async () => {
  const res = await apiClient.get('/qr/logs');
  return res.data;
};
