// Centralized API configuration
// In production (Docker/Nginx), API_BASE_URL defaults to '' (relative paths like /api/...)
// In local dev, VITE_API_URL can override it if needed.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backend.knotpdn.tech';
