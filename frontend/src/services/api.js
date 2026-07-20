import axios from "axios";

const api = axios.create({
  baseURL: "https://digital-twin-backends.onrender.com",
});

export default api;
