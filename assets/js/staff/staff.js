/**
 * Staff page logic (shared library).
 *
 * NOTE: This file intentionally does NOT manage navigation or auth.
 * Those responsibilities are handled by `assets/js/staff/staff-shell.js`.
 * Each staff page calls `window.UpressStaffPages.initX()` as needed.
 */

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

function clearStaffModalFootActions() {
  const proceed = document.querySelector('#staffModal .sd-modal__footProceed');
  if (proceed) proceed.remove();
}

function setProcessModalFootProceed({ orderId, nextStatusKey, label }) {
  clearStaffModalFootActions();

  const foot = document.querySelector('#staffModal .sd-modal__foot');
  if (!foot) return;

  if (orderId && nextStatusKey) {
    const proceed = document.createElement('button');
    proceed.type = 'button';
    proceed.className = 'sd-modal__btn sd-modal__footProceed';
    proceed.setAttribute('data-order-id', orderId);
    proceed.setAttribute('data-next-status-key', nextStatusKey);
    proceed.textContent = label || 'Proceed';
    foot.appendChild(proceed);
  }
}

function closeStaffModal() {
  setModalOpen(false);
  clearStaffModalFootActions();
}

function activateStaffPage(pageKey) {
  const key = String(pageKey || "").trim();
  if (!key) return;
  window.location.href = `${key}.html`;
}

function getOrderFromRow(tr) {
  const enc = tr && tr.getAttribute && tr.getAttribute('data-order-full');
  if (enc) {
    try {
      const parsed = JSON.parse(decodeURIComponent(enc));
      return {
        orderId: parsed.orderId || '',
        student: parsed.student || '',
        service: parsed.service || '',
        orderType: parsed.orderType || '',
        orderOrg: parsed.orderOrg || '',
        date: parsed.date || '',
        status: parsed.status || '',
        payment: parsed.payment || '',
        amount: parsed.amount || '',
        reference: parsed.reference || '',
        file: parsed.file || '',
        pages: parsed.pages || '',
        size: parsed.size || '',
        rush: parsed.rush || '',
        notes: parsed.notes || '',
        paymentVerified: !!parsed.paymentVerified,
        staffReviewStatus: parsed.staffReviewStatus || 'pending_review',
        staffReviewNotes: parsed.staffReviewNotes || '',
        staffReviewedAt: parsed.staffReviewedAt || '',
      };
    } catch (_) {}
  }

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

  const statusKey = normalizeStatus(order.status);

  const flowSteps = [
    { key: 'pending', label: 'Pending' },
    { key: 'processing', label: 'Processing' },
    { key: 'ready', label: 'Ready to Pick up' },
    { key: 'completed', label: 'Completing' },
  ];
  const currentIdx = Math.max(0, flowSteps.findIndex(s => s.key === statusKey));
  const nextStep = flowSteps[currentIdx + 1] || null;

  const proceedLabelByNextKey = {
    processing: 'Proceed to Processing',
    ready: 'Proceed to Ready to Pick up',
    completed: 'Proceed to Completing',
  };

  const progressRatio = flowSteps.length > 1 ? (currentIdx / (flowSteps.length - 1)) : 0;
  const progressR = Math.max(0, Math.min(1, progressRatio));

  const flowHtml = mode === 'process'
    ? `
      <div class="sd-modal__flow">
        <div class="sd-modal__flowLabel">Order progress</div>
        <div
          class="sd-modal__pipeline"
          style="--r:${progressR.toFixed(4)};"
          role="list"
          aria-label="Order status pipeline"
        >
          ${flowSteps.map((s, idx) => {
            const isActive = idx === currentIdx;
            const isDone = idx < currentIdx;
            const cls = isActive ? 'is-active' : (isDone ? 'is-done' : 'is-upcoming');
            return `
              <div class="sd-modal__pipeStep ${cls}" role="listitem">
                <div class="sd-modal__pipeDot" aria-hidden="true"></div>
                <div class="sd-modal__pipeLabel">${escapeHtml(s.label)}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `
    : '';

  const typeLine = (function () {
    const t = String(order.orderType || '').toLowerCase();
    if (t === 'organization' || t === 'org') {
      return order.orderOrg ? `Organization (${escapeHtml(order.orderOrg)})` : 'Organization';
    }
    if (t) return escapeHtml(order.orderType);
    return 'Individual';
  })();

  const isOrgOrder =
    String(order.orderType || '').toLowerCase() === 'organization' ||
    String(order.orderType || '').toLowerCase() === 'org';
  const reviewStatus = String(order.staffReviewStatus || 'pending_review');
  const reviewBadge = (function () {
    if (reviewStatus === 'approved') return '<span class="badge badge-complete">Approved</span>';
    if (reviewStatus === 'rejected') return '<span class="badge badge-pending">Rejected</span>';
    return '<span class="badge badge-process">Needs review</span>';
  })();

  const body = `
    ${flowHtml}
    ${
      isOrgOrder
        ? `
      <div class="sd-panel" style="margin-bottom:12px">
        <div class="sd-panel__head">
          <div>
            <div class="sd-panel__title">
              <span class="sd-panel__titleIcon" aria-hidden="true">≡</span>
              <span>Organization Review</span>
            </div>
            <div class="sd-panel__sub">
              Staff must review and approve organization orders before moving to <b>Processing</b>.
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">${reviewBadge}</div>
        </div>
        <div style="padding:14px 16px; display:grid; gap:10px">
          <label style="display:grid;gap:6px">
            <span style="font-weight:700;font-size:12px;color:#667085">Review notes</span>
            <input id="orgReviewNotes" class="sd-lookup__input" type="text" value="${escapeHtml(
              order.staffReviewNotes || '',
            )}" placeholder="e.g. Can fulfill by Friday; need 50 copies; payment verified" />
          </label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button type="button" class="sd-panel__cta btn-org-approve" data-order-id="${escapeHtml(
              order.orderId,
            )}">Approve</button>
            <button type="button" class="sd-panel__cta btn-org-reject" data-order-id="${escapeHtml(
              order.orderId,
            )}" style="background:transparent;color:#b42318;border:1.5px solid rgba(180,35,24,0.35)">Reject</button>
            <a class="sd-panel__cta" href="organizations-ledger.html?org=${encodeURIComponent(
              order.orderOrg || '',
            )}">Open ledger</a>
          </div>
          <div class="sd-muted" style="font-size:12px">
            Payment verified: <b>${order.paymentVerified ? 'Yes' : 'No'}</b>
          </div>
        </div>
      </div>
    `
        : ''
    }
    <div class="sd-modal__grid">
      <div class="sd-modal__field">
        <div class="sd-modal__label">Order ID</div>
        <div class="sd-modal__value">${escapeHtml(order.orderId)}</div>
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
        <div class="sd-modal__label">Order Type</div>
        <div class="sd-modal__value">${typeLine}</div>
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
  `;

  openStaffModal(title, body);

  if (mode === 'process') {
    if (nextStep) {
      setProcessModalFootProceed({
        orderId: order.orderId,
        nextStatusKey: nextStep.key,
        label: proceedLabelByNextKey[nextStep.key] || 'Proceed',
      });
    } else {
      setProcessModalFootProceed({ orderId: '', nextStatusKey: '', label: '' });
    }
  }
}

function getRowByOrderId(tableId, orderId) {
  const table = document.getElementById(tableId);
  const tbody = table ? table.querySelector('tbody') : null;
  if (!tbody) return null;
  const rows = Array.from(tbody.querySelectorAll('tr'));
  return rows.find(tr => {
    const td = tr.querySelector('td');
    return td && td.textContent.trim() === orderId;
  }) || null;
}

function getStatusKeyFromRow(tr) {
  const badge = tr?.querySelector('.badge');
  return normalizeStatus(badge?.textContent || '');
}

function setRowStatus(tr, statusKey) {
  const badge = tr?.querySelector('.badge');
  if (!badge) return;

  const statusClassByKey = {
    pending: 'badge-pending',
    processing: 'badge-process',
    ready: 'badge-ready',
    completed: 'badge-complete',
  };

  const statusLabelByKey = {
    pending: 'Pending',
    processing: 'Processing',
    ready: 'Ready for Pickup',
    completed: 'Completed',
  };

  Object.keys(statusClassByKey).forEach(k => badge.classList.remove(statusClassByKey[k]));
  const cls = statusClassByKey[statusKey] || statusClassByKey.pending;
  const label = statusLabelByKey[statusKey] || statusLabelByKey.pending;
  badge.classList.add(cls);
  badge.textContent = label;
}

function getOrderFromSimpleRow(tr) {
  const tds = tr ? Array.from(tr.querySelectorAll('td')) : [];
  const status = tr?.querySelector('.badge')?.textContent?.trim() || '';
  const orderId = tds[0]?.textContent?.trim() || '';

  // Reuse the richer mock fields from getOrderFromRow if possible
  const mockFromQueueRow = getRowByOrderId('orderQueueTable', orderId);
  if (mockFromQueueRow) return getOrderFromRow(mockFromQueueRow);

  const base = {
    orderId,
    student: tds[1]?.textContent?.trim() || '',
    service: tds[2]?.textContent?.trim() || '',
    date: tds[3]?.textContent?.trim() || '',
    status,
  };

  // Add defaults so release page always has values
  const extra = getOrderFromRow(tr) || {};
  return { ...extra, ...base };
}

function saveSelectedReleaseOrder(order) {
  try {
    sessionStorage.setItem('staffSelectedReleaseOrder', JSON.stringify(order || {}));
  } catch {}
}

function loadSelectedReleaseOrder() {
  try {
    const raw = sessionStorage.getItem('staffSelectedReleaseOrder');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearSelectedReleaseOrder() {
  try {
    sessionStorage.removeItem('staffSelectedReleaseOrder');
  } catch {}
}

function setReleasePageOrder(order) {
  const emptyEl = document.getElementById('releaseEmpty');
  const contentEl = document.getElementById('releaseContent');
  const gridEl = document.getElementById('releaseDetailsGrid');
  const paymentEl = document.getElementById('releasePaymentReceived');
  const completeBtn = document.getElementById('releaseCompleteBtn');
  const statusEl = document.getElementById('releaseStatusText');

  if (!emptyEl || !contentEl || !gridEl || !paymentEl || !completeBtn || !statusEl) return;

  statusEl.textContent = '';
  paymentEl.checked = false;
  completeBtn.disabled = true;

  if (!order || !order.orderId) {
    emptyEl.style.display = '';
    contentEl.style.display = 'none';
    gridEl.innerHTML = '';
    return;
  }

  emptyEl.style.display = 'none';
  contentEl.style.display = '';

  const fields = [
    ['Order ID', order.orderId],
    ['Student', order.student || '—'],
    ['Service', order.service || '—'],
    ['Date', order.date || '—'],
    ['Status', order.status || '—'],
    ['Payment', order.payment || '—'],
    ['Amount', order.amount || '—'],
    ['Reference', order.reference || '—'],
    ['File', order.file || '—'],
    ['Specs', `${order.size || '—'} • ${order.pages || '—'}`],
    ['Rush', order.rush || '—'],
    ['Notes', order.notes || '—'],
  ];

  gridEl.innerHTML = fields.map(([label, value]) => `
    <div class="sd-modal__field">
      <div class="sd-modal__label">${escapeHtml(label)}</div>
      <div class="sd-modal__value">${escapeHtml(value)}</div>
    </div>
  `).join('');

  saveSelectedReleaseOrder(order);
}

document.addEventListener('click', (e) => {
  const closeEl = e.target.closest('[data-modal-close]');
  if (closeEl) {
    closeStaffModal();
    return;
  }

  const footProceed = e.target.closest('.sd-modal__footProceed');
  if (footProceed) {
    const orderId = footProceed.getAttribute('data-order-id') || '';
    const nextStatusKey = footProceed.getAttribute('data-next-status-key') || '';
    if (!orderId || !nextStatusKey) return;

    const targetRow = getRowByOrderId('orderQueueTable', orderId);
    if (!targetRow) return;

    // Gate: organization orders require staff approval + payment verification
    try {
      const ord = getOrderFromRow(targetRow);
      const isOrg =
        String(ord.orderType || '').toLowerCase() === 'organization' ||
        String(ord.orderType || '').toLowerCase() === 'org';
      if (isOrg && nextStatusKey === 'processing') {
        const approved = String(ord.staffReviewStatus || '') === 'approved';
        if (!approved) {
          alert('This organization order must be APPROVED by staff before moving to Processing.');
          return;
        }
        if (!ord.paymentVerified) {
          alert('Verify payment (or record initial payment) before moving to Processing.');
          return;
        }
      }
    } catch {}

    setRowStatus(targetRow, nextStatusKey);

    if (window.UpressStaffData && String(orderId).startsWith('ORD-')) {
      UpressStaffData.persistWebOrderStatus(orderId, nextStatusKey);
      UpressStaffData.hydrateTablesFromStorage();
    }

    renderDashboardMetricsAndTransactions();
    closeStaffModal();
    return;
  }

  const verifyPayBtn = e.target.closest('.btn-verify-pay');
  if (verifyPayBtn) {
    const oid = verifyPayBtn.getAttribute('data-verify-order') || '';
    if (window.UpressStaffData && oid && UpressStaffData.verifyWebPayment(oid)) {
      UpressStaffData.hydrateTablesFromStorage();
      renderDashboardMetricsAndTransactions();
    }
    return;
  }

  const approveBtn = e.target.closest('.btn-org-approve');
  if (approveBtn) {
    const oid = approveBtn.getAttribute('data-order-id') || '';
    const notes = document.getElementById('orgReviewNotes')?.value || '';
    if (window.UpressStaffData && oid) {
      try {
        UpressStaffData.setOrderReviewStatus(oid, { status: 'approved', notes });
        UpressStaffData.hydrateTablesFromStorage();
        const row = getRowByOrderId('orderQueueTable', oid);
        if (row) renderOrderModal(getOrderFromRow(row), 'process');
      } catch (err) {
        alert(String(err?.message || 'Failed to approve.'));
      }
    }
    return;
  }

  const rejectBtn = e.target.closest('.btn-org-reject');
  if (rejectBtn) {
    const oid = rejectBtn.getAttribute('data-order-id') || '';
    const notes = document.getElementById('orgReviewNotes')?.value || '';
    if (window.UpressStaffData && oid) {
      try {
        UpressStaffData.setOrderReviewStatus(oid, { status: 'rejected', notes });
        UpressStaffData.hydrateTablesFromStorage();
        const row = getRowByOrderId('orderQueueTable', oid);
        if (row) renderOrderModal(getOrderFromRow(row), 'process');
      } catch (err) {
        alert(String(err?.message || 'Failed to reject.'));
      }
    }
    return;
  }

  const allOrdersBtn = e.target.closest('#viewAllOrdersBtn');
  if (allOrdersBtn) {
    activateStaffPage('order-queue');
    return;
  }

  const actionBtn = e.target.closest('.btn-action');
  if (actionBtn && !actionBtn.classList.contains('release')) {
    const tr = actionBtn.closest('tr');
    const order = getOrderFromRow(tr);
    renderOrderModal(order, 'process');
    return;
  }

  const releaseBtn = e.target.closest('.btn-action.release');
  if (releaseBtn) {
    const tr = releaseBtn.closest('tr');
    const order = getOrderFromSimpleRow(tr);
    setReleasePageOrder(order);
    activateStaffPage('order-release');
    return;
  }

  const goToQrBtn = e.target.closest('#lookupGoToQrBtn');
  if (goToQrBtn) {
    activateStaffPage('qr-scanner');
    return;
  }

  const lookupSearchBtn = e.target.closest('#lookupReferenceBtn');
  if (lookupSearchBtn) {
    runOrderLookup();
    return;
  }

  const lookupReleaseBtn = e.target.closest('[data-lookup-release]');
  if (lookupReleaseBtn) {
    const orderId = lookupReleaseBtn.getAttribute('data-lookup-release') || '';
    if (!orderId) return;

    const qRow = getRowByOrderId('orderQueueTable', orderId);
    const rRow = getRowByOrderId('readyReleaseTable', orderId);
    const tr = qRow || rRow;
    if (!tr) return;

    const order = qRow ? getOrderFromRow(tr) : getOrderFromSimpleRow(tr);
    setReleasePageOrder(order);
    activateStaffPage('order-release');
    return;
  }

  const releaseBackBtn = e.target.closest('#releaseBackBtn');
  if (releaseBackBtn) {
    activateStaffPage('ready-release');
    return;
  }

  const releaseCompleteBtn = e.target.closest('#releaseCompleteBtn');
  if (releaseCompleteBtn) {
    completeReleaseFlow();
    return;
  }

  // Note: status changes in modal are handled by the single "Proceed" button now.
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

/** Parse date labels from web orders, POS rows, or table text (en-PH locale strings OK). */
function parseOrderDateFromLabel(dateStr) {
  const raw = String(dateStr || '').trim();
  if (!raw) return null;
  const t = Date.parse(raw);
  if (Number.isFinite(t)) return new Date(t);
  const d = new Date(raw);
  return Number.isFinite(d.getTime()) ? d : null;
}

function isOrderToday(o) {
  const d = parseOrderDateFromLabel(o.date);
  if (!d) return false;
  return d.toDateString() === new Date().toDateString();
}

function getDashboardMockOrders() {
  const collect = (tableId, parser) => {
    const table = document.getElementById(tableId);
    const rows = table ? Array.from(table.querySelectorAll('tbody tr')) : [];
    return rows
      .filter((tr) => !tr.querySelector('td[colspan]'))
      .map((tr) => {
        const o = parser(tr);
        return {
          ...o,
          statusKey: normalizeStatus(o.status),
          amountNum: parsePesoAmount(o.amount),
        };
      })
      .filter((o) => {
        const id = String(o.orderId || '').trim();
        return id && !/no web|no orders|walk-in customers/i.test(id);
      });
  };

  const queue = collect('orderQueueTable', getOrderFromRow);
  const ready = collect('readyReleaseTable', getOrderFromSimpleRow);
  const completed = collect('completedOrdersTable', getOrderFromSimpleRow);

  const seen = new Set();
  const merged = [];
  for (const o of [...queue, ...ready, ...completed]) {
    const k = String(o.orderId || '').trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    merged.push(o);
  }
  return merged;
}

function renderDashboardMetricsAndTransactions() {
  const orders = getDashboardMockOrders();
  const ordersToday = orders.filter(isOrderToday);

  const counts = { pending: 0, processing: 0, ready: 0, completed: 0 };
  for (const o of orders) counts[o.statusKey] = (counts[o.statusKey] || 0) + 1;

  const todayOrders = ordersToday.length;
  const todayIncome = ordersToday
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

  if (!ordersToday.length) {
    list.style.display = 'none';
    if (empty) empty.style.display = '';
    return;
  }

  const sortedToday = ordersToday.slice().sort((a, b) => {
    const ta = parseOrderDateFromLabel(a.date)?.getTime() || 0;
    const tb = parseOrderDateFromLabel(b.date)?.getTime() || 0;
    return tb - ta;
  });

  list.innerHTML = sortedToday.slice(0, 8).map(o => {
    const isPos = /^POS-/i.test(String(o.orderId || ''));
    const channel = isPos ? 'Walk-in POS' : 'Web order';
    return `
    <div class="sd-tx__item">
      <div class="sd-tx__left">
        <div class="sd-tx__top">
          <div class="sd-tx__id">${escapeHtml(o.orderId)}</div>
          <div class="sd-tx__status ${statusClass(o.statusKey)}">${escapeHtml(o.status || 'Pending')}</div>
        </div>
        <div class="sd-tx__meta">
          ${escapeHtml(o.student)} — ${escapeHtml(o.service)}
          <span class="sd-modal__muted"> • ${escapeHtml(o.date)} • ${escapeHtml(channel)}</span>
        </div>
      </div>
      <div class="sd-tx__right">
        <div class="sd-tx__amount">${escapeHtml(o.amount)}</div>
        <div class="sd-tx__pay">${escapeHtml(o.payment)}</div>
      </div>
    </div>
  `;
  }).join('');

  list.style.display = '';
  if (empty) empty.style.display = 'none';
}

function initDashboardPage() {
  if (window.UpressStaffData) UpressStaffData.hydrateTablesFromStorage();
  renderDashboardMetricsAndTransactions();

  const viewAll = document.getElementById("viewAllOrdersBtn");
  viewAll?.addEventListener("click", () => {
    window.location.href = "order-queue.html";
  });

  const viewAnalytics = document.getElementById("viewAnalyticsBtn");
  viewAnalytics?.addEventListener("click", () => {
    window.location.href = "analytics.html";
  });

  document.addEventListener("staff:data-changed", () => {
    if (window.UpressStaffData) UpressStaffData.hydrateTablesFromStorage();
    renderDashboardMetricsAndTransactions();
    if (typeof window.renderWalkInPosHistory === "function") window.renderWalkInPosHistory();
  });
}

function initAnalyticsPage() {
  renderAnalyticsMockCharts();
}

function initOrderQueuePage() {
  if (window.UpressStaffData) UpressStaffData.hydrateTablesFromStorage();
  setupOrderQueueSorting();
  window.UpressListTools?.initTableList?.({
    tableId: "orderQueueTable",
    searchInputId: "oqSearchInput",
    countId: "oqResultCount",
    paginationId: "oqPagination",
    pageSize: 8,
    emptyLabel: "orders",
  });
}

function initQrScannerPage() {
  setupQrScanner();
}

function initOrderLookupPage() {
  syncLookupLastScanned();

  const lookupInput = document.getElementById("lookupReferenceInput");
  lookupInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runOrderLookup();
  });

  document.getElementById("lookupReferenceBtn")?.addEventListener("click", runOrderLookup);
  document.getElementById("lookupGoToQrBtn")?.addEventListener("click", () => {
    window.location.href = "qr-scanner.html";
  });

  document.addEventListener("staff:qr-scan", () => syncLookupLastScanned());
}

function initReadyReleasePage() {
  if (window.UpressStaffData) UpressStaffData.hydrateTablesFromStorage();
  window.UpressListTools?.initTableList?.({
    tableId: "readyReleaseTable",
    searchInputId: "rrSearchInput",
    countId: "rrResultCount",
    paginationId: "rrPagination",
    pageSize: 8,
    emptyLabel: "orders",
  });
}

function initCompletedPage() {
  // Activity page is rendered by staff-activity.js. Keep legacy hydration for older markup.
  if (document.getElementById("actPeriod")) return;
  if (window.UpressStaffData) UpressStaffData.hydrateTablesFromStorage();
  window.UpressListTools?.initTableList?.({
    tableId: "completedOrdersTable",
    searchInputId: "coSearchInput",
    countId: "coResultCount",
    paginationId: "coPagination",
    pageSize: 10,
    emptyLabel: "orders",
  });
  document.addEventListener("staff:data-changed", () => {
    if (window.UpressStaffData) UpressStaffData.hydrateTablesFromStorage();
  });
}

function setupOrderQueueSorting() {
  const table = document.getElementById('orderQueueTable');
  if (!table) return;
  const tbody = table.querySelector('tbody');
  if (!tbody) return;

  const headers = Array.from(table.querySelectorAll('th[data-sort-key]'));
  if (!headers.length) return;

  const getCellText = (tr, idx) => (tr.querySelectorAll('td')[idx]?.textContent || '').trim();
  const parseOrderId = (s) => {
    const n = Number(String(s).replace(/[^\d]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };
  const parseDate = (s) => {
    const t = Date.parse(s);
    return Number.isFinite(t) ? t : 0;
  };
  const parseStatusRank = (s) => {
    const v = String(s || '').toLowerCase();
    if (v.includes('pending')) return 1;
    if (v.includes('processing')) return 2;
    if (v.includes('ready')) return 3;
    if (v.includes('completed')) return 4;
    return 99;
  };

  const colIndexByKey = {
    orderId: 0,
    student: 1,
    service: 2,
    date: 3,
    status: 4,
  };

  const setSortVisual = (activeTh, dir) => {
    headers.forEach(th => {
      if (th === activeTh) {
        th.setAttribute('aria-sort', dir === 'asc' ? 'ascending' : 'descending');
        const icon = th.querySelector('.sd-sortIcon');
        if (icon) icon.textContent = dir === 'asc' ? '↑' : '↓';
      } else {
        th.setAttribute('aria-sort', 'none');
        const icon = th.querySelector('.sd-sortIcon');
        if (icon) icon.textContent = '↕';
      }
    });
  };

  headers.forEach(th => {
    const btn = th.querySelector('button');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const key = th.getAttribute('data-sort-key') || '';
      const idx = colIndexByKey[key];
      if (idx === undefined) return;

      const current = th.getAttribute('data-sort-dir') || '';
      const dir = current === 'asc' ? 'desc' : 'asc';
      headers.forEach(h => h.removeAttribute('data-sort-dir'));
      th.setAttribute('data-sort-dir', dir);

      const rows = Array.from(tbody.querySelectorAll('tr')).map((tr, i) => ({ tr, i }));

      const getValue = (tr) => {
        if (key === 'orderId') return parseOrderId(getCellText(tr, idx));
        if (key === 'date') return parseDate(getCellText(tr, idx));
        if (key === 'status') return parseStatusRank(getCellText(tr, idx));
        return getCellText(tr, idx).toLowerCase();
      };

      rows.sort((a, b) => {
        const va = getValue(a.tr);
        const vb = getValue(b.tr);
        if (va < vb) return dir === 'asc' ? -1 : 1;
        if (va > vb) return dir === 'asc' ? 1 : -1;
        return a.i - b.i;
      });

      const frag = document.createDocumentFragment();
      rows.forEach(r => frag.appendChild(r.tr));
      tbody.appendChild(frag);

      setSortVisual(th, dir);
    });
  });
}

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

// (legacy) viewAnalytics click delegation removed; handled per-page init.

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
    if (ok) {
      try {
        sessionStorage.setItem('staffLastScan', v);
      } catch {}
      document.dispatchEvent(new CustomEvent('staff:qr-scan', { detail: { value: v } }));
    }
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

function syncLookupLastScanned() {
  const el = document.getElementById('lookupLastScannedText');
  if (!el) return;
  let v = '—';
  try {
    v = sessionStorage.getItem('staffLastScan') || '—';
  } catch {}
  el.textContent = v;
}

function findOrderByReference(reference) {
  const ref = String(reference || '').trim().toLowerCase();
  if (!ref) return null;

  if (window.UpressStaffData) {
    const list = UpressStaffData.getWebOrders();
    for (const o of list) {
      const r = String(o.refNumber || '').trim().toLowerCase();
      const id = String(o.orderId || '').trim().toLowerCase();
      if (r && r === ref) return UpressStaffData.orderToStaffPayload(o);
      if (id && id === ref) return UpressStaffData.orderToStaffPayload(o);
    }
  }

  // Search order queue mock data (getOrderFromRow generates reference by orderId mapping)
  const queueTable = document.getElementById('orderQueueTable');
  const qRows = queueTable ? Array.from(queueTable.querySelectorAll('tbody tr')) : [];
  for (const tr of qRows) {
    const o = getOrderFromRow(tr);
    if (String(o.reference || '').trim().toLowerCase() === ref) return o;
  }

  // Search ready-release list (fallback)
  const readyTable = document.getElementById('readyReleaseTable');
  const rRows = readyTable ? Array.from(readyTable.querySelectorAll('tbody tr')) : [];
  for (const tr of rRows) {
    const o = getOrderFromSimpleRow(tr);
    if (String(o.reference || '').trim().toLowerCase() === ref) return o;
  }

  return null;
}

function runOrderLookup() {
  const input = document.getElementById('lookupReferenceInput');
  const result = document.getElementById('lookupResult');
  if (!input || !result) return;

  const ref = String(input.value || '').trim();
  if (!ref) {
    result.innerHTML = `<div class="sd-lookup__msg sd-lookup__msg--warn">Enter a reference number to search.</div>`;
    return;
  }

  const order = findOrderByReference(ref);
  if (!order) {
    result.innerHTML = `<div class="sd-lookup__msg sd-lookup__msg--empty">No order found for reference <b>${escapeHtml(ref)}</b>.</div>`;
    return;
  }

  result.innerHTML = `
    <div class="sd-lookup__card">
      <div class="sd-lookup__cardTop">
        <div>
          <div class="sd-lookup__id">${escapeHtml(order.orderId || '—')}</div>
          <div class="sd-lookup__meta">
            ${escapeHtml(order.student || '—')} — ${escapeHtml(order.service || '—')}
            <span class="sd-modal__muted"> • ${escapeHtml(order.date || '—')}</span>
          </div>
        </div>
        <div class="sd-lookup__status">${escapeHtml(order.status || '—')}</div>
      </div>
      <div class="sd-lookup__cardGrid">
        <div class="sd-lookup__kv"><b>Payment</b><span>${escapeHtml(order.payment || '—')}</span></div>
        <div class="sd-lookup__kv"><b>Amount</b><span>${escapeHtml(order.amount || '—')}</span></div>
        <div class="sd-lookup__kv"><b>Reference</b><span>${escapeHtml(order.reference || '—')}</span></div>
        <div class="sd-lookup__kv"><b>File</b><span>${escapeHtml(order.file || '—')}</span></div>
      </div>
      <div class="sd-lookup__cardActions">
        <button class="sd-lookup__btn" type="button" data-lookup-release="${escapeHtml(order.orderId || '')}">
          Open for Release
        </button>
      </div>
    </div>
  `;
}

function completeReleaseFlow() {
  const order = loadSelectedReleaseOrder();
  const statusEl = document.getElementById('releaseStatusText');
  const paymentEl = document.getElementById('releasePaymentReceived');
  if (!statusEl || !paymentEl) return;

  if (!order || !order.orderId) {
    statusEl.textContent = 'No order selected.';
    return;
  }

  if (!paymentEl.checked) {
    statusEl.textContent = 'Please confirm payment received.';
    return;
  }

  // Update in queue table if present
  const qRow = getRowByOrderId('orderQueueTable', order.orderId);
  if (qRow) setRowStatus(qRow, 'completed');

  // If present in ready-release, move it to completed history table
  const rRow = getRowByOrderId('readyReleaseTable', order.orderId);
  if (rRow) rRow.remove();

  statusEl.textContent = `Order ${order.orderId} released and marked as completed.`;

  if (window.UpressStaffData && String(order.orderId || '').startsWith('ORD-')) {
    const list = UpressStaffData.getWebOrders();
    const i = list.findIndex((x) => x.orderId === order.orderId);
    if (i !== -1) {
      list[i].status = 'Completed';
      UpressStaffData.saveWebOrders(list);
    }
  }

  if (window.UpressStaffData) {
    UpressStaffData.hydrateTablesFromStorage();
  } else {
    const completedTable = document.getElementById('completedOrdersTable');
    const cBody = completedTable ? completedTable.querySelector('tbody') : null;
    if (cBody) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
      <td>${escapeHtml(order.orderId)}</td>
      <td>${escapeHtml(order.student || '—')}</td>
      <td>${escapeHtml(order.service || '—')}</td>
      <td>${escapeHtml(new Date().toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' }))}</td>
      <td>Staff</td>
      <td><span class="badge badge-complete">Completed</span></td>
      <td>—</td>
    `;
      cBody.prepend(tr);
    }
  }

  renderDashboardMetricsAndTransactions();
  clearSelectedReleaseOrder();

  // Keep details visible but disable the button until a new selection
  const completeBtn = document.getElementById('releaseCompleteBtn');
  if (completeBtn) completeBtn.disabled = true;
}

function initOrderReleasePage() {
  const selected = loadSelectedReleaseOrder();
  if (selected && selected.orderId) setReleasePageOrder(selected);

  document.addEventListener("change", (e) => {
    const paymentEl = e.target.closest("#releasePaymentReceived");
    if (paymentEl) {
      const btn = document.getElementById("releaseCompleteBtn");
      if (btn) btn.disabled = !paymentEl.checked;
    }
  });
}

window.UpressStaffPages = window.UpressStaffPages || {};
window.UpressStaffPages.initDashboard = initDashboardPage;
window.UpressStaffPages.initAnalytics = initAnalyticsPage;
window.UpressStaffPages.initOrderQueue = initOrderQueuePage;
window.UpressStaffPages.initQrScanner = initQrScannerPage;
window.UpressStaffPages.initOrderLookup = initOrderLookupPage;
window.UpressStaffPages.initReadyRelease = initReadyReleasePage;
window.UpressStaffPages.initCompleted = initCompletedPage;
window.UpressStaffPages.initOrderRelease = initOrderReleasePage;