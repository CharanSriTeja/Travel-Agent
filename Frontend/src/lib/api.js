import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Store auth token in localStorage
const getToken = () => localStorage.getItem("auth_token");
const setToken = (token) => localStorage.setItem("auth_token", token);
const clearToken = () => localStorage.removeItem("auth_token");

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  signup: async (email, password, fullName) => {
    const response = await apiClient.post("/auth/signup", {
      email,
      password,
      full_name: fullName,
    });
    setToken(response.data.token);
    return response.data.user;
  },

  signin: async (email, password) => {
    const response = await apiClient.post("/auth/signin", {
      email,
      password,
    });
    setToken(response.data.token);
    return response.data.user;
  },

  signout: () => {
    clearToken();
  },

  getMe: async () => {
    try {
      const response = await apiClient.get("/auth/me");
      return response.data;
    } catch (error) {
      clearToken();
      return null;
    }
  },
};

// Booking API
export const bookingApi = {
  create: async (flight) => {
    const response = await apiClient.post("/bookings", {
      airline: flight.airline || "",
      flight_no: flight.flightNo || "",
      from_airport: flight.from || "",
      to_airport: flight.to || "",
      departure_time: flight.departure || "",
      arrival_time: flight.arrival || "",
      duration: flight.duration || "",
      stops: flight.stops || "",
      cabin: flight.cabin || "Economy",
      price: flight.price || "",
    });
    return response.data;
  },

  getAll: async () => {
    const response = await apiClient.get("/bookings");
    return response.data;
  },

  getOne: async (bookingId) => {
    const response = await apiClient.get(`/bookings/${bookingId}`);
    return response.data;
  },
};

export default apiClient;
