import axios from 'axios';

// For backend (with credentials)
const axiosBackend = axios.create({
  baseURL: '',
  withCredentials: true
});

// For external APIs (no credentials)
const axiosExternal = axios.create({
  withCredentials: false
});

export { axiosBackend, axiosExternal };
