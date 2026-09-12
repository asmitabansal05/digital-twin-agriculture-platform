import axios from "axios";

const api = axios.create({
    baseURL: "https://digital-twin-agriculture-api.onrender.com",
});

export default api;
