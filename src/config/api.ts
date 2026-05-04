const isDev = import.meta.env.MODE === 'development';
const devBackendUrl = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
const prodBackendUrl = 'https://devant-backend.onrender.com';

export const API_BASE = isDev ? devBackendUrl : prodBackendUrl;
