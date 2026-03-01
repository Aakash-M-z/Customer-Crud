// API Configuration
const API_BASE_URL = '/api/submissions';

// State Management
let submissions = [];
let filteredSubmissions = [];
let currentSubmissionId = null;

// Bootstrap Modal Instances
let submissionModal;
let viewModal;
let deleteModal;

// Check authentication on page load
function checkAuth() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Logout function
window.logout = function () {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
};

// Fetch with authentication
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('accessToken');

    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    // If token expired, try to refresh
    if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            // Retry the request with new token
            const newToken = localStorage.getItem('accessToken');
            return fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${newToken}`,
                    'Content-Type': 'application/json'
                }
            });
        } else {
            // Redirect to login
            logout();
            return response;
        }
    }

    return response;
}

// Refresh access token
async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
        const response = await fetch('/api/auth/refresh-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('accessToken', data.data.accessToken);
            return true;
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
    }

    return false;
}

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    initializeModals();
    setupEventListeners();
    loadSubmissions();
    displayUserInfo();
    applyFrontendPermissions();
});

// Apply permissions for UI elements
function applyFrontendPermissions() {
    const userString = localStorage.getItem('user');
    if (!userString) return;

    const user = JSON.parse(userString);
    const role = (user.role_name || user.role || '').toLowerCase();

    // Hide "New Submission" button if viewer
    if (role === 'viewer') {
        const newBtn = document.querySelector('button[onclick="openSubmissionModal()"]');
        if (newBtn) newBtn.style.display = 'none';

        const emptyStateBtn = document.querySelector('.empty-state button');
        if (emptyStateBtn) emptyStateBtn.style.display = 'none';
    }
}

// Display user info in header
function displayUserInfo() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.username) {
        const headerTitle = document.querySelector('.header-title');
        if (headerTitle) {
            const userBadge = document.createElement('span');
            userBadge.className = 'badge bg-light text-dark ms-3';
            userBadge.innerHTML = `<i class="fas fa-user me-1"></i>${user.username} (${user.role_name})`;
            headerTitle.appendChild(userBadge);
        }
    }
}

// Initialize Bootstrap Modals
function initializeModals() {
    submissionModal = new bootstrap.Modal(document.getElementById('submissionModal'));
    viewModal = new bootstrap.Modal(document.getElementById('viewModal'));
    deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
}

// Setup Event Listeners
function setupEventListeners() {
    // Search input
    document.getElementById('searchInput').addEventListener('input', debounce(applyFilters, 300));

    // Status filter
    document.getElementById('statusFilter').addEventListener('change', applyFilters);

    // Delete confirmation
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);

    // Form validation on input
    const formInputs = document.querySelectorAll('#submissionForm input, #submissionForm textarea');
    formInputs.forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('is-invalid', 'is-valid');
        });
    });
}

// Load Submissions from API
async function loadSubmissions() {
    showLoading(true);

    try {
        const response = await fetchWithAuth(API_BASE_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        submissions = data.data || [];
        filteredSubmissions = [...submissions];

        updateStats();
        renderSubmissions();
        showLoading(false);

    } catch (error) {
        console.error('Error loading submissions:', error);
        showToast('error', 'Error', 'Failed to load submissions. Please try again.');
        showLoading(false);
        showEmptyState(true);
    }
}

// Render Submissions Table
function renderSubmissions() {
    const tbody = document.getElementById('submissionsTableBody');
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');

    if (filteredSubmissions.length === 0) {
        tableContainer.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    tableContainer.style.display = 'block';
    emptyState.style.display = 'none';

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = (user.role_name || user.role || '').toLowerCase();

    tbody.innerHTML = filteredSubmissions.map(submission => {
        const canEdit = ['admin', 'manager'].includes(role);
        const canDelete = role === 'admin';

        return `
            <tr>
              <td><strong>#${submission.id}</strong></td>
              <td>${escapeHtml(submission.title)}</td>
              <td>${escapeHtml(submission.submitter_email)}</td>
              <td>${renderStatusBadge(submission.status)}</td>
              <td>${formatDate(submission.created_at)}</td>
              <td>
                <button class="action-btn view" onclick="viewSubmission(${submission.id})">
                  <i class="fas fa-eye"></i> View
                </button>
                ${canEdit ? `
                <button class="action-btn edit" onclick="editSubmission(${submission.id})">
                  <i class="fas fa-edit"></i> Edit
                </button>` : ''}
                ${canDelete ? `
                <button class="action-btn delete" onclick="deleteSubmission(${submission.id})">
                  <i class="fas fa-trash"></i> Delete
                </button>` : ''}
              </td>
            </tr>
        `;
    }).join('');
}

// Render Status Badge
function renderStatusBadge(status) {
    const icons = {
        pending: 'fa-clock',
        in_progress: 'fa-spinner',
        approved: 'fa-check-circle',
        rejected: 'fa-times-circle'
    };

    const displayStatus = status.replace('_', ' ');
    return `<span class="status-badge ${status}">
    <i class="fas ${icons[status] || 'fa-circle'}"></i>
    ${displayStatus}
  </span>`;
}

// Update Statistics
function updateStats() {
    const stats = {
        pending: 0,
        in_progress: 0,
        approved: 0,
        rejected: 0
    };

    submissions.forEach(submission => {
        if (stats.hasOwnProperty(submission.status)) {
            stats[submission.status]++;
        }
    });

    document.getElementById('statPending').textContent = stats.pending;
    document.getElementById('statInProgress').textContent = stats.in_progress;
    document.getElementById('statApproved').textContent = stats.approved;
    document.getElementById('statRejected').textContent = stats.rejected;
}

// Apply Filters
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;

    filteredSubmissions = submissions.filter(submission => {
        const matchesSearch =
            submission.title.toLowerCase().includes(searchTerm) ||
            submission.submitter_email.toLowerCase().includes(searchTerm) ||
            submission.description.toLowerCase().includes(searchTerm);

        const matchesStatus = !statusFilter || submission.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    renderSubmissions();
}

// Reset Filters - Exposed globally
window.resetFilters = function () {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    filteredSubmissions = [...submissions];
    renderSubmissions();
};

// Open Submission Modal (Add/Edit) - Exposed globally
window.openSubmissionModal = function (id = null) {
    const form = document.getElementById('submissionForm');
    const modalTitle = document.getElementById('modalTitle');

    // Reset form
    form.reset();
    form.classList.remove('was-validated');
    document.querySelectorAll('.form-control').forEach(el => {
        el.classList.remove('is-invalid', 'is-valid');
    });

    if (id) {
        // Edit mode
        const submission = submissions.find(s => s.id === id);
        if (submission) {
            document.getElementById('submissionId').value = submission.id;
            document.getElementById('title').value = submission.title;
            document.getElementById('description').value = submission.description;
            document.getElementById('submitter_email').value = submission.submitter_email;
            document.getElementById('status').value = submission.status;

            modalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Edit Submission';
        }
    } else {
        // Add mode
        document.getElementById('submissionId').value = '';
        modalTitle.innerHTML = '<i class="fas fa-plus-circle me-2"></i>New Submission';
    }

    submissionModal.show();
};

// Save Submission (Create/Update) - Exposed globally
window.saveSubmission = async function () {
    // Validate form
    if (!validateForm()) {
        return;
    }

    const id = document.getElementById('submissionId').value;
    const data = {
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        submitter_email: document.getElementById('submitter_email').value.trim(),
        status: document.getElementById('status').value
    };

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';

    try {
        const url = id ? `${API_BASE_URL}/${id}` : API_BASE_URL;
        const method = id ? 'PUT' : 'POST';

        const response = await fetchWithAuth(url, {
            method,
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            if (response.status === 422) {
                handleValidationErrors(result.errors);
                throw new Error('Validation failed');
            }
            if (response.status === 403) {
                throw new Error('You do not have permission to perform this action');
            }
            throw new Error(result.message || 'Failed to save submission');
        }

        submissionModal.hide();
        await loadSubmissions();

        const successMsg = id ? 'Submission updated successfully!' : 'Submission created successfully!';
        showToast('success', 'Success', successMsg);

    } catch (error) {
        console.error('Error saving submission:', error);
        if (error.message !== 'Validation failed') {
            showToast('error', 'Error', error.message || 'Failed to save submission');
        }
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Submission';
    }
};

// Validate Form
function validateForm() {
    const title = document.getElementById('title');
    const description = document.getElementById('description');
    const email = document.getElementById('submitter_email');

    let isValid = true;

    // Validate title
    if (!title.value.trim()) {
        title.classList.add('is-invalid');
        isValid = false;
    } else {
        title.classList.add('is-valid');
    }

    // Validate description
    if (!description.value.trim()) {
        description.classList.add('is-invalid');
        isValid = false;
    } else {
        description.classList.add('is-valid');
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value.trim() || !emailRegex.test(email.value)) {
        email.classList.add('is-invalid');
        isValid = false;
    } else {
        email.classList.add('is-valid');
    }

    if (!isValid) {
        showToast('error', 'Validation Error', 'Please fill in all required fields correctly');
    }

    return isValid;
}

// Handle Validation Errors from API
function handleValidationErrors(errors) {
    if (!errors || !Array.isArray(errors)) return;

    errors.forEach(error => {
        const field = document.getElementById(error.path);
        if (field) {
            field.classList.add('is-invalid');
        }
    });

    const errorMessages = errors.map(e => e.msg).join(', ');
    showToast('error', 'Validation Error', errorMessages);
}

// View Submission - Exposed globally
window.viewSubmission = async function (id) {
    const submission = submissions.find(s => s.id === id);

    if (!submission) {
        showToast('error', 'Error', 'Submission not found');
        return;
    }

    const viewBody = document.getElementById('viewModalBody');
    viewBody.innerHTML = `
    <div class="detail-row">
      <strong>ID:</strong>
      <span>#${submission.id}</span>
    </div>
    <div class="detail-row">
      <strong>Title:</strong>
      <span>${escapeHtml(submission.title)}</span>
    </div>
    <div class="detail-row">
      <strong>Description:</strong>
      <span>${escapeHtml(submission.description)}</span>
    </div>
    <div class="detail-row">
      <strong>Submitter Email:</strong>
      <span>${escapeHtml(submission.submitter_email)}</span>
    </div>
    <div class="detail-row">
      <strong>Status:</strong>
      <span>${renderStatusBadge(submission.status)}</span>
    </div>
    <div class="detail-row">
      <strong>Created At:</strong>
      <span>${formatDate(submission.created_at)}</span>
    </div>
  `;

    viewModal.show();
};

// Edit Submission - Exposed globally
window.editSubmission = function (id) {
    window.openSubmissionModal(id);
};

// Delete Submission - Exposed globally
window.deleteSubmission = function (id) {
    currentSubmissionId = id;
    deleteModal.show();
};

// Confirm Delete
async function confirmDelete() {
    if (!currentSubmissionId) return;

    const confirmBtn = document.getElementById('confirmDeleteBtn');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Deleting...';

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/${currentSubmissionId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const result = await response.json();
            if (response.status === 403) {
                throw new Error('You do not have permission to delete submissions');
            }
            throw new Error(result.message || 'Failed to delete submission');
        }

        deleteModal.hide();
        await loadSubmissions();
        showToast('success', 'Deleted', 'Submission deleted successfully!');

    } catch (error) {
        console.error('Error deleting submission:', error);
        showToast('error', 'Error', error.message || 'Failed to delete submission');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-trash me-2"></i>Delete';
        currentSubmissionId = null;
    }
}

// Show Loading State
function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');

    if (show) {
        loadingState.style.display = 'block';
        tableContainer.style.display = 'none';
        emptyState.style.display = 'none';
    } else {
        loadingState.style.display = 'none';
    }
}

// Show Empty State
function showEmptyState(show) {
    const emptyState = document.getElementById('emptyState');
    const tableContainer = document.getElementById('tableContainer');

    if (show) {
        emptyState.style.display = 'block';
        tableContainer.style.display = 'none';
    }
}

// Show Toast Notification
function showToast(type, title, message) {
    const toastContainer = document.getElementById('toastContainer');

    const toastId = `toast-${Date.now()}`;
    const toastHtml = `
    <div id="${toastId}" class="toast ${type}" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'} me-2"></i>
        <strong class="me-auto">${title}</strong>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    </div>
  `;

    toastContainer.insertAdjacentHTML('beforeend', toastHtml);

    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 4000 });
    toast.show();

    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Utility Functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
