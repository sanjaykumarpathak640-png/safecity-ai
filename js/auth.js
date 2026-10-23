/**
 * SafeCity AI - Authentication & Role State Manager
 */

const Auth = {
  user: null,
  isAuthenticated: false,

  async init() {
    try {
      const res = await API.get('php/me.php');
      if (res.data && res.data.authenticated) {
        this.user = res.data.user;
        this.isAuthenticated = true;
      } else {
        this.user = null;
        this.isAuthenticated = false;
      }
    } catch (e) {
      this.user = null;
      this.isAuthenticated = false;
    }
    this.updateNavUI();
    return this.user;
  },

  async login(email, password) {
    const res = await API.post('php/login.php', { email, password });
    this.user = res.data.user;
    this.isAuthenticated = true;
    if (res.data.csrf_token) {
      API.csrfToken = res.data.csrf_token;
    }
    this.updateNavUI();
    return this.user;
  },

  async signup(data) {
    const res = await API.post('php/signup.php', data);
    this.user = res.data.user;
    this.isAuthenticated = true;
    if (res.data.csrf_token) {
      API.csrfToken = res.data.csrf_token;
    }
    this.updateNavUI();
    return this.user;
  },

  async logout() {
    try {
      await API.post('php/logout.php', {});
    } catch (e) {
      console.warn('Logout notice:', e);
    }
    this.user = null;
    this.isAuthenticated = false;
    API.csrfToken = null;
    window.location.href = 'login.html';
  },

  requireAuth(requiredRole = null) {
    if (!this.isAuthenticated) {
      window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
      return false;
    }
    if (requiredRole === 'officer' && this.user.role !== 'officer' && this.user.role !== 'admin') {
      alert('Access restricted: Officer credentials required.');
      window.location.href = 'dashboard.html';
      return false;
    }
    return true;
  },

  updateNavUI() {
    const authContainer = document.getElementById('nav-auth-container');
    if (!authContainer) return;

    if (this.isAuthenticated && this.user) {
      const isOfficer = this.user.role === 'officer' || this.user.role === 'admin';
      const roleLabel = isOfficer ? 'Officer' : 'Citizen';
      const dashboardLink = isOfficer ? 'officer-dashboard.html' : 'dashboard.html';

      authContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <a href="${dashboardLink}" class="btn btn-sm btn-outline">
            <i class="fa-solid fa-gauge"></i> Dashboard
          </a>
          <a href="profile.html" class="btn btn-sm btn-secondary" title="View Profile">
            <i class="fa-solid fa-user"></i> ${this.escape(this.user.name.split(' ')[0])}
            <span class="brand-badge" style="margin-left: 0.25rem;">${roleLabel}</span>
          </a>
          <button onclick="Auth.logout()" class="btn btn-sm btn-secondary" title="Sign Out">
            <i class="fa-solid fa-arrow-right-from-bracket"></i>
          </button>
        </div>
      `;
    } else {
      authContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <a href="login.html" class="btn btn-sm btn-outline">Log In</a>
          <a href="signup.html" class="btn btn-sm btn-primary">Sign Up</a>
        </div>
      `;
    }
  },

  fillDemo(role) {
    const emailField = document.getElementById('login-email');
    const passField = document.getElementById('login-password');
    if (!emailField || !passField) return;

    if (role === 'citizen') {
      emailField.value = 'citizen@safecity.org';
      passField.value = 'password123';
    } else if (role === 'officer') {
      emailField.value = 'officer@safecity.org';
      passField.value = 'password123';
    } else if (role === 'admin') {
      emailField.value = 'admin@safecity.org';
      passField.value = 'password123';
    }
    emailField.focus();
  },

  escape(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
};

