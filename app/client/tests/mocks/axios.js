/**
 * Axios mock for Jest tests
 * This mocks the axios instance used in the application
 */
import axios from 'axios';

// Create a mock instance that will be imported by tests
const mockAxios = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Add response interceptor for common response handling
mockAxios.interceptors.response.use(
  (response) => {
    // Any status code that lies within the range of 2xx
    return response;
  },
  (error) => {
    // Any status codes outside the range of 2xx
    return Promise.reject(error);
  }
);

export default mockAxios;
