import axios from "axios";

const studentApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

studentApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("studentToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

studentApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("studentToken");
      localStorage.removeItem("student");
      if (window.location.pathname !== "/student-login") {
        window.location.href = "/student-login";
      }
    }
    return Promise.reject(error);
  }
);

export default studentApi;
