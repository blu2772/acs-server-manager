import axios from 'axios';

// Erstellen einer Axios-Instanz mit Standardkonfiguration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// API-Endpunkte

// Content-API (Autos und Strecken)
export const getContent = async () => {
  const response = await api.get('/content');
  return response.data;
};

export const getCars = async () => {
  const response = await api.get('/content/cars');
  return response.data;
};

export const getTracks = async () => {
  const response = await api.get('/content/tracks');
  return response.data;
};

// Upload-API
export const uploadMod = async (file, modType) => {
  const formData = new FormData();
  formData.append('modFile', file);
  formData.append('modType', modType);

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
};

// Konfigurations-API
export const getServerConfig = async () => {
  const response = await api.get('/config/server');
  return response.data;
};

export const updateServerConfig = async (config) => {
  const response = await api.put('/config/server', { config });
  return response.data;
};

export const getEntryList = async () => {
  const response = await api.get('/config/entrylist');
  return response.data;
};

export const updateEntryList = async (entries) => {
  const response = await api.put('/config/entrylist', { entries });
  return response.data;
};

export const quickSetup = async (track, layout, cars) => {
  const response = await api.put('/config/quick-setup', { track, layout, cars });
  return response.data;
};

// Server-Control-API
export const startServer = async () => {
  const response = await api.post('/server/start');
  return response.data;
};

export const stopServer = async () => {
  const response = await api.post('/server/stop');
  return response.data;
};

export const restartServer = async () => {
  const response = await api.post('/server/restart');
  return response.data;
};

export const getServerStatus = async () => {
  const response = await api.get('/server/status');
  return response.data;
};

export const getServerLogs = async (lines = 100) => {
  const response = await api.get(`/server/logs?lines=${lines}`);
  return response.data;
};

export default {
  getContent,
  getCars,
  getTracks,
  uploadMod,
  getServerConfig,
  updateServerConfig,
  getEntryList,
  updateEntryList,
  quickSetup,
  startServer,
  stopServer,
  restartServer,
  getServerStatus,
  getServerLogs
}; 