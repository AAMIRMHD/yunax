const normalize = (value) => value.replace(/\/$/, '');

export const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return normalize(import.meta.env.VITE_API_URL);
  }

  const { protocol, hostname } = window.location;
  const isLocal =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0';

  if (isLocal) {
    return `${protocol}//${hostname}:5001`;
  }

  return normalize(window.location.origin);
};

export const API = getApiBase();
