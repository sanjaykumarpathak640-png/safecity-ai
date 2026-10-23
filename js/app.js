/**
 * SafeCity AI - Global Application Shell & UI Utilities
 */

const SafeCity = {
  init() {
    // Mobile navigation toggle
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    if (menuBtn && navLinks) {
      menuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('mobile-open');
      });
    }

    // Modal backdrop click to close
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal.id);
        }
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.active').forEach(modal => {
          this.closeModal(modal.id);
        });
      }
    });

    // Initialize Auth
    if (typeof Auth !== 'undefined') {
      Auth.init();
    }
  },

  showToast(message, type = 'info', duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
      success: '<i class="fa-solid fa-circle-check" style="color: var(--color-safe);"></i>',
      error: '<i class="fa-solid fa-triangle-exclamation" style="color: var(--color-danger);"></i>',
      warning: '<i class="fa-solid fa-circle-exclamation" style="color: var(--color-caution);"></i>',
      info: '<i class="fa-solid fa-circle-info" style="color: var(--accent-cyan);"></i>'
    };

    toast.innerHTML = `
      ${icons[type] || icons.info}
      <div style="flex: 1;">${message}</div>
      <button style="background:none; border:none; color:var(--text-muted); cursor:pointer;" onclick="this.parentElement.remove()">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  getCategoryLabel(category) {
    const labels = {
      pothole: 'Pothole / Road Damage',
      broken_streetlight: 'Broken Streetlight',
      garbage: 'Garbage Accumulation',
      waterlogging: 'Monsoon Waterlogging',
      damaged_footpath: 'Damaged Footpath',
      drainage: 'Drainage / Open Manhole',
      other: 'Other Civic Issue'
    };
    return labels[category] || category;
  },

  getStatusBadge(status) {
    const badges = {
      pending: '<span class="badge badge-pending"><i class="fa-solid fa-clock"></i> Pending</span>',
      in_progress: '<span class="badge badge-progress"><i class="fa-solid fa-screwdriver-wrench"></i> In Progress</span>',
      fixed: '<span class="badge badge-fixed"><i class="fa-solid fa-circle-check"></i> Fixed</span>',
      rejected: '<span class="badge badge-low"><i class="fa-solid fa-ban"></i> Rejected</span>'
    };
    return badges[status] || `<span class="badge badge-low">${status}</span>`;
  },

  getPriorityBadge(level) {
    const badges = {
      Critical: '<span class="badge badge-critical"><i class="fa-solid fa-fire"></i> Critical</span>',
      High: '<span class="badge badge-high"><i class="fa-solid fa-arrow-up"></i> High</span>',
      Medium: '<span class="badge badge-medium">Medium</span>',
      Low: '<span class="badge badge-low">Low</span>'
    };
    return badges[level] || `<span class="badge badge-low">${level}</span>`;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  SafeCity.init();
});

