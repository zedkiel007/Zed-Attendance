// Global Variables
let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let startBtn = document.getElementById('startBtn');
let stopBtn = document.getElementById('stopBtn');
let result = document.getElementById('result');
let stream = null;
let scanning = false;

// API Base URL
const API_URL = 'http://localhost:3000/api';
const qrContainer = document.getElementById('qrContainer');
const salaryEmployeeSelect = document.getElementById('salaryEmployee');
const reportPeriodSelect = document.getElementById('reportPeriod');
const salaryStartDateInput = document.getElementById('salaryStartDate');
const salaryEndDateInput = document.getElementById('salaryEndDate');
const dailyRateInput = document.getElementById('dailyRate');
const otRateInput = document.getElementById('otRate');
const salaryBody = document.getElementById('salaryBody');
const currentEmployeeIdInput = document.getElementById('currentEmployeeId');
const employeeStatusInput = document.getElementById('employeeStatus');
const registerSubmitBtn = document.getElementById('registerSubmitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const clockDisplay = document.getElementById('clockDisplay');
let editMode = false;

// Global click handler for dynamic buttons
document.addEventListener('click', async (e) => {
  const target = e.target.closest('button');
  if (!target) return;

  if (target.matches('.create-qrcode')) {
    const employeeId = target.dataset.employeeId;
    createQrCode(employeeId);
    return;
  }

  if (target.matches('.edit-employee')) {
    const employeeId = target.dataset.employeeId;
    await editEmployee(employeeId);
    return;
  }

  if (target.matches('.fire-employee')) {
    const employeeId = target.dataset.employeeId;
    await fireEmployee(employeeId);
    return;
  }

  if (target.matches('.delete-employee')) {
    const employeeId = target.dataset.employeeId;
    if (confirm('Delete this employee? This will remove their record permanently.')) {
      await deleteEmployee(employeeId);
    }
    return;
  }

  if (target.matches('.delete-history')) {
    const ids = target.dataset.ids ? target.dataset.ids.split(',').filter(Boolean) : [];
    await deleteHistoryRecords(ids);
    return;
  }
});

// ===== Tab Navigation =====
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    // Remove active class from all buttons and tabs
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('active'));

    // Add active class to clicked button and corresponding tab
    e.target.classList.add('active');
    const tabId = e.target.dataset.tab;
    document.getElementById(tabId).classList.add('active');

    // Load data when tabs are opened
    if (tabId === 'summary') {
      loadSummary();
    } else if (tabId === 'history') {
      loadHistory();
    } else if (tabId === 'register') {
      loadEmployeeList();
    }
  });
});

// ===== QR Scanner Functions =====

// Start Camera
startBtn.addEventListener('click', startCamera);

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });

    video.srcObject = stream;
    video.setAttribute('playsinline', true); // For iOS
    video.play();

    scanning = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;

    // Start scanning
    scanQRCode();

    showNotification('Camera started', 'success');
  } catch (err) {
    showNotification('Camera access denied: ' + err.message, 'error');
  }
}

// Stop Camera
stopBtn.addEventListener('click', stopCamera);

function stopCamera() {
  scanning = false;

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  video.srcObject = null;
  startBtn.disabled = false;
  stopBtn.disabled = true;

  showNotification('Camera stopped', 'success');
}

// Scan QR Code
function scanQRCode() {
  if (!scanning) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

  if (qrCode) {
    const qrData = qrCode.data;
    handleQRCode(qrData);
  }

  requestAnimationFrame(scanQRCode);
}

// Handle QR Code Data
async function handleQRCode(qrData) {
  scanning = false;
  stopCamera();

  // Parse QR data (assuming format: EMPLOYEEID or JSON)
  let employeeId = qrData;

  try {
    const data = JSON.parse(qrData);
    employeeId = data.employeeId || qrData;
  } catch (e) {
    // Not JSON, use as is
  }

  // Record attendance
  await recordAttendance(employeeId, 'in');
}

// ===== Manual Entry =====
document.getElementById('manualSubmitBtn').addEventListener('click', async () => {
  const employeeId = document.getElementById('manualEmployeeId').value.trim();
  const type = document.getElementById('manualType').value;

  if (!employeeId) {
    showNotification('Please enter Employee ID', 'error');
    return;
  }

  await recordAttendance(employeeId, type);
  document.getElementById('manualEmployeeId').value = '';
});

// ===== Record Attendance =====
async function recordAttendance(employeeId, type) {
  try {
    const response = await fetch(`${API_URL}/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        employeeId: employeeId,
        type: type
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to record attendance');
    }

    const data = await response.json();

    // Update UI
    result.textContent = `✅ ${data.message}\nEmployee: ${data.record.employeeName}\n${new Date().toLocaleTimeString()}`;
    result.classList.remove('error');
    result.classList.add('success');

    showNotification(`Time ${type} recorded for ${data.record.employeeName}`, 'success');

    // Auto-start camera again after 3 seconds
    setTimeout(() => {
      result.textContent = 'Waiting for QR code...';
      result.classList.remove('success', 'error');
      startCamera();
    }, 3000);

  } catch (err) {
    result.textContent = `❌ Error: ${err.message}`;
    result.classList.remove('success');
    result.classList.add('error');

    showNotification(err.message, 'error');

    // Auto-start camera again after 3 seconds
    setTimeout(() => {
      result.textContent = 'Waiting for QR code...';
      result.classList.remove('success', 'error');
      startCamera();
    }, 3000);
  }
}

// ===== Employee Registration =====
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const employeeId = document.getElementById('employeeId').value.trim();
  const employeeName = document.getElementById('employeeName').value.trim();
  const department = document.getElementById('department').value.trim();
  const status = employeeStatusInput.value;
  const currentEmployeeId = currentEmployeeIdInput.value;

  if (!employeeId || !employeeName) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }

  try {
    let response;
    if (editMode && currentEmployeeId) {
      response = await fetch(`${API_URL}/employees/${currentEmployeeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeId,
          name: employeeName,
          department: department || 'General',
          status
        })
      });
    } else {
      response = await fetch(`${API_URL}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeId,
          name: employeeName,
          department: department || 'General',
          status
        })
      });
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save employee');
    }

    const data = await response.json();
    const messageDiv = document.getElementById('registerMessage');
    messageDiv.textContent = data.message;
    messageDiv.classList.remove('error');
    messageDiv.classList.add('success');

    resetEmployeeForm();
    await loadEmployeeList();
    showNotification(editMode ? 'Employee updated successfully' : 'Employee registered successfully', 'success');
  } catch (err) {
    const messageDiv = document.getElementById('registerMessage');
    messageDiv.textContent = `Error: ${err.message}`;
    messageDiv.classList.remove('success');
    messageDiv.classList.add('error');

    showNotification(err.message, 'error');
  }
});

cancelEditBtn.addEventListener('click', () => {
  resetEmployeeForm();
});

function resetEmployeeForm() {
  editMode = false;
  currentEmployeeIdInput.value = '';
  document.getElementById('registerForm').reset();
  employeeStatusInput.value = 'Active';
  registerSubmitBtn.textContent = 'Register Employee';
  cancelEditBtn.style.display = 'none';
}

async function editEmployee(employeeId) {
  try {
    const response = await fetch(`${API_URL}/employees`);
    const employees = await response.json();
    const employee = employees.find(emp => emp.employeeId === employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    editMode = true;
    currentEmployeeIdInput.value = employee.employeeId;
    document.getElementById('employeeId').value = employee.employeeId;
    document.getElementById('employeeName').value = employee.name;
    document.getElementById('department').value = employee.department;
    employeeStatusInput.value = employee.status || 'Active';
    registerSubmitBtn.textContent = 'Update Employee';
    cancelEditBtn.style.display = 'inline-block';

    document.querySelector('.nav-btn[data-tab="register"]').click();
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

async function fireEmployee(employeeId) {
  try {
    const response = await fetch(`${API_URL}/employees/${employeeId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'Fired' })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update employee status');
    }

    await loadEmployeeList();
    showNotification('Employee marked as fired', 'success');
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

async function deleteEmployee(employeeId) {
  try {
    const response = await fetch(`${API_URL}/employees/${employeeId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete employee');
    }

    await loadEmployeeList();
    showNotification('Employee deleted successfully', 'success');
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

function getSelectedHistoryIds() {
  const checkedBoxes = document.querySelectorAll('.history-select:checked');
  const ids = [];
  checkedBoxes.forEach(box => {
    const boxIds = box.value.split(',').filter(Boolean);
    boxIds.forEach(id => {
      if (!ids.includes(id)) ids.push(id);
    });
  });
  return ids;
}

async function deleteHistoryRecords(ids) {
  if (!ids || ids.length === 0) {
    showNotification('Please select at least one record to delete.', 'error');
    return;
  }

  if (!confirm('Are you sure you want to delete the selected attendance record(s)? This cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/attendance?ids=${encodeURIComponent(ids.join(','))}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete attendance records');
    }

    await loadHistory();
    showNotification('Selected attendance records deleted.', 'success');
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

async function deleteAllHistoryRecords() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  if (!startDate || !endDate) {
    showNotification('Please select both start and end dates before deleting all history records.', 'error');
    return;
  }

  if (!confirm('Are you sure you want to delete all attendance records in the current date range? This will remove all matching daily records.')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/attendance?startDate=${startDate}&endDate=${endDate}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete attendance records');
    }

    await loadHistory();
    showNotification('All attendance records in range deleted.', 'success');
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

// Load Employee List
async function loadEmployeeList() {
  try {
    const response = await fetch(`${API_URL}/employees`);
    const employees = await response.json();

    const employeeList = document.getElementById('employeeList');

    if (employees.length === 0) {
      employeeList.innerHTML = '<p>No employees registered yet</p>';
      qrContainer.innerHTML = '';
      return;
    }

    employeeList.innerHTML = employees.map(emp => `
      <div class="employee-card ${emp.status === 'Fired' ? 'fired-employee' : ''}">
        <h4>${emp.name}</h4>
        <p><strong>ID:</strong> ${emp.employeeId}</p>
        <p><strong>Department:</strong> ${emp.department}</p>
        <p><strong>Status:</strong> ${emp.status || 'Active'}</p>
        <div class="button-row">
          <button class="btn btn-secondary create-qrcode" data-employee-id="${emp.employeeId}">Create QR</button>
          <button class="btn btn-primary edit-employee" data-employee-id="${emp.employeeId}">Edit</button>
          <button class="btn btn-warning fire-employee" data-employee-id="${emp.employeeId}">Fire</button>
          <button class="btn btn-danger delete-employee" data-employee-id="${emp.employeeId}">Delete</button>
        </div>
      </div>
    `).join('');

    qrContainer.innerHTML = '';
    populateSalaryEmployeeOptions(employees);
  } catch (err) {
    showNotification('Failed to load employees: ' + err.message, 'error');
  }
}

function populateSalaryEmployeeOptions(employees) {
  if (!salaryEmployeeSelect) return;
  salaryEmployeeSelect.innerHTML = '<option value="all">All Employees</option>' + employees.map(emp => `
    <option value="${emp.employeeId}">${emp.name} (${emp.employeeId})</option>
  `).join('');
}

function updateClock() {
  if (!clockDisplay) return;
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateText = now.toLocaleDateString('en-US', options);
  const timeText = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  clockDisplay.textContent = `${dateText} · ${timeText}`;
}

function getSalaryDateRange(period) {
  const today = new Date();
  let start, end;

  if (period === 'weekly') {
    const day = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((day + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    start = monday;
    end = sunday;
  } else if (period === 'monthly') {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
    end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  } else {
    if (!salaryStartDateInput.value || !salaryEndDateInput.value) {
      return null;
    }
    start = new Date(salaryStartDateInput.value);
    end = new Date(salaryEndDateInput.value);
  }

  const pad = num => num.toString().padStart(2, '0');
  return [
    `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`
  ];
}

async function loadSalaryReport() {
  try {
    const period = reportPeriodSelect.value;
    const range = getSalaryDateRange(period);
    if (!range) {
      showNotification('Please select start and end dates for custom range', 'error');
      return;
    }

    const [startDate, endDate] = range;
    const employeeId = salaryEmployeeSelect.value || 'all';
    const dailyRate = Number(dailyRateInput.value) || 0;
    const otRate = Number(otRateInput.value) || 0;

    const response = await fetch(`${API_URL}/attendance/salary-report?startDate=${startDate}&endDate=${endDate}&employeeId=${employeeId}&dailyRate=${dailyRate}&otRate=${otRate}`);
    const report = await response.json();

    if (!response.ok) {
      throw new Error(report.error || 'Failed to load salary report');
    }

    if (!report.length) {
      salaryBody.innerHTML = '<tr><td colspan="8">No attendance data for this period</td></tr>';
      return;
    }

    salaryBody.innerHTML = report.map(row => `
      <tr>
        <td>${row.employeeId}</td>
        <td>${row.employeeName}</td>
        <td>${row.daysPresent}</td>
        <td>${row.totalHours.toFixed(2)}</td>
        <td>${row.totalOvertime.toFixed(2)}</td>
        <td>${row.dailyRate.toFixed(2)}</td>
        <td>${row.otRate.toFixed(2)}</td>
        <td>${row.totalSalary.toFixed(2)}</td>
      </tr>
    `).join('');
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

function printSalaryReport() {
  window.print();
}

async function createQrCode(employeeId) {
  try {
    const response = await fetch(`${API_URL}/employees`);
    const employees = await response.json();
    const employee = employees.find(emp => emp.employeeId === employeeId);

    if (!employee) {
      throw new Error('Employee not found');
    }

    const qrData = JSON.stringify({
      employeeId: employee.employeeId,
      name: employee.name,
      department: employee.department
    });

    QRCode.toDataURL(qrData, { width: 240 }, (err, url) => {
      if (err) {
        showNotification('Failed to generate QR code', 'error');
        return;
      }

      qrContainer.innerHTML = `
        <div class="qr-card">
          <h3>QR Code for ${employee.name}</h3>
          <img src="${url}" alt="QR code for ${employee.name}" />
          <p><strong>ID:</strong> ${employee.employeeId}</p>
          <p><strong>Department:</strong> ${employee.department}</p>
        </div>
      `;
    });
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

// ===== Daily Summary =====
document.getElementById('refreshSummaryBtn').addEventListener('click', loadSummary);

async function loadSummary() {
  try {
    const response = await fetch(`${API_URL}/attendance/summary`);
    const summary = await response.json();

    const tbody = document.getElementById('summaryBody');

    if (summary.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9">No attendance records for today</td></tr>';
      return;
    }

    tbody.innerHTML = summary.map(record => `
      <tr>
        <td>${record.employeeId}</td>
        <td>${record.employeeName}</td>
        <td>${record.department}</td>
        <td>${record.timeIn || '-'}</td>
        <td>${record.timeOut || '-'}</td>
        <td>${record.duration || '-'}</td>
        <td>${record.overtime ? record.overtime.toFixed(2) + 'h' : '-'}</td>
        <td><span class="status-badge ${record.statusClass}">${record.status}</span></td>
      </tr>
    `).join('');

  } catch (err) {
    showNotification('Failed to load summary: ' + err.message, 'error');
  }
}

// Export Today's Report
document.getElementById('exportTodayBtn').addEventListener('click', () => {
  const today = new Date().toISOString().split('T')[0];
  downloadReport(today, today);
});

// ===== Attendance History =====
document.getElementById('filterBtn').addEventListener('click', loadHistory);

async function loadHistory() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  if (!startDate || !endDate) {
    showNotification('Please select both start and end dates', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/attendance/range?startDate=${startDate}&endDate=${endDate}`);
    const records = await response.json();

    const tbody = document.getElementById('historyBody');

    if (records.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8">No records found for this date range</td></tr>';
      return;
    }

    tbody.innerHTML = records.map(record => `
      <tr>
        <td><input type="checkbox" class="history-select" value="${record.ids.join(',')}"></td>
        <td>${record.employeeId}</td>
        <td>${record.employeeName}</td>
        <td>${record.department}</td>
        <td>${record.timeIn}</td>
        <td>${record.timeOut}</td>
        <td>${record.duration}</td>
        <td><button class="btn btn-danger delete-history" data-ids="${record.ids.join(',')}">Delete</button></td>
      </tr>
    `).join('');

  } catch (err) {
    showNotification('Failed to load history: ' + err.message, 'error');
  }
}

// Export Report
document.getElementById('exportBtn').addEventListener('click', () => {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  if (!startDate || !endDate) {
    showNotification('Please select both start and end dates', 'error');
    return;
  }

  downloadReport(startDate, endDate);
});

document.getElementById('deleteSelectedBtn').addEventListener('click', async () => {
  const ids = getSelectedHistoryIds();
  await deleteHistoryRecords(ids);
});

document.getElementById('deleteAllHistoryBtn').addEventListener('click', deleteAllHistoryRecords);

document.getElementById('loadSalaryBtn').addEventListener('click', loadSalaryReport);
document.getElementById('printSalaryBtn').addEventListener('click', printSalaryReport);

document.getElementById('reportPeriod').addEventListener('change', () => {
  const period = reportPeriodSelect.value;
  if (period !== 'custom') {
    const range = getSalaryDateRange(period);
    if (range) {
      salaryStartDateInput.value = range[0];
      salaryEndDateInput.value = range[1];
    }
  }
});

// Download Report
function downloadReport(startDate, endDate) {
  const url = `${API_URL}/attendance/export?startDate=${startDate}&endDate=${endDate}`;
  window.location.href = url;
  showNotification('Report downloading...', 'success');
}

// ===== Utility Functions =====

// Show Notification
function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = `notification show ${type}`;

  setTimeout(() => {
    notification.classList.remove('show');
  }, 4000);
}

// Initialize on page load
window.addEventListener('load', () => {
  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  }

  // PWA Install Prompt
  let deferredPrompt;
  const installBtn = document.createElement('button');
  installBtn.id = 'installBtn';
  installBtn.className = 'btn btn-success';
  installBtn.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 1000; display: none;';
  installBtn.textContent = '📱 Install App';
  document.body.appendChild(installBtn);

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'block';
  });

  installBtn.addEventListener('click', () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        deferredPrompt = null;
        installBtn.style.display = 'none';
      });
    }
  });

  // Set default dates for history filter
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  document.getElementById('startDate').valueAsDate = yesterday;
  document.getElementById('endDate').valueAsDate = today;

  if (reportPeriodSelect) {
    reportPeriodSelect.value = 'weekly';
    const range = getSalaryDateRange('weekly');
    if (range) {
      salaryStartDateInput.value = range[0];
      salaryEndDateInput.value = range[1];
    }
  }

  // Load initial data
  loadEmployeeList();
  loadSummary();
  updateClock();
  setInterval(updateClock, 1000);

  showNotification('Welcome to Digital Attendance System', 'success');
});

// Prevent accidental page exit while scanning
window.addEventListener('beforeunload', (e) => {
  if (scanning) {
    e.preventDefault();
    e.returnValue = '';
  }
});
