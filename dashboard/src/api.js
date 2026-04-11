import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const searchAPI = {
  search: (query, page = 1, limit = 20) =>
    api.get('/search', { params: { query, page, limit } }),
  
  advancedSearch: (filters, page = 1, limit = 20) =>
    api.post('/search/advanced', { filters, page, limit }),
  
  searchByCategory: (category, page = 1, limit = 20) =>
    api.get(`/search/category/${category}`, { params: { page, limit } }),
  
  searchByLocation: (city, country, page = 1, limit = 20) =>
    api.get('/search/location', { params: { city, country, page, limit } }),
  
  searchNearby: (latitude, longitude, radius = 5, limit = 50) =>
    api.get('/search/nearby', { params: { latitude, longitude, radius, limit } }),
  
  getBusinessById: (id) =>
    api.get(`/search/${id}`),
  
  getTopRated: (category, limit = 20) =>
    api.get(`/search/top-rated/${category}`, { params: { limit } }),
  
  getStatistics: () =>
    api.get('/search/stats'),
};

export const analyticsAPI = {
  getMetrics: () =>
    api.get('/analytics/metrics'),
  
  getByCategory: () =>
    api.get('/analytics/category'),
  
  getByStatus: () =>
    api.get('/analytics/status'),
  
  getByProvider: () =>
    api.get('/analytics/provider'),
  
  getGeographicDistribution: () =>
    api.get('/analytics/geographic'),
  
  getRatingDistribution: () =>
    api.get('/analytics/rating'),
  
  getTopCategories: (limit = 10) =>
    api.get('/analytics/top-categories', { params: { limit } }),
  
  getTrends: (days = 30) =>
    api.get('/analytics/trends', { params: { days } }),
};

export const recommendationsAPI = {
  getSimilar: (id, limit = 10) =>
    api.get(`/recommendations/similar/${id}`, { params: { limit } }),
  
  getForUser: (city, categories, minRating = 3.5, limit = 20) =>
    api.get('/recommendations/user', { params: { city, categories: categories.join(','), minRating, limit } }),
  
  getTrending: (limit = 20) =>
    api.get('/recommendations/trending', { params: { limit } }),
  
  getCompetitors: (id, limit = 10) =>
    api.get(`/recommendations/competitors/${id}`, { params: { limit } }),
};

export default api;
