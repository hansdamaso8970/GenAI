// --- Data State (Single Source of Truth) ---
let userData = [
  { id: 1, name: "Sarah Connor", role: "UX Designer", activity: 92, status: "Active", tasks: 45, history: [60, 65, 75, 80, 85, 90, 92] },
  { id: 2, name: "John Smith", role: "Frontend Developer", activity: 78, status: "Offline", tasks: 28, history: [80, 85, 85, 82, 80, 78, 78] },
  { id: 3, name: "Emily Chen", role: "Product Manager", activity: 98, status: "Active", tasks: 62, history: [90, 92, 95, 95, 96, 98, 98] },
  { id: 4, name: "Michael Doe", role: "Backend Engineer", activity: 65, status: "Away", tasks: 15, history: [50, 55, 60, 65, 65, 65, 65] },
  { id: 5, name: "Lisa Ray", role: "Data Analyst", activity: 88, status: "Active", tasks: 39, history: [70, 75, 80, 82, 85, 86, 88] },
  { id: 6, name: "David Kim", role: "DevOps Engineer", activity: 95, status: "Active", tasks: 51, history: [85, 88, 90, 92, 92, 94, 95] }
];

// --- DOM Elements ---
const userGrid = document.getElementById('userGrid');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const themeToggleBtn = document.getElementById('themeToggle');

// Modals
const detailModal = document.getElementById('userModal');
const detailModalBody = document.getElementById('modalBody');
const formModal = document.getElementById('formModal');
const memberForm = document.getElementById('memberForm');

let lastFocusedElement;
let currentTheme = 'light';

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderSkeletons();
  
  // Attach Global Listeners
  document.getElementById('addMemberBtn').addEventListener('click', () => openFormModal());
  document.getElementById('closeFormBtn').addEventListener('click', closeFormModal);
  document.getElementById('cancelFormBtn').addEventListener('click', closeFormModal);
  memberForm.addEventListener('submit', handleFormSubmit);
  
  document.getElementById('closeModalBtn').addEventListener('click', closeDetailModal);
  detailModal.addEventListener('click', (e) => { if (e.target === detailModal) closeDetailModal(); });
  formModal.addEventListener('click', (e) => { if (e.target === formModal) closeFormModal(); });
  
  searchInput.addEventListener('input', processData);
  sortSelect.addEventListener('change', processData);

  // Simulate network delay
  setTimeout(() => {
    processData(); // Initial render and sort
  }, 800);
});

// --- Theme Toggle Logic ---
function initTheme() {
  try {
    const savedTheme = localStorage.getItem('dashboard_theme');
    if (savedTheme) currentTheme = savedTheme;
  } catch (error) { /* Ignore */ }
  applyTheme(currentTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const isDark = theme === 'dark';
  themeToggleBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}

themeToggleBtn.addEventListener('click', () => {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(currentTheme);
  try { localStorage.setItem('dashboard_theme', currentTheme); } catch (e) { /* Ignore */ }
});

// --- KPI & Data Processing ---
function calculateKPIs() {
  const totalActive = userData.filter(u => u.status === 'Active').length;
  const avgEff = userData.length ? Math.round(userData.reduce((sum, u) => sum + u.activity, 0) / userData.length) : 0;
  const pending = userData.reduce((sum, u) => sum + u.tasks, 0);

  document.getElementById('kpiActiveValue').textContent = totalActive;
  document.getElementById('kpiEffValue').textContent = avgEff + '%';
  document.getElementById('kpiPendingValue').textContent = pending;
}

function processData() {
  calculateKPIs(); // Ensure KPIs stay updated dynamically
  
  const searchTerm = searchInput.value.toLowerCase().trim();
  const sortBy = sortSelect.value;
  
  let filtered = userData.filter(user => 
    user.name.toLowerCase().includes(searchTerm) || 
    user.role.toLowerCase().includes(searchTerm)
  );
  
  filtered.sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'activity') return b.activity - a.activity; 
    if (sortBy === 'status') {
      const w = { "Active": 1, "Away": 2, "Offline": 3 };
      return w[a.status] - w[b.status];
    }
  });
  
  renderUsers(filtered);
}

// --- Status Color Helper ---
function getStatusColor(status) {
  if (status === 'Active') return 'var(--success-text)';
  if (status === 'Away') return 'var(--warning-text)';
  return 'var(--text-secondary)';
}

// --- Rendering Logic ---
function renderSkeletons() {
  userGrid.innerHTML = Array(6).fill(`
    <article class="user-card" aria-hidden="true">
      <div class="user-profile"><div class="skeleton skeleton-avatar"></div><div style="width: 100%;"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div></div></div>
    </article>
  `).join('');
}

function renderUsers(users) {
  userGrid.innerHTML = '';
  userGrid.setAttribute('aria-busy', 'true');

  if (users.length === 0) {
    userGrid.innerHTML = `
      <div class="empty-state">
        <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <h3>No team members found</h3>
        <p>Try adjusting your search or add a new member.</p>
        <button class="btn-primary" onclick="window.clearSearch()">Clear Search</button>
      </div>`;
    userGrid.setAttribute('aria-busy', 'false');
    return;
  }

  users.forEach((user, index) => {
    const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const statusColor = getStatusColor(user.status);

    const card = document.createElement('article');
    card.className = 'user-card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View details for ${user.name}`);
    card.style.animationDelay = `${index * 30}ms`;

    card.innerHTML = `
      <div class="card-header-flex">
        <div class="user-profile">
          <div class="avatar" aria-hidden="true">${initials}</div>
          <div class="user-info">
            <h4>${user.name}</h4>
            <p>${user.role}</p>
          </div>
        </div>
        <div class="card-actions">
          <button class="action-btn edit-btn" aria-label="Edit ${user.name}" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="action-btn delete-btn" aria-label="Remove ${user.name}" title="Remove">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
      <div class="user-stats">
        <span>Activity: <strong>${user.activity}%</strong></span>
        <select class="status-select" aria-label="Status for ${user.name}" style="color: ${statusColor}">
          <option value="Active" ${user.status === 'Active' ? 'selected' : ''}>Active</option>
          <option value="Away" ${user.status === 'Away' ? 'selected' : ''}>Away</option>
          <option value="Offline" ${user.status === 'Offline' ? 'selected' : ''}>Offline</option>
        </select>
      </div>
      
      <!-- Inline Delete Confirmation -->
      <div class="delete-confirm">
        <p>Remove ${user.name}?</p>
        <div class="delete-actions">
          <button class="btn-secondary cancel-del-btn" aria-label="Cancel removal">Cancel</button>
          <button class="btn-danger confirm-del-btn" aria-label="Confirm removal">Remove</button>
        </div>
      </div>
    `;

    // Base click events for detail modal
    card.addEventListener('click', (e) => {
      // Don't open detail modal if clicking a select or a button inside the card
      if (e.target.tagName.toLowerCase() === 'select' || e.target.closest('button')) return;
      openDetailModal(user, card);
    });
    
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target === card) { e.preventDefault(); openDetailModal(user, card); }
      }
    });

    // Action button events (stopPropagation handles isolating these clicks)
    const editBtn = card.querySelector('.edit-btn');
    editBtn.addEventListener('click', (e) => { e.stopPropagation(); openFormModal(user, editBtn); });

    const deleteBtn = card.querySelector('.delete-btn');
    const deleteOverlay = card.querySelector('.delete-confirm');
    deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteOverlay.classList.add('active'); });
    
    const cancelDelBtn = card.querySelector('.cancel-del-btn');
    cancelDelBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteOverlay.classList.remove('active'); });

    const confirmDelBtn = card.querySelector('.confirm-del-btn');
    confirmDelBtn.addEventListener('click', (e) => { 
      e.stopPropagation(); 
      card.classList.add('removing');
      setTimeout(() => {
        userData = userData.filter(u => u.id !== user.id);
        processData(); // Recalculates KPIs and Re-renders grid
      }, 200); // Matches CSS transition duration
    });

    // Interactive Status Dropdown Handler
    const statusSelect = card.querySelector('.status-select');
    statusSelect.addEventListener('change', (e) => {
      e.stopPropagation();
      user.status = e.target.value;
      e.target.style.color = getStatusColor(user.status);
      calculateKPIs(); // Instantly update top KPI headers
    });

    userGrid.appendChild(card);
  });
  
  userGrid.setAttribute('aria-busy', 'false');
}

window.clearSearch = () => {
  searchInput.value = '';
  processData();
  searchInput.focus();
};

// --- Sparkline Generator (SVG) ---
function generateSparkline(historyArray) {
  const width = 200; const height = 40;
  if (!historyArray || historyArray.length === 0) return '';
  
  const step = width / (historyArray.length - 1);
  const points = historyArray.map((val, i) => {
    const x = i * step;
    // Map 0-100 to svg height (inverted Y axis)
    const y = height - ((val / 100) * height);
    return `${x},${y}`;
  }).join(' ');

  return `
    <svg viewBox="0 0 ${width} ${height}" class="sparkline-svg" preserveAspectRatio="none" aria-label="7-day activity sparkline">
      <polyline points="${points}" fill="none" stroke="var(--primary-color)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

// --- CRUD Form Modal Flow ---
function openFormModal(user = null, triggerEl = null) {
  lastFocusedElement = triggerEl || document.getElementById('addMemberBtn');
  document.getElementById('nameError').textContent = '';
  document.getElementById('roleError').textContent = '';
  document.getElementById('activityError').textContent = '';
  
  if (user) {
    document.getElementById('formTitle').textContent = 'Edit Member';
    document.getElementById('formUserId').value = user.id;
    document.getElementById('formName').value = user.name;
    document.getElementById('formRole').value = user.role;
    document.getElementById('formActivity').value = user.activity;
    document.getElementById('formStatus').value = user.status;
  } else {
    document.getElementById('formTitle').textContent = 'Add Member';
    memberForm.reset();
    document.getElementById('formUserId').value = '';
    document.getElementById('formStatus').value = 'Active'; // Default
  }
  
  formModal.hidden = false;
  setTimeout(() => { formModal.classList.add('active'); }, 10);
  document.getElementById('formName').focus();
  document.addEventListener('keydown', trapModalFocus);
}

function closeFormModal() {
  formModal.classList.remove('active');
  setTimeout(() => { 
    formModal.hidden = true; 
    if (lastFocusedElement) lastFocusedElement.focus();
  }, 250);
  document.removeEventListener('keydown', trapModalFocus);
}

function handleFormSubmit(e) {
  e.preventDefault();
  let isValid = true;
  
  const id = document.getElementById('formUserId').value;
  const name = document.getElementById('formName').value.trim();
  const role = document.getElementById('formRole').value.trim();
  const activity = parseInt(document.getElementById('formActivity').value, 10);
  const status = document.getElementById('formStatus').value;
  
  // Validation
  if (!name) { document.getElementById('nameError').textContent = 'Name is required.'; isValid = false; } 
  else { document.getElementById('nameError').textContent = ''; }
  
  if (!role) { document.getElementById('roleError').textContent = 'Role is required.'; isValid = false; } 
  else { document.getElementById('roleError').textContent = ''; }
  
  if (isNaN(activity) || activity < 0 || activity > 100) { document.getElementById('activityError').textContent = 'Activity must be between 0 and 100.'; isValid = false; } 
  else { document.getElementById('activityError').textContent = ''; }
  
  if (!isValid) return;

  if (id) {
    // Edit Existing
    const userIndex = userData.findIndex(u => u.id == id);
    if (userIndex > -1) {
      userData[userIndex].name = name;
      userData[userIndex].role = role;
      userData[userIndex].activity = activity;
      userData[userIndex].status = status;
      // Push new activity to history simulating new data point
      userData[userIndex].history.shift();
      userData[userIndex].history.push(activity);
    }
  } else {
    // Add New
    const newId = userData.length > 0 ? Math.max(...userData.map(u => u.id)) + 1 : 1;
    userData.push({
      id: newId, name, role, activity, status, tasks: 0,
      history: [activity, activity, activity, activity, activity, activity, activity] // Default flatline history
    });
  }
  
  closeFormModal();
  processData(); // Recalculates KPIs and updates grid
}

// --- Detail Modal Flow ---
function openDetailModal(user, triggerElement) {
  lastFocusedElement = triggerElement; 
  const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const sparklineHtml = generateSparkline(user.history);
  
  detailModalBody.innerHTML = `
    <div class="modal-avatar">${initials}</div>
    <div class="modal-info">
      <h3>${user.name}</h3>
      <p>${user.role}</p>
      <select class="status-select" id="modalStatusSelect" aria-label="Update status" style="color: ${getStatusColor(user.status)}">
        <option value="Active" ${user.status === 'Active' ? 'selected' : ''}>Active</option>
        <option value="Away" ${user.status === 'Away' ? 'selected' : ''}>Away</option>
        <option value="Offline" ${user.status === 'Offline' ? 'selected' : ''}>Offline</option>
      </select>
    </div>
    <div class="modal-stats-grid">
      <div class="stat-box"><span>Activity</span><strong>${user.activity}%</strong></div>
      <div class="stat-box"><span>Tasks Done</span><strong>${user.tasks}</strong></div>
      <div class="stat-box" style="grid-column: span 2;">
        <span>7-Day Activity Trend</span>
        <div class="sparkline-container">${sparklineHtml}</div>
      </div>
    </div>
  `;
  
  // Interactive Status inside Modal
  document.getElementById('modalStatusSelect').addEventListener('change', (e) => {
    user.status = e.target.value;
    e.target.style.color = getStatusColor(user.status);
    calculateKPIs();
    renderUsers(userData); // Keep background grid strictly in sync
  });

  detailModal.hidden = false;
  setTimeout(() => { detailModal.classList.add('active'); }, 10);
  document.getElementById('closeModalBtn').focus();
  document.addEventListener('keydown', trapModalFocus);
}

function closeDetailModal() {
  detailModal.classList.remove('active');
  setTimeout(() => {
    detailModal.hidden = true;
    if (lastFocusedElement) lastFocusedElement.focus(); 
  }, 250);
  document.removeEventListener('keydown', trapModalFocus);
}

// --- Global Focus Trap (Handles whichever modal is active) ---
function trapModalFocus(e) {
  const activeModal = formModal.classList.contains('active') ? formModal : (detailModal.classList.contains('active') ? detailModal : null);
  if (!activeModal) return;

  if (e.key === 'Escape') {
    if (activeModal === formModal) closeFormModal();
    else closeDetailModal();
    return;
  }
  
  if (e.key === 'Tab') {
    const focusable = activeModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;
    
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}