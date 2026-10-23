/**
 * SafeCity AI - Central API Client
 * Standardized Fetch API wrapper with CSRF injection and error handling
 */

const API = {
  csrfToken: null,

  async getCsrfToken() {
    if (this.csrfToken) return this.csrfToken;
    try {
      const res = await fetch('php/me.php');
      const data = await res.json();
      if (data.data && data.data.csrf_token) {
        this.csrfToken = data.data.csrf_token;
      }
    } catch (e) {
      console.warn('Could not fetch initial CSRF token', e);
    }
    return this.csrfToken;
  },

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('php/') ? endpoint : `php/${endpoint}`;
    const headers = options.headers || {};

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const token = await this.getCsrfToken();
    if (token) {
      headers['X-CSRF-Token'] = token;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok || data.success === false) {
        const error = new Error(data.message || 'API request failed');
        error.status = response.status;
        error.errors = data.errors || {};
        error.data = data.data;
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(fullUrl, { method: 'GET' });
  },

  post(endpoint, body = {}) {
    const isFormData = body instanceof FormData;
    return this.request(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body)
    });
  }
};

