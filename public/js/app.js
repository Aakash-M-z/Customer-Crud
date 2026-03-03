let table;
const modal = new bootstrap.Modal(document.getElementById("modal"));
let deleteModal;
let customerToDelete = null;

$(document).ready(async function () {
  if (!checkAuth()) return;

  // Set up global AJAX handling for jQuery
  setupGlobalAjax();

  load();
  createToastContainer();
  deleteModal = new bootstrap.Modal(document.getElementById("deleteModal"));
  applyFrontendPermissions();
  displayUserInfo();

  $("#confirmDeleteBtn").on("click", function () {
    if (customerToDelete) {
      confirmDelete(customerToDelete);
    }
  });

  $(".form-control").on("input", function () {
    $(this).removeClass("is-invalid is-valid");
  });
});

// Set up global jQuery AJAX configuration
function setupGlobalAjax() {
  $.ajaxSetup({
    beforeSend: function (xhr) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
    }
  });

  // Handle errors globally
  $(document).ajaxError(async function (event, jqXHR, ajaxSettings, thrownError) {
    // If it's a 401 and we haven't tried refreshing yet for this request
    if (jqXHR.status === 401 && !ajaxSettings._isRetry) {
      ajaxSettings._isRetry = true;
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry the original request with the new token
        $.ajax(ajaxSettings);

        // If it was a DataTable load, reload the table too
        if (ajaxSettings.url === "/getCustomers" && table) {
          table.ajax.reload(null, false);
        }
      } else {
        logout();
      }
    }
  });
}

// Logout function
window.logout = function () {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
};

// Display user info in header
function displayUserInfo() {
  const userString = localStorage.getItem('user');
  if (!userString) return;

  const user = JSON.parse(userString);
  const badgeContainer = document.getElementById('userBadge');
  if (badgeContainer && user.username) {
    const roleName = user.role_name || user.role || 'User';
    badgeContainer.innerHTML = `
      <span class="user-badge ms-3">
        <i class="fas fa-user-circle me-1"></i>
        ${user.username} <span class="role-text">(${roleName})</span>
      </span>
    `;
  }
}

// Check if user is authenticated
function checkAuth() {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
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

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
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
      localStorage.clear();
      window.location.href = '/login.html';
      return response;
    }
  }

  return response;
}

// Apply permissions for UI elements
function applyFrontendPermissions() {
  const userString = localStorage.getItem('user');
  if (!userString) return;

  const user = JSON.parse(userString);
  const role = (user.role_name || user.role || '').toLowerCase();

  // Hide "Add Customer" button if viewer
  if (role === 'viewer') {
    $("#addCustomerBtn").hide();
  }
}

function createToastContainer() {
  if (!document.querySelector('.toast-container')) {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
}

function showToast(type, title, message) {
  const container = document.querySelector('.toast-container');

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    warning: 'fa-exclamation-triangle'
  };

  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.innerHTML = `
    <i class="fas ${icons[type]} toast-icon"></i>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function load() {
  table = $("#table").DataTable({
    ajax: {
      url: "/getCustomers",
      dataSrc: "data"
      // Auth is now handled globally by setupGlobalAjax
    },
    order: [[1, 'asc']],
    autoWidth: false,
    responsive: true,
    dom: '<"top"rt><"bottom"ip><"clear">', // Hide default search and length
    columns: [
      {
        data: "id",
        title: "S.No",
        orderable: false,
        width: "60px",
        render: function (data, type, row, meta) {
          const allData = table ? table.rows({ order: 'applied' }).data().toArray() : [];
          const sortedIndex = allData.findIndex(r => r.id === row.id);
          return sortedIndex !== -1 ? sortedIndex + 1 : meta.row + 1;
        }
      },
      {
        data: "id",
        visible: false,
        searchable: false
      },
      { data: "first_name", title: "First Name", width: "15%" },
      { data: "last_name", title: "Last Name", width: "15%" },
      { data: "email", title: "Email", width: "25%" },
      {
        data: null,
        title: "Actions",
        orderable: false,
        width: "35%",
        render: function (data) {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const role = (user.role_name || user.role || '').toLowerCase();
          const canEdit = ['admin', 'manager'].includes(role);
          const canDelete = role === 'admin';

          return `
            <button class='action-btn view me-2' onclick='view(${data.id})'>
              <i class='fas fa-eye'></i>
            </button>
            ${canEdit ? `
            <button class='action-btn edit me-2' onclick='edit(${data.id})'>
              <i class='fas fa-edit'></i>
            </button>` : ''}
            ${canDelete ? `
            <button class='action-btn delete' onclick='removeCustomer(${data.id})'>
              <i class='fas fa-trash'></i>
            </button>` : ''}
          `;
        }
      }
    ],
    drawCallback: function (settings) {
      // Update stats based on the data
      updateStats(settings.aoData.map(d => d._aData));

      this.api().column(0, { order: 'applied' }).nodes().each(function (cell, i) {
        cell.innerHTML = i + 1;
      });
    }
  });

  // Custom search logic
  $("#customerSearch").on("keyup", function () {
    table.search($(this).val()).draw();
  });
}

function updateStats(data) {
  if (!data) return;

  const total = data.length;
  const today = data.filter(c => {
    if (!c.created_at) return false;
    const d = new Date(c.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  // Simple "Active" logic (everyone for now)
  const active = total;

  $("#statTotal").text(total);
  $("#statToday").text(today);
  $("#statActive").text(active);
  $("#statRecent").text(Math.floor(total * 0.2)); // Just a placeholder for demo
}

function refreshData() {
  if (table) table.ajax.reload();
}

function openForm() {
  $("#id").val("");
  $("#first_name").val("");
  $("#last_name").val("");
  $("#email").val("");
  $("#phone").val("");
  $("#address").val("");
  $("#formTitle").html("<i class='fas fa-user-plus me-2'></i>Add Customer");
  $(".form-control").removeClass("is-invalid is-valid");
  modal.show();
}

async function edit(id) {
  const res = await fetchWithAuth(`/api/customers/${id}`);
  const data = await res.json();

  $("#id").val(data.id);
  $("#first_name").val(data.first_name);
  $("#last_name").val(data.last_name);
  $("#email").val(data.email);
  $("#phone").val(data.phone);
  $("#address").val(data.address);

  $("#formTitle").html("<i class='fas fa-user-edit me-2'></i>Edit Customer");
  $(".form-control").removeClass("is-invalid is-valid");
  modal.show();
}

async function save() {
  $(".form-control").removeClass("is-invalid is-valid");

  const id = $("#id").val();
  const firstName = $("#first_name").val().trim();
  const lastName = $("#last_name").val().trim();
  const email = $("#email").val().trim();
  const phone = $("#phone").val().trim();
  const address = $("#address").val().trim();

  let isValid = true;

  if (!firstName) {
    $("#first_name").addClass("is-invalid");
    isValid = false;
  } else {
    $("#first_name").addClass("is-valid");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    $("#email").addClass("is-invalid");
    isValid = false;
  } else {
    $("#email").addClass("is-valid");
  }

  if (!phone || !/^\d{10}$/.test(phone)) {
    $("#phone").addClass("is-invalid");
    isValid = false;
  } else {
    $("#phone").addClass("is-valid");
  }

  if (!isValid) {
    showToast('error', 'Validation Error', 'Please fill in all required fields correctly');
    return;
  }

  const data = {
    first_name: firstName,
    last_name: lastName,
    email: email,
    phone: phone,
    address: address
  };

  const method = id ? "PUT" : "POST";
  const url = id ? `/api/customers/${id}` : "/api/customers";

  try {
    const response = await fetchWithAuth(url, {
      method,
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 409) {
        $("#email").addClass("is-invalid");
        showToast('error', 'Duplicate Email', 'This email already exists. Please use a different email.');
      } else if (response.status === 422) {
        showToast('error', 'Validation Error', result.errors ? result.errors.map(e => e.msg).join(", ") : "Invalid data");
      } else {
        showToast('error', 'Error', result.error || "An error occurred");
      }
      return;
    }

    modal.hide();
    table.ajax.reload();

    const successMsg = id ? "Customer updated successfully!" : "Customer added successfully!";
    showToast('success', 'Success', successMsg);
  } catch (error) {
    showToast('error', 'Error', 'Failed to save customer. Please try again.');
  }
}

async function removeCustomer(id) {
  customerToDelete = id;
  deleteModal.show();
}

async function confirmDelete(id) {
  try {
    const response = await fetchWithAuth(`/api/customers/${id}`, { method: "DELETE" });

    if (response.ok) {
      deleteModal.hide();
      table.ajax.reload();
      showToast('success', 'Deleted', 'Customer deleted successfully!');
      customerToDelete = null;
    } else {
      showToast('error', 'Error', 'Failed to delete customer');
    }
  } catch (error) {
    showToast('error', 'Error', 'Error deleting customer');
  }
}

async function view(id) {
  const res = await fetchWithAuth(`/api/customers/${id}`);
  const data = await res.json();

  const viewContent = `
    <div class="customer-details">
      <div class="detail-row">
        <strong>ID:</strong> <span>${data.id}</span>
      </div>
      <div class="detail-row">
        <strong>First Name:</strong> <span>${data.first_name || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <strong>Last Name:</strong> <span>${data.last_name || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <strong>Email:</strong> <span>${data.email || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <strong>Phone:</strong> <span>${data.phone || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <strong>Address:</strong> <span>${data.address || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <strong>Created At:</strong> <span>${data.created_at ? new Date(data.created_at).toLocaleString() : 'N/A'}</span>
      </div>
    </div>
  `;

  $("#viewModalBody").html(viewContent);
  const viewModal = new bootstrap.Modal(document.getElementById("viewModal"));
  viewModal.show();
}
