/**
 * PAPAIA Dashboard - Frontend Application
 */

// ==========================================
// Navigation
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initAnimations();
});

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = item.dataset.page;

      // Update active nav item
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Show corresponding page
      pages.forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active');
      });

      const targetPage = document.getElementById(`page-${pageId}`);
      if (targetPage) {
        targetPage.style.display = 'block';
        targetPage.classList.add('active');

        // Re-trigger animations
        const animatedElements = targetPage.querySelectorAll('.animate-in');
        animatedElements.forEach(el => {
          el.style.animation = 'none';
          el.offsetHeight; // Trigger reflow
          el.style.animation = null;
        });
      }
    });
  });
}

function initAnimations() {
  // Intersection Observer for scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.stat-card, .captures-section').forEach(el => {
    observer.observe(el);
  });
}

// ==========================================
// Mock Data (replace with real API calls)
// ==========================================

const mockCaptures = [
  {
    id: '1',
    title: 'Departamento 3D 2B',
    location: 'Providencia',
    price: 4500,
    currency: 'UF',
    status: 'pending',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000),
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100&h=100&fit=crop'
  },
  {
    id: '2',
    title: 'Casa 4D 3B con jardín',
    location: 'Las Condes',
    price: 12000,
    currency: 'UF',
    status: 'pending',
    date: new Date(Date.now() - 5 * 60 * 60 * 1000),
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=100&h=100&fit=crop'
  },
  {
    id: '3',
    title: 'Oficina 80m²',
    location: 'Vitacura',
    price: 6200,
    currency: 'UF',
    status: 'published',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=100&h=100&fit=crop'
  }
];

// ==========================================
// API Functions (to be connected to backend)
// ==========================================

const API_BASE = '/api';

async function fetchCaptures() {
  try {
    const response = await fetch(`${API_BASE}/captaciones`);
    if (!response.ok) throw new Error('Failed to fetch captures');
    const result = await response.json();

    // Transform backend captaciones to frontend format
    return (result.data || []).map(c => ({
      id: c.id,
      title: c.datosExtraidos?.descripcion_raw || `Captación de ${c.telefono}`,
      location: c.datosExtraidos?.direccion?.comuna || 'Sin ubicación',
      price: c.datosExtraidos?.precio?.valor || 0,
      currency: c.datosExtraidos?.precio?.moneda || 'CLP',
      status: mapEstado(c.estado),
      date: new Date(c.updatedAt),
      phone: c.telefono
    }));
  } catch (error) {
    console.warn('Using mock data:', error.message);
    return mockCaptures;
  }
}

function mapEstado(estado) {
  const map = {
    'inicio': 'draft',
    'recibiendo_datos': 'draft',
    'procesando_audio': 'draft',
    'procesando_fotos': 'draft',
    'validando': 'pending',
    'listo_para_publicar': 'pending',
    'esperando_aprobacion': 'pending',
    'publicando': 'approved',
    'completado': 'published',
    'error': 'draft'
  };
  return map[estado] || 'draft';
}

// Load captaciones on page load
async function loadCaptaciones() {
  const captures = await fetchCaptures();
  console.log('📊 Captaciones cargadas:', captures.length);
  updateStatsUI(captures);
}

function updateStatsUI(captures) {
  const totalEl = document.querySelector('.stat-card:nth-child(1) .stat-value');
  if (totalEl) totalEl.textContent = captures.length;

  const pendingCount = captures.filter(c => c.status === 'pending').length;
  const pendingEl = document.querySelector('.stat-card:nth-child(2) .stat-value');
  if (pendingEl) pendingEl.textContent = pendingCount;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadCaptaciones();
  // Refresh every 30 seconds
  setInterval(loadCaptaciones, 30000);
});

async function approveCapture(captureId) {
  try {
    const response = await fetch(`${API_BASE}/captures/${captureId}/approve`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to approve');

    showNotification('✅ Propiedad aprobada y publicada');
    return await response.json();
  } catch (error) {
    console.error('Error approving:', error);
    showNotification('❌ Error al aprobar', 'error');
    throw error;
  }
}

// ==========================================
// UI Helpers
// ==========================================

function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
  if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  return 'Hace un momento';
}

function getStatusBadge(status) {
  const badges = {
    pending: { label: 'Por aprobar', class: 'pending' },
    approved: { label: 'Aprobada', class: 'approved' },
    published: { label: 'Publicada', class: 'published' },
    draft: { label: 'Borrador', class: 'draft' }
  };

  const badge = badges[status] || badges.draft;
  return `<span class="status-badge ${badge.class}"><span class="status-dot"></span>${badge.label}</span>`;
}

function showNotification(message, type = 'success') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${type === 'success' ? 'var(--color-success)' : 'var(--color-error)'};
    color: white;
    padding: 12px 24px;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    animation: fadeIn 0.3s ease;
    z-index: 1000;
  `;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'fadeIn 0.3s ease reverse';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ==========================================
// Event Handlers
// ==========================================

// Handle approve button clicks
document.addEventListener('click', async (e) => {
  const approveBtn = e.target.closest('[title="Aprobar"]');
  if (approveBtn) {
    const row = approveBtn.closest('tr');
    const captureId = row?.dataset?.id || '1';

    try {
      approveBtn.disabled = true;
      approveBtn.textContent = '⏳';

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      showNotification('✅ ¡Propiedad aprobada y publicada!');

      // Update UI
      const statusBadge = row.querySelector('.status-badge');
      if (statusBadge) {
        statusBadge.className = 'status-badge published';
        statusBadge.innerHTML = '<span class="status-dot"></span>Publicada';
      }

      approveBtn.remove();

    } catch (error) {
      approveBtn.disabled = false;
      approveBtn.textContent = '✓';
    }
  }
});

// ==========================================
// Real-time Updates (WebSocket stub)
// ==========================================

function connectWebSocket() {
  // TODO: Connect to real WebSocket for live updates
  console.log('🔌 WebSocket connection would be established here');

  // Simulate incoming capture notification
  setTimeout(() => {
    showNotification('📱 Nueva captación recibida vía WhatsApp');
  }, 5000);
}

// Initialize WebSocket connection
// connectWebSocket();

console.log('🍈 PAPAIA Dashboard loaded');
