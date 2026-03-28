import axios from 'axios';

// For backend (with credentials)
const axiosBackend = axios.create({
  baseURL: 'http://127.0.0.1:5000',
  withCredentials: true
});

// For external APIs (no credentials)
const axiosExternal = axios.create({
  withCredentials: false
});

export { axiosBackend, axiosExternal };
