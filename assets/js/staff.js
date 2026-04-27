const orders = [
  {
    id: "ORD-001",
    student: "Juan Dela Cruz",
    service: "Printing",
    total: 120,
    payment: "GCash",
    reference: "100123456789",
    status: "Pending"
  },
  {
    id: "ORD-002",
    student: "Maria Santos",
    service: "Mug Printing",
    total: 250,
    payment: "Cash",
    reference: "N/A",
    status: "Processing"
  },
  {
    id: "ORD-003",
    student: "Carlo Reyes",
    service: "Binding",
    total: 150,
    payment: "GCash",
    reference: "100987654321",
    status: "Ready"
  },
  {
    id: "ORD-004",
    student: "Ana Cruz",
    service: "Lanyard",
    total: 230,
    payment: "GCash",
    reference: "100555888999",
    status: "Completed"
  }
];

const accounts = [
  {
    name: "Juan Dela Cruz",
    email: "juan@wmsu.edu.ph",
    college: "College of Engineering",
    status: "Verified"
  },
  {
    name: "Maria Santos",
    email: "maria@wmsu.edu.ph",
    college: "College of Education",
    status: "Verified"
  },
  {
    name: "Carlo Reyes",
    email: "carlo@wmsu.edu.ph",
    college: "College of Arts and Sciences",
    status: "Pending"
  }
];

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (email === "" || password === "") {
    alert("Please enter email and password.");
    return;
  }

  document.getElementById("login-page").style.display = "none";
  document.getElementById("admin-page").style.display = "flex";

  updateDashboard();
  renderOrders();
  renderPayments();
  renderAccounts();
  renderReports();
}

function logout() {
  document.getElementById("login-page").style.display = "flex";
  document.getElementById("admin-page").style.display = "none";
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  document.getElementById(pageId).classList.add("active");

  document.querySelectorAll(".sidebar button").forEach(button => {
    button.classList.remove("active");
  });

  event.target.classList.add("active");
}

function updateDashboard() {
  const completedOrders = orders.filter(order => order.status === "Completed");
  const totalIncome = completedOrders.reduce((sum, order) => sum + order.total, 0);

  document.getElementById("total-orders").textContent = orders.length;
  document.getElementById("total-income").textContent = `₱${totalIncome.toFixed(2)}`;
  document.getElementById("today-orders").textContent = orders.length;
  document.getElementById("today-income").textContent = `₱${totalIncome.toFixed(2)}`;

  document.getElementById("pending-count").textContent =
    orders.filter(order => order.status === "Pending").length;

  document.getElementById("processing-count").textContent =
    orders.filter(order => order.status === "Processing").length;

  document.getElementById("ready-count").textContent =
    orders.filter(order => order.status === "Ready").length;

  document.getElementById("completed-count").textContent =
    orders.filter(order => order.status === "Completed").length;
}

function renderOrders() {
  const table = document.getElementById("orders-table");

  table.innerHTML = orders.map(order => `
    <tr>
      <td>${order.id}</td>
      <td>${order.student}</td>
      <td>${order.service}</td>
      <td>₱${order.total.toFixed(2)}</td>
      <td>${order.payment}</td>
      <td><span class="status ${order.status}">${order.status}</span></td>
      <td>
        <select onchange="changeStatus('${order.id}', this.value)">
          <option ${order.status === "Pending" ? "selected" : ""}>Pending</option>
          <option ${order.status === "Processing" ? "selected" : ""}>Processing</option>
          <option ${order.status === "Ready" ? "selected" : ""}>Ready</option>
          <option ${order.status === "Completed" ? "selected" : ""}>Completed</option>
        </select>
      </td>
    </tr>
  `).join("");
}

function changeStatus(orderId, newStatus) {
  const order = orders.find(item => item.id === orderId);

  if (order) {
    order.status = newStatus;
    updateDashboard();
    renderOrders();
    renderPayments();
    renderReports();
  }
}

function renderPayments() {
  const table = document.getElementById("payments-table");

  table.innerHTML = orders.map(order => `
    <tr>
      <td>${order.id}</td>
      <td>${order.student}</td>
      <td>₱${order.total.toFixed(2)}</td>
      <td>${order.reference}</td>
      <td><span class="status ${order.status}">${order.status}</span></td>
    </tr>
  `).join("");
}

function renderAccounts() {
  const table = document.getElementById("accounts-table");

  table.innerHTML = accounts.map(account => `
    <tr>
      <td>${account.name}</td>
      <td>${account.email}</td>
      <td>${account.college}</td>
      <td>${account.status}</td>
    </tr>
  `).join("");
}

function renderReports() {
  const completedOrders = orders.filter(order => order.status === "Completed");
  const totalIncome = completedOrders.reduce((sum, order) => sum + order.total, 0);

  document.getElementById("report-income").textContent = `₱${totalIncome.toFixed(2)}`;
  document.getElementById("report-completed").textContent = completedOrders.length;
}




const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const username = document.getElementById("staff-username").value.trim();
    const password = document.getElementById("staff-password").value;

    if (!username || !password) {
      alert("Please fill in all fields.");
      return;
    }

    if (username === "staff" && password === "staff123") {
      alert("Login successful!");
      window.location.href = "staff-dashboard.html";
    } else {
      alert("Invalid credentials.");
    }
  });
}

const navLinks = document.querySelectorAll('.nav-link[data-page]');
const pages    = document.querySelectorAll('.staff-page');

navLinks.forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    const target = this.dataset.page;

    navLinks.forEach(l => l.classList.remove('active'));
    this.classList.add('active');

    pages.forEach(page => {
      page.classList.toggle('active', page.id === 'page-' + target);
    });
  });
});

function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function setModalOpen(isOpen) {
  const modal = document.getElementById('staffModal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
}

function openStaffModal(title, bodyHtml) {
  const titleEl = document.getElementById('staffModalTitle');
  const bodyEl = document.getElementById('staffModalBody');
  if (!titleEl || !bodyEl) return;
  titleEl.textContent = title;
  bodyEl.innerHTML = bodyHtml;
  setModalOpen(true);
}

function closeStaffModal() {
  setModalOpen(false);
}

function activateStaffPage(pageKey) {
  const targetId = 'page-' + pageKey;

  document.querySelectorAll('.staff-page').forEach(page => {
    page.classList.toggle('active', page.id === targetId);
  });

  const link = document.querySelector(`.nav-link[data-page="${pageKey}"]`);
  if (link) {
    document.querySelectorAll('.nav-link[data-page]').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  }

  const page = document.getElementById(targetId);
  if (page) page.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getOrderFromRow(tr) {
  const tds = tr ? Array.from(tr.querySelectorAll('td')) : [];
  const status = tr?.querySelector('.badge')?.textContent?.trim() || '';
  const orderId = tds[0]?.textContent?.trim() || '';

  const mockById = {
    '#1025': {
      payment: 'GCash',
      amount: '₱120.00',
      reference: 'GCSH-8472-1903-5521',
      file: 'Thesis_Chapter1.pdf',
      pages: '28 pages',
      size: 'A4 • B/W • 1 copy',
      rush: 'No',
      notes: 'Print single-sided. Staple top-left.',
    },
    '#1026': {
      payment: 'GCash',
      amount: '₱350.00',
      reference: 'GCSH-3190-7741-2284',
      file: 'EventPoster_FINAL.png',
      pages: '1 page',
      size: 'A3 • Colored • 2 copies',
      rush: 'Yes (same-day)',
      notes: 'Use glossy paper if available.',
    },
    '#1027': {
      payment: 'Cash (Walk-in)',
      amount: '₱180.00',
      reference: 'N/A',
      file: 'Research_Binding.docx',
      pages: '65 pages',
      size: 'A4 • B/W • Spiral bind',
      rush: 'No',
      notes: 'Add clear cover + black back cover.',
    },
    '#1028': {
      payment: 'GCash',
      amount: '₱230.00',
      reference: 'GCSH-5022-6681-0197',
      file: 'ID_Lace_Layout.ai',
      pages: 'N/A',
      size: 'Lanyard • 10 pcs • 15mm',
      rush: 'No',
      notes: 'School colors: red/white. Include logo centered.',
    },
    '#1029': {
      payment: 'GCash',
      amount: '₱250.00',
      reference: 'GCSH-1109-4402-6733',
      file: 'MugDesign_v3.png',
      pages: 'N/A',
      size: 'Mug • 1 pc • Full wrap',
      rush: 'No',
      notes: 'Confirm preview before printing.',
    },
  };

  const defaults = {
    payment: status === 'Pending' ? 'GCash' : 'Cash',
    amount: status === 'Pending' ? '₱150.00' : '₱220.00',
    reference: status === 'Pending' ? 'GCSH-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000) : 'N/A',
    file: 'UploadedFile.pdf',
    pages: '—',
    size: '—',
    rush: 'No',
    notes: '—',
  };

  const extra = { ...defaults, ...(mockById[orderId] || {}) };

  return {
    orderId: tds[0]?.textContent?.trim() || '',
    student: tds[1]?.textContent?.trim() || '',
    service: tds[2]?.textContent?.trim() || '',
    date: tds[3]?.textContent?.trim() || '',
    status,
    ...extra,
  };
}

function renderOrderModal(order, mode) {
  const title = mode === 'process'
    ? `Process Order ${order.orderId}`
    : `Order Details ${order.orderId}`;

  const body = `
    <div class="sd-modal__grid">
      <div class="sd-modal__field">
        <div class="sd-modal__label">Order ID</div>
        <div class="sd-modal__value">${escapeHtml(order.orderId)}</div>
      </div>
      <div class="sd-modal__field">
        <div class="sd-modal__label">Status</div>
        <div class="sd-modal__value">${escapeHtml(order.status || '—')}</div>
      </div>
      <div class="sd-modal__field">
        <div class="sd-modal__label">Student</div>
        <div class="sd-modal__value">${escapeHtml(order.student || '—')}</div>
      </div>
      <div class="sd-modal__field">
        <div class="sd-modal__label">Service</div>
        <div class="sd-modal__value">${escapeHtml(order.service || '—')}</div>
      </div>
      <div class="sd-modal__field">
        <div class="sd-modal__label">Date</div>
        <div class="sd-modal__value">${escapeHtml(order.date || '—')}</div>
      </div>
      <div class="sd-modal__field">
        <div class="sd-modal__label">Payment (mock)</div>
        <div class="sd-modal__value">${escapeHtml(order.payment)}</div>
      </div>
      <div class="sd-modal__field">
        <div class="sd-modal__label">Amount (mock)</div>
        <div class="sd-modal__value">${escapeHtml(order.amount)}</div>
      </div>
      <div class="sd-modal__field">
        <div class="sd-modal__label">Reference (mock)</div>
        <div class="sd-modal__value">${escapeHtml(order.reference)}</div>
      </div>
      <div class="sd-modal__field">
        <div class="sd-modal__label">File (mock)</div>
        <div class="sd-modal__value">${escapeHtml(order.file)}</div>
      </div>
      <div class="sd-modal__field">
        <div class="sd-modal__label">Specs (mock)</div>
        <div class="sd-modal__value">${escapeHtml(order.size)} <span class="sd-modal__muted">• ${escapeHtml(order.pages)}</span></div>
      </div>
      <div class="sd-modal__field">
        <div class="sd-modal__label">Rush (mock)</div>
        <div class="sd-modal__value">${escapeHtml(order.rush)}</div>
      </div>
      <div class="sd-modal__field">
        <div class="sd-modal__label">Staff notes (mock)</div>
        <div class="sd-modal__value">${escapeHtml(order.notes)}</div>
      </div>
    </div>
    <div style="margin-top:12px;">
      <div class="sd-modal__label">Next step</div>
      <div class="sd-modal__value sd-modal__muted">
        ${mode === 'process'
          ? 'Mark as Processing, assign staff, and confirm payment (mock flow).'
          : 'Review details and continue processing (mock flow).'}
      </div>
    </div>
  `;

  openStaffModal(title, body);
}

document.addEventListener('click', (e) => {
  const closeEl = e.target.closest('[data-modal-close]');
  if (closeEl) {
    closeStaffModal();
    return;
  }

  const allOrdersBtn = e.target.closest('#viewAllOrdersBtn');
  if (allOrdersBtn) {
    activateStaffPage('order-queue');
    return;
  }

  const actionBtn = e.target.closest('.btn-action');
  if (actionBtn && !actionBtn.classList.contains('release')) {
    const label = actionBtn.textContent.trim().toLowerCase();
    const tr = actionBtn.closest('tr');
    const order = getOrderFromRow(tr);
    renderOrderModal(order, label === 'process' ? 'process' : 'view');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeStaffModal();
});

function parsePesoAmount(amountStr) {
  const n = Number(String(amountStr || '').replace(/[₱,\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function normalizeStatus(status) {
  const s = String(status || '').trim().toLowerCase();
  if (s.includes('pending')) return 'pending';
  if (s.includes('process')) return 'processing';
  if (s.includes('ready')) return 'ready';
  if (s.includes('complete')) return 'completed';
  return 'pending';
}

function formatPeso(n) {
  return `₱${Number(n || 0).toFixed(2)}`;
}

function getDashboardMockOrders() {
  const rows = Array.from(document.querySelectorAll('#page-order-queue tbody tr'));
  return rows.map(tr => {
    const o = getOrderFromRow(tr);
    return {
      ...o,
      statusKey: normalizeStatus(o.status),
      amountNum: parsePesoAmount(o.amount),
    };
  });
}

function renderDashboardMetricsAndTransactions() {
  const orders = getDashboardMockOrders();
  if (!orders.length) return;

  const counts = { pending: 0, processing: 0, ready: 0, completed: 0 };
  for (const o of orders) counts[o.statusKey] = (counts[o.statusKey] || 0) + 1;

  const todayOrders = orders.length;
  const todayIncome = orders
    .filter(o => o.statusKey === 'completed')
    .reduce((sum, o) => sum + o.amountNum, 0);

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText('metricTodayOrders', String(todayOrders));
  setText('metricTodayIncome', formatPeso(todayIncome));
  setText('metricPending', String(counts.pending));
  setText('metricProcessing', String(counts.processing));
  setText('metricReady', String(counts.ready));
  setText('metricCompleted', String(counts.completed));

  const empty = document.getElementById('todayTransactionsEmpty');
  const list = document.getElementById('todayTransactionsList');
  if (!list) return;

  const statusClass = (key) => ({
    pending: 'sd-tx__status--pending',
    processing: 'sd-tx__status--processing',
    ready: 'sd-tx__status--ready',
    completed: 'sd-tx__status--completed',
  }[key] || 'sd-tx__status--pending');

  const tx = orders.slice(0, 4).map(o => `
    <div class="sd-tx__item">
      <div class="sd-tx__left">
        <div class="sd-tx__top">
          <div class="sd-tx__id">${escapeHtml(o.orderId)}</div>
          <div class="sd-tx__status ${statusClass(o.statusKey)}">${escapeHtml(o.status || 'Pending')}</div>
        </div>
        <div class="sd-tx__meta">
          ${escapeHtml(o.student)} — ${escapeHtml(o.service)}
          <span class="sd-modal__muted"> • ${escapeHtml(o.date)}</span>
        </div>
      </div>
      <div class="sd-tx__right">
        <div class="sd-tx__amount">${escapeHtml(o.amount)}</div>
        <div class="sd-tx__pay">${escapeHtml(o.payment)}</div>
      </div>
    </div>
  `).join('');

  list.innerHTML = tx;
  list.style.display = '';
  if (empty) empty.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  renderDashboardMetricsAndTransactions();
  renderAnalyticsMockCharts();
  setupQrScanner();
});

function renderAnalyticsMockCharts() {
  const barsEl = document.getElementById('weeklyIncomeBars');
  const legendEl = document.getElementById('orderTrendLegend');
  if (!barsEl || !legendEl) return;

  const weekly = [
    { day: 'Mon', income: 820, orders: 11 },
    { day: 'Tue', income: 1240, orders: 16 },
    { day: 'Wed', income: 980, orders: 13 },
    { day: 'Thu', income: 1675, orders: 21 },
    { day: 'Fri', income: 1420, orders: 18 },
    { day: 'Sat', income: 640, orders: 8 },
    { day: 'Sun', income: 910, orders: 12 },
  ];

  const maxIncome = Math.max(...weekly.map(d => d.income), 1);
  barsEl.innerHTML = weekly.map(d => {
    const h = Math.max(0.08, d.income / maxIncome);
    return `
      <div class="sd-bar" style="--h:${h.toFixed(3)}">
        <div class="sd-bar__meta">
          <div class="sd-bar__day">${escapeHtml(d.day)}</div>
          <div class="sd-bar__amt">₱${escapeHtml(d.income.toLocaleString())}</div>
        </div>
        <div class="sd-bar__sub">${escapeHtml(String(d.orders))} orders</div>
      </div>
    `;
  }).join('');

  const hours = ['8am', '10am', '12nn', '2pm', '4pm', '6pm'];
  const points = [3, 4, 8, 9, 13, 11];
  const maxP = Math.max(...points, 1);

  const xStep = 100 / (points.length - 1);
  const yMap = (v) => 34 - (v / maxP) * 24;
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * xStep).toFixed(2)} ${yMap(v).toFixed(2)}`).join(' ');

  const pathEl = document.getElementById('orderTrendPath');
  const areaEl = document.getElementById('orderTrendArea');
  if (pathEl) pathEl.setAttribute('d', d);
  if (areaEl) areaEl.setAttribute('d', `M0 40 ${d} L100 40 Z`);

  legendEl.innerHTML = hours.map((h, i) => `
    <div class="sd-legend__item"><b>${escapeHtml(h)}</b>: ${escapeHtml(String(points[i]))} orders</div>
  `).join('');
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('#viewAnalyticsBtn');
  if (!btn) return;
  activateStaffPage('analytics');
});

function setupQrScanner() {
  const startBtn = document.getElementById('qrStartBtn');
  const stopBtn = document.getElementById('qrStopBtn');
  const statusText = document.getElementById('qrStatusText');
  const helperText = document.getElementById('qrHelperText');
  const resultText = document.getElementById('qrResultText');
  const video = document.getElementById('qrVideo');
  const manualInput = document.getElementById('qrManualInput');
  const manualSubmit = document.getElementById('qrManualSubmit');

  if (!startBtn || !stopBtn || !statusText || !helperText || !resultText || !video || !manualInput || !manualSubmit) return;

  let stream = null;
  let detector = null;
  let scanning = false;
  let rafId = null;
  let lastValue = '';

  const setStatus = (text) => { statusText.textContent = text; };
  const setHelper = (html) => { helperText.innerHTML = html; };
  const setResult = (text) => { resultText.textContent = text || '—'; };

  const stop = () => {
    scanning = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    startBtn.disabled = false;
    stopBtn.disabled = true;
    setStatus('Camera is off.');
  };

  const validateValue = (value) => {
    const v = String(value || '').trim();
    if (!v) {
      setResult('—');
      return;
    }
    const ok = /^WMSU-(ORD|PKU)-\d{4,8}$/i.test(v) || /^#\d{4,6}$/.test(v);
    setResult(ok ? `Valid: ${v}` : `Invalid: ${v}`);
  };

  const scanLoop = async () => {
    if (!scanning || !detector) return;
    try {
      const codes = await detector.detect(video);
      if (codes && codes.length) {
        const value = codes[0].rawValue || '';
        if (value && value !== lastValue) {
          lastValue = value;
          validateValue(value);
        }
      }
    } catch {}
    rafId = requestAnimationFrame(scanLoop);
  };

  const start = async () => {
    try {
      setStatus('Requesting camera permission…');
      setHelper('If a prompt appears, choose <b>Allow</b> to use the camera.');

      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });

      video.srcObject = stream;
      await video.play();

      startBtn.disabled = true;
      stopBtn.disabled = false;
      setStatus('Camera is on. Scanning…');

      if ('BarcodeDetector' in window) {
        try {
          detector = new BarcodeDetector({ formats: ['qr_code'] });
        } catch {
          detector = null;
        }
      }

      if (!detector) {
        scanning = false;
        setStatus('Camera is on, but QR scanning is not supported in this browser.');
        setHelper('Use <b>Manual entry</b> below, or try Chrome/Edge for QR scanning.');
        return;
      }

      scanning = true;
      scanLoop();
    } catch (err) {
      stop();
      const name = err && typeof err === 'object' ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setStatus('Camera blocked.');
        setHelper('Please <b>Allow</b> camera permission in the browser, then click <b>Start scanner</b> again.');
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setStatus('No camera found.');
        setHelper('No available camera device was detected.');
      } else {
        setStatus('Camera error.');
        setHelper('Something went wrong starting the camera. Try again.');
      }
    }
  };

  startBtn.addEventListener('click', start);
  stopBtn.addEventListener('click', stop);
  manualSubmit.addEventListener('click', () => validateValue(manualInput.value));
  manualInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') validateValue(manualInput.value);
  });

  const originalActivate = activateStaffPage;
  activateStaffPage = function (pageKey) {
    if (pageKey !== 'qr-scanner') stop();
    return originalActivate(pageKey);
  };
}