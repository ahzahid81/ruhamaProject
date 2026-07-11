import axios from "axios";

const api = axios.create({
  baseURL: "https://ruhama-project-6ul9.vercel.app/api",
});

export default api;