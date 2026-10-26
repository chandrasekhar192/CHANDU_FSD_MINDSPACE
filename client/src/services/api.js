const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken() {
  return sessionStorage.getItem('mindspace_token');
}

function setToken(token) {
  sessionStorage.setItem('mindspace_token', token);
}

function removeToken() {
  sessionStorage.removeItem('mindspace_token');
}

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: { ...headers, ...options.headers },
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);

  // Handle 401 - clear auth
  if (response.status === 401) {
    removeToken();
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  // Handle empty responses
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    if (!response.ok) {
      throw new Error('An unexpected error occurred');
    }
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

// Auth API
export const authAPI = {
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  getMe: () => request('/auth/me'),
};

// Moods API
export const moodsAPI = {
  create: (data) => request('/moods', { method: 'POST', body: data }),
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/moods${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/moods/${id}`),
  update: (id, data) => request(`/moods/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/moods/${id}`, { method: 'DELETE' }),
};

// Journal API
export const journalAPI = {
  create: (data) => request('/journal', { method: 'POST', body: data }),
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/journal${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/journal/${id}`),
  update: (id, data) => request(`/journal/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/journal/${id}`, { method: 'DELETE' }),
};

// Habits API
export const habitsAPI = {
  create: (data) => request('/habits', { method: 'POST', body: data }),
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/habits${query ? `?${query}` : ''}`);
  },
  update: (id, data) => request(`/habits/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/habits/${id}`, { method: 'DELETE' }),
  getCompletions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/habits/completions${query ? `?${query}` : ''}`);
  },
  toggleCompletion: (habitId, data) => request(`/habits/${habitId}/completion`, { method: 'PUT', body: data }),
};

// Dashboard API
export const dashboardAPI = {
  getSummary: () => request('/dashboard/summary'),
};

// Insights API
export const insightsAPI = {
  getMoodInsights: (period = 'week') => request(`/insights/moods?period=${period}`),
};

export { getToken, setToken, removeToken };
