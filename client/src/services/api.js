import axios from "axios";

const api = axios.create({
  baseURL: "https://ruhamaproject-production.up.railway.app/api",
});

export default api;