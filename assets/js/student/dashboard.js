(function () {

  function getDB() {
    if (typeof window.getDB === 'function') return window.getDB();
    try { return JSON.parse(localStorage.getItem('upressDB') || '{}'); } catch { return {}; }
  }

  function saveDB(db) {
    if (typeof window.saveDB === 'function') return window.saveDB(db);
    try { localStorage.setItem('upressDB', JSON.stringify(db)); } catch (e) { console.error(e); }
  }

  function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem('upressUser') || 'null'); } catch { return null; }
  }

  // ── SESSION GUARD ──────────────────────────────────────────────────────────

  function logout() {
    localStorage.removeItem('upressUser');
    window.location.href = '../auth/portal.html';
  }
  window.logout = logout;

  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = '../auth/portal.html';
    return;
  }

  // ── PROFILE UI ─────────────────────────────────────────────────────────────

  function getDisplayName(user) {
    return user.fullName || user.name || user.displayName || user.email || 'Student';
  }

  function getStatusBadgeHTML(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'approved' || s === 'verified') return '<span class="status-badge status-verified">Verified</span>';
    if (s === 'rejected') return '<span class="status-badge status-suspended">Rejected</span>';
    return '<span class="status-badge status-pending">Pending</span>';
  }

  function getAffiliation(user) {
    if (!Array.isArray(user.affiliations) || user.affiliations.length === 0) return null;
    const verified = user.affiliations.find(a => a.status === 'verified' || a.status === 'approved');
    return verified || user.affiliations[user.affiliations.length - 1];
  }

  function populateProfile() {
    const db = getDB();
    let user = currentUser;
    if (db.users) {
      const fresh = db.users.find(u => u.id === currentUser.id);
      if (fresh) user = fresh;
    }

    const name = getDisplayName(user);
    const email = user.email || '';
    const id = user.campusId || user.studentId || user.facultyId || '—';
    const status = user.status || user.accountStatus || 'pending';
    const affil = getAffiliation(user);

    const navName = document.getElementById('nav-profile-display-name');
    if (navName) navName.textContent = name.split(' ')[0];

    const welcomeName = document.getElementById('welcome-name');
    if (welcomeName) welcomeName.textContent = name;
    const welcomeEmail = document.getElementById('welcome-email');
    if (welcomeEmail) welcomeEmail.textContent = email;

    const panelName = document.getElementById('profile-panel-name');
    if (panelName) panelName.textContent = name;
    const panelId = document.getElementById('profile-panel-id');
    if (panelId) panelId.textContent = 'ID: ' + id;
    const panelEmail = document.getElementById('profile-panel-email');
    if (panelEmail) panelEmail.textContent = email;
    const panelStatus = document.getElementById('profile-panel-status');
    if (panelStatus) panelStatus.innerHTML = getStatusBadgeHTML(status);

    const panelAffil = document.getElementById('profile-panel-affil');
    const panelAffilName = document.getElementById('profile-panel-affil-name');
    if (affil && panelAffil && panelAffilName) {
      panelAffilName.textContent = affil.organizationName || '—';
      panelAffil.style.display = 'flex';
    } else if (panelAffil) {
      panelAffil.style.display = 'none';
    }

    const banner = document.getElementById('account-status-banner');
    if (banner) {
      const s = String(status).toLowerCase();
      if (s === 'pending') {
        banner.style.display = 'block';
        banner.className = 'account-status-banner account-status-banner--pending';
        banner.textContent = 'Your account is pending verification. Some features may be limited until your account is approved.';
      } else {
        banner.style.display = 'none';
      }
    }
  }

  // ── PROFILE PANEL ──────────────────────────────────────────────────────────

  function toggleProfilePanel() {
    const panel = document.getElementById('profile-panel');
    const overlay = document.getElementById('profileOverlay');
    const notifPanel = document.getElementById('notif-panel');
    if (!panel) return;
    if (notifPanel) notifPanel.style.display = 'none';
    if (panel.classList.contains('open')) {
      closeProfilePanel();
      return;
    }
    panel.style.display = 'block';
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => panel.classList.add('open'));
  }
  window.toggleProfilePanel = toggleProfilePanel;

  function closeProfilePanel() {
    const panel = document.getElementById('profile-panel');
    const overlay = document.getElementById('profileOverlay');
    if (!panel) return;
    panel.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
    panel.addEventListener('transitionend', function hideAfterTransition() {
      panel.style.display = 'none';
      panel.removeEventListener('transitionend', hideAfterTransition);
    }, { once: true });
  }
  window.closeProfilePanel = closeProfilePanel;

  // ── NOTIFICATION PANEL ─────────────────────────────────────────────────────

  function toggleNotifPanel() {
    const panel = document.getElementById('notif-panel');
    const profilePanel = document.getElementById('profile-panel');
    if (!panel) return;
    if (profilePanel) profilePanel.style.display = 'none';
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block') renderNotifications();
  }
  window.toggleNotifPanel = toggleNotifPanel;

  function renderNotifications() {
    const db = getDB();
    const notifList = document.getElementById('notif-list');
    const notifBadge = document.getElementById('notif-badge');
    if (!notifList) return;

    const userNotifs = (db.notifications || []).filter(n => n.userId === currentUser.id);
    const unread = userNotifs.filter(n => !n.read);

    if (notifBadge) {
      if (unread.length > 0) {
        notifBadge.style.display = 'flex';
        notifBadge.textContent = unread.length > 9 ? '9+' : unread.length;
      } else {
        notifBadge.style.display = 'none';
      }
    }

    if (userNotifs.length === 0) {
      notifList.innerHTML = '<div class="sidebar-empty-icon"><span class="upress-icon upress-icon--bell" aria-hidden="true"></span></div><p>No notifications yet.</p>';
      notifList.className = 'notif-empty';
      return;
    }

    notifList.className = '';
    notifList.innerHTML = userNotifs.slice().reverse().map(n => {
      const date = n.createdAt ? new Date(n.createdAt).toLocaleString() : '';
      return `<div class="notif-item${n.read ? ' notif-item--read' : ''}" data-id="${n.id}">
        <div class="notif-item-msg">${n.message}</div>
        <div class="notif-item-date">${date}</div>
      </div>`;
    }).join('');

    const db2 = getDB();
    (db2.notifications || []).forEach(n => { if (n.userId === currentUser.id) n.read = true; });
    saveDB(db2);
    if (notifBadge) notifBadge.style.display = 'none';
  }

  function clearNotifications() {
    const db = getDB();
    db.notifications = (db.notifications || []).filter(n => n.userId !== currentUser.id);
    saveDB(db);
    renderNotifications();
  }
  window.clearNotifications = clearNotifications;

  // ── SIDEBAR ────────────────────────────────────────────────────────────────

  function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  window.openSidebar = openSidebar;

  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
    document.body.style.overflow = '';
  }
  window.closeSidebar = closeSidebar;

  function switchSidebarTab(tab, btn) {
    document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const panel = document.getElementById('panel-' + tab);
    if (panel) panel.classList.add('active');
    if (tab === 'cart') renderSidebarCart();
    if (tab === 'orders') renderSidebarOrders();
    if (tab === 'history') renderSidebarHistory();
  }
  window.switchSidebarTab = switchSidebarTab;

  function openSidebarCart() {
    openSidebar();
    const cartTab = document.querySelector('.sidebar-tab:nth-child(2)');
    if (cartTab) switchSidebarTab('cart', cartTab);
  }
  window.openSidebarCart = openSidebarCart;

  function goToFullOrders() { window.location.href = 'orders.html'; }
  window.goToFullOrders = goToFullOrders;

  // ── CART ───────────────────────────────────────────────────────────────────

  function getCart() {
    const db = getDB();
    return (db.carts || {})[currentUser.id] || [];
  }

  function saveCart(cart) {
    const db = getDB();
    if (!db.carts) db.carts = {};
    db.carts[currentUser.id] = cart;
    saveDB(db);
  }

  function renderSidebarCart() {
    const cart = getCart();
    const listEl = document.getElementById('sidebar-cart-list');
    const totalEl = document.getElementById('sidebar-cart-total');
    const countEl = document.getElementById('sidebar-selected-count');
    const badge = document.getElementById('sidebar-cart-nav-badge');
    const checkoutBtn = document.getElementById('sidebar-checkout-btn');

    if (badge) {
      if (cart.length > 0) { badge.style.display = 'flex'; badge.textContent = cart.length; }
      else badge.style.display = 'none';
    }

    if (!listEl) return;

    if (cart.length === 0) {
      listEl.innerHTML = '<div class="sidebar-empty-state"><div class="sidebar-empty-icon"><span class="upress-icon upress-icon--cart"></span></div><p>Your cart is empty.</p></div>';
      if (totalEl) totalEl.textContent = '₱0.00';
      if (countEl) countEl.textContent = '0 selected';
      if (checkoutBtn) checkoutBtn.disabled = true;
      return;
    }

    listEl.innerHTML = cart.map((item, i) => `
      <div class="sidebar-cart-item">
        <div class="sc-check-wrap">
          <input type="checkbox" class="sc-item-check" data-index="${i}" ${item.selected ? 'checked' : ''} onchange="sidebarCartItemCheck(${i}, this.checked)">
        </div>
        <div class="sc-info">
          <div class="sc-service">${item.serviceName || item.service || 'Service'}</div>
          <div class="sc-desc">${item.description || ''}</div>
          <div class="sc-qty-row">
            <button class="sc-qty-btn" onclick="sidebarCartQty(${i}, -1)">-</button>
            <span class="sc-qty-val">${item.quantity || 1}</span>
            <button class="sc-qty-btn" onclick="sidebarCartQty(${i}, 1)">+</button>
            <span class="sc-unit-price">@ ₱${Number(item.price || 0).toFixed(2)}</span>
          </div>
        </div>
        <div class="sc-right">
          <span class="sc-price">₱${(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}</span>
          <button class="sc-remove-btn" onclick="sidebarCartRemove(${i})" title="Remove">
            <span class="upress-icon upress-icon--trash"></span>
          </button>
        </div>
      </div>
    `).join('');

    updateCartTotals();
  }

  function updateCartTotals() {
    const cart = getCart();
    const selected = cart.filter(i => i.selected);
    const total = selected.reduce((s, i) => s + Number(i.price || 0) * Number(i.quantity || 1), 0);
    const totalEl = document.getElementById('sidebar-cart-total');
    const countEl = document.getElementById('sidebar-selected-count');
    const checkoutBtn = document.getElementById('sidebar-checkout-btn');
    if (totalEl) totalEl.textContent = '₱' + total.toFixed(2);
    if (countEl) countEl.textContent = selected.length + ' selected';
    if (checkoutBtn) checkoutBtn.disabled = selected.length === 0;
    renderDashCartPreview();
  }

  function sidebarSelectAll(checked) {
    const cart = getCart();
    cart.forEach(i => i.selected = checked);
    saveCart(cart);
    renderSidebarCart();
  }
  window.sidebarSelectAll = sidebarSelectAll;

  function sidebarCartItemCheck(index, checked) {
    const cart = getCart();
    if (cart[index]) cart[index].selected = checked;
    saveCart(cart);
    updateCartTotals();
  }
  window.sidebarCartItemCheck = sidebarCartItemCheck;

  function sidebarCartQty(index, delta) {
    const cart = getCart();
    if (!cart[index]) return;
    cart[index].quantity = Math.max(1, (cart[index].quantity || 1) + delta);
    saveCart(cart);
    renderSidebarCart();
  }
  window.sidebarCartQty = sidebarCartQty;

  function sidebarCartRemove(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderSidebarCart();
  }
  window.sidebarCartRemove = sidebarCartRemove;

  function sidebarClearCart() {
    if (!confirm('Clear all items from your cart?')) return;
    saveCart([]);
    renderSidebarCart();
  }
  window.sidebarClearCart = sidebarClearCart;

  function sidebarCheckout() {
    const cart = getCart();
    const selected = cart.filter(i => i.selected);
    if (selected.length === 0) return;
    window.location.href = 'checkout.html';
  }
  window.sidebarCheckout = sidebarCheckout;

  function renderDashCartPreview() {
    const cart = getCart();
    const previewBox = document.getElementById('dash-cart-preview');
    const previewItems = document.getElementById('dash-cart-preview-items');
    const previewTotal = document.getElementById('dash-cart-preview-total');
    const badge = document.getElementById('sidebar-cart-nav-badge');

    if (badge) {
      if (cart.length > 0) { badge.style.display = 'flex'; badge.textContent = cart.length; }
      else badge.style.display = 'none';
    }

    if (!previewBox) return;
    if (cart.length === 0) { previewBox.style.display = 'none'; return; }
    previewBox.style.display = 'block';
    const total = cart.reduce((s, i) => s + Number(i.price || 0) * Number(i.quantity || 1), 0);
    if (previewTotal) previewTotal.textContent = '₱' + total.toFixed(2);
    if (previewItems) {
      previewItems.innerHTML = cart.slice(0, 3).map(i => `
        <div class="dash-cart-preview-item">
          <span><span class="upress-icon upress-icon--pkg"></span> ${i.serviceName || i.service || 'Service'} x${i.quantity || 1}</span>
          <span>₱${(Number(i.price || 0) * Number(i.quantity || 1)).toFixed(2)}</span>
        </div>
      `).join('') + (cart.length > 3 ? `<div class="dash-cart-preview-item" style="color:#aaa;">...and ${cart.length - 3} more</div>` : '');
    }
  }

  // ── ORDERS ─────────────────────────────────────────────────────────────────

  function getUserOrders() {
    const db = getDB();
    return (db.orders || []).filter(o => o.userId === currentUser.id || o.studentId === currentUser.id);
  }

  let currentOrderFilter = 'all';

  function setOrderFilter(status) {
    currentOrderFilter = status;
    document.querySelectorAll('.order-status-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('onclick')?.includes(`'${status}'`) || tab.dataset.status === status);
    });
    renderSidebarOrders();
  }
  window.setOrderFilter = setOrderFilter;

  function renderSidebarOrders() {
    const orders = getUserOrders().filter(o => {
      const s = String(o.status || '').toLowerCase();
      return currentOrderFilter === 'all' ? true : s === currentOrderFilter;
    });
    const listEl = document.getElementById('sidebar-orders-list');
    if (!listEl) return;
    if (orders.length === 0) {
      listEl.className = 'sidebar-empty-state';
      const headerText = {
        all: 'No orders yet.',
        pending: 'No pending orders yet.',
        processing: 'No processing orders yet.',
        completed: 'No completed orders yet.',
        cancelled: 'No cancelled orders yet.'
      }[currentOrderFilter] || 'No orders yet.';
      listEl.innerHTML = `<div class="sidebar-empty-icon"><span class="upress-icon upress-icon--pkg"></span></div><p>${headerText}</p><button type="button" class="sidebar-browse-btn" onclick="closeSidebar()">Browse Services</button>`;
      return;
    }
    listEl.className = '';
    listEl.innerHTML = orders.map(o => `
      <div class="sidebar-order-item">
        <span class="sidebar-order-name">${o.serviceName || o.service || 'Order'}</span>
        <span class="sidebar-order-meta">${o.date ? new Date(o.date).toLocaleDateString() : ''}
          <span class="sidebar-order-status status-${o.status || 'Pending'}">${o.status || 'Pending'}</span>
        </span>
        <span class="sidebar-order-price">₱${Number(o.amount || 0).toFixed(2)}</span>
      </div>
    `).join('');
  }

  function renderSidebarHistory() {
    const orders = getUserOrders().filter(o => {
      const s = String(o.status || '').toLowerCase();
      return ['completed', 'cancelled'].includes(s);
    });
    const listEl = document.getElementById('sidebar-history-list');
    if (!listEl) return;
    if (orders.length === 0) {
      listEl.className = 'sidebar-empty-state';
      listEl.innerHTML = '<div class="sidebar-empty-icon"><span class="upress-icon upress-icon--clock"></span></div><p>No completed orders yet.</p>';
      return;
    }
    listEl.className = '';
    listEl.innerHTML = orders.map(o => `
      <div class="sidebar-order-item">
        <span class="sidebar-order-name">${o.serviceName || o.service || 'Order'}</span>
        <span class="sidebar-order-meta">${o.date ? new Date(o.date).toLocaleDateString() : ''}
          <span class="sidebar-order-status status-${o.status || 'Completed'}">${o.status || 'Completed'}</span>
        </span>
        <span class="sidebar-order-price">₱${Number(o.amount || 0).toFixed(2)}</span>
      </div>
    `).join('');
  }

  // ── AFFILIATE MODAL ────────────────────────────────────────────────────────

  const orgCollegeMap = {
    'Computer Science Department': 'College of Computing Studies',
    'Mathematics Department': 'College of Science and Mathematics',
    'Physics Department': 'College of Science and Mathematics',
    'Chemistry Department': 'College of Science and Mathematics',
    'Biology Department': 'College of Science and Mathematics',
    'Engineering Department': 'College of Engineering',
    'Business Administration Department': 'College of Business Administration',
    'Education Department': 'College of Education',
    'Arts Department': 'College of Arts and Sciences',
    'Sports Department': 'Office of Student Affairs'
  };

  let affiliateOtpCode = null;

  function showAffiliateModal() {
    const db = getDB();
    const existing = (db.affiliationRequests || []).find(r =>
      r.userId === currentUser.id && r.status === 'pending'
    );
    if (existing) {
      alert('You already have a pending affiliation request. Please wait for it to be reviewed.');
      return;
    }
    goToAffiliateStep(1);
    document.getElementById('affiliate-modal').style.display = 'flex';
  }
  window.showAffiliateModal = showAffiliateModal;

  function closeAffiliateModal() {
    document.getElementById('affiliate-modal').style.display = 'none';

    // Reset step 1
    const sel = document.getElementById('affiliate-org-select');
    if (sel) sel.value = '';
    const specifyWrap = document.getElementById('affiliate-other-specify-wrap');
    if (specifyWrap) specifyWrap.style.display = 'none';
    const specify = document.getElementById('affiliate-org-specify');
    if (specify) specify.value = '';

    // Reset step 2
    const college = document.getElementById('affiliate-college-field');
    if (college) { college.value = ''; college.removeAttribute('readonly'); }
    const proofWrap = document.getElementById('affiliate-proof-wrap');
    if (proofWrap) proofWrap.style.display = 'none';
    const proofFile = document.getElementById('affiliate-proof-file');
    if (proofFile) proofFile.value = '';
    const pos = document.getElementById('affiliate-position-field');
    if (pos) pos.value = '';
    const contact = document.getElementById('affiliate-contact-field');
    if (contact) contact.value = '';
    const otp = document.getElementById('affiliate-otp-field');
    if (otp) { otp.value = ''; otp.disabled = true; }
    const sendBtn = document.getElementById('affiliate-send-otp-btn');
    if (sendBtn) { sendBtn.textContent = 'Send OTP'; sendBtn.disabled = false; }
    const submitBtn = document.getElementById('affiliate-submit-btn');
    if (submitBtn) submitBtn.disabled = true;

    affiliateOtpCode = null;
  }
  window.closeAffiliateModal = closeAffiliateModal;

  function goToAffiliateStep(step) {
    ['affiliate-step-1', 'affiliate-step-2', 'affiliate-step-success'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('affiliate-hidden');
    });

    if (step === 1) {
      document.getElementById('affiliate-step-1')?.classList.remove('affiliate-hidden');
    } else if (step === 2) {
      const sel = document.getElementById('affiliate-org-select');
      if (!sel || !sel.value) {
        alert('Please select an organization first.');
        document.getElementById('affiliate-step-1')?.classList.remove('affiliate-hidden');
        return;
      }
      document.getElementById('affiliate-step-2')?.classList.remove('affiliate-hidden');
    } else if (step === 'success') {
      document.getElementById('affiliate-step-success')?.classList.remove('affiliate-hidden');
    }
  }
  window.goToAffiliateStep = goToAffiliateStep;

  function onAffiliateOrgChange(value) {
    const specifyWrap = document.getElementById('affiliate-other-specify-wrap');
    const specify = document.getElementById('affiliate-org-specify');
    const collegeField = document.getElementById('affiliate-college-field');
    const proofWrap = document.getElementById('affiliate-proof-wrap');

    if (value === 'Other') {
      if (specifyWrap) specifyWrap.style.display = 'block';
      if (specify) specify.value = '';
      if (collegeField) { collegeField.value = ''; collegeField.removeAttribute('readonly'); }
      if (proofWrap) proofWrap.style.display = 'block';
    } else {
      if (specifyWrap) specifyWrap.style.display = 'none';
      if (specify) specify.value = '';
      if (collegeField) {
        collegeField.value = orgCollegeMap[value] || '';
        if (orgCollegeMap[value]) {
          collegeField.setAttribute('readonly', 'readonly');
        } else {
          collegeField.removeAttribute('readonly');
        }
      }
      if (proofWrap) proofWrap.style.display = 'none';
    }
  }
  window.onAffiliateOrgChange = onAffiliateOrgChange;

  function onProofUpload(input) {
    if (input.files && input.files[0]) {
      if (input.files[0].size > 5 * 1024 * 1024) {
        alert('File is too large. Maximum size is 5MB.');
        input.value = '';
      }
    }
  }
  window.onProofUpload = onProofUpload;

  function sendAffiliateOTP() {
    const contact = document.getElementById('affiliate-contact-field');
    if (!contact || !contact.value.match(/^09[0-9]{9}$/)) {
      alert('Please enter a valid Philippine mobile number (09XXXXXXXXX).');
      return;
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    affiliateOtpCode = otp;
    console.log('Demo OTP:', otp);

    const otpInput = document.getElementById('affiliate-otp-field');
    if (otpInput) {
      otpInput.disabled = false;
      otpInput.oninput = function () {
        const submitBtn = document.getElementById('affiliate-submit-btn');
        if (submitBtn) submitBtn.disabled = otpInput.value !== affiliateOtpCode;
      };
    }

    const sendBtn = document.getElementById('affiliate-send-otp-btn');
    if (sendBtn) {
      sendBtn.textContent = 'Resend OTP';
      sendBtn.disabled = true;
      setTimeout(() => { if (sendBtn) sendBtn.disabled = false; }, 30000);
    }

    alert('OTP sent! (Demo OTP: ' + otp + ')');
  }
  window.sendAffiliateOTP = sendAffiliateOTP;

  function submitAffiliateRequest() {
    const db = getDB();
    if (!Array.isArray(db.affiliationRequests)) db.affiliationRequests = [];

    const orgSelect = document.getElementById('affiliate-org-select');
    const orgSpecify = document.getElementById('affiliate-org-specify');
    const collegeField = document.getElementById('affiliate-college-field');
    const posField = document.getElementById('affiliate-position-field');
    const contactField = document.getElementById('affiliate-contact-field');
    const proofInput = document.getElementById('affiliate-proof-file');

    const selectedOrg = orgSelect ? orgSelect.value : '';
    const orgName = selectedOrg === 'Other'
      ? (orgSpecify ? orgSpecify.value.trim() : '')
      : selectedOrg;
    const college = collegeField ? collegeField.value.trim() : '';
    const position = posField ? posField.value.trim() : '';
    const contact = contactField ? contactField.value.trim() : '';

    if (!orgName || !college || !position || !contact) {
      alert('Please fill all required fields.');
      return;
    }

    const requestData = {
      id: 'affil_' + Date.now() + '_' + Math.random().toString(36).slice(2),
      userId: currentUser.id,
      userName: getDisplayName(currentUser),
      userEmail: currentUser.email || '',
      organizationType: selectedOrg === 'Other' ? 'other' : 'known',
      organizationName: orgName,
      college: college,
      position: position,
      contactNumber: contact,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    if (selectedOrg === 'Other' && proofInput && proofInput.files && proofInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
        requestData.proofImage = e.target.result;
        db.affiliationRequests.push(requestData);
        saveDB(db);
        goToAffiliateStep('success');
      };
      reader.readAsDataURL(proofInput.files[0]);
      return;
    }

    db.affiliationRequests.push(requestData);
    saveDB(db);
    goToAffiliateStep('success');
  }
  window.submitAffiliateRequest = submitAffiliateRequest;

  // ── CLOSE PANELS ON OUTSIDE CLICK ─────────────────────────────────────────

  document.addEventListener('click', function (e) {
    const notifPanel = document.getElementById('notif-panel');
    const notifBtn = document.getElementById('notif-btn');
    const profilePanel = document.getElementById('profile-panel');
    const profileBtn = document.getElementById('nav-profile-btn');

    if (notifPanel && notifPanel.style.display !== 'none') {
      if (!notifPanel.contains(e.target) && !notifBtn.contains(e.target)) {
        notifPanel.style.display = 'none';
      }
    }
    if (profilePanel && profilePanel.classList.contains('open')) {
      if (!profilePanel.contains(e.target) && !profileBtn.contains(e.target)) {
        closeProfilePanel();
      }
    }
  });

  // ── INIT ───────────────────────────────────────────────────────────────────

  function init() {
    populateProfile();
    renderDashCartPreview();
    renderSidebarOrders();
    renderNotifications();

    window.addEventListener('storage', function (e) {
      if (e.key === 'upressDB') {
        populateProfile();
        renderNotifications();
        renderDashCartPreview();
      }
    });
  }

  window.addEventListener('DOMContentLoaded', init);

})();