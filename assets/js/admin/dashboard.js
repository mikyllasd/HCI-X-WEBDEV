(function () {
    // ── Profile panel toggle ──────────────────────────────────────────────
    function toggleProfilePanel() {
        const panel = document.getElementById('profile-panel');
        const notifPanel = document.getElementById('notif-panel');
        if (!panel) return;
        const isOpen = panel.style.display === 'block';
        if (notifPanel) notifPanel.style.display = 'none';
        panel.style.display = isOpen ? 'none' : 'block';
    }

    function closeProfilePanel() {
        const panel = document.getElementById('profile-panel');
        if (panel) panel.style.display = 'none';
    }

    // Close panels when clicking outside
    document.addEventListener('click', function (e) {
        const profilePanel = document.getElementById('profile-panel');
        const profileBtn   = document.getElementById('nav-profile-btn');
        const notifPanel   = document.getElementById('notif-panel');
        const notifBtn     = document.getElementById('notif-btn');

        if (profilePanel && profilePanel.style.display === 'block') {
            if (!profilePanel.contains(e.target) && !profileBtn.contains(e.target)) {
                profilePanel.style.display = 'none';
            }
        }
        if (notifPanel && notifPanel.style.display === 'block') {
            if (!notifPanel.contains(e.target) && !notifBtn.contains(e.target)) {
                notifPanel.style.display = 'none';
            }
        }
    });

    // ── Populate profile info in navbar + panel ───────────────────────────
    function loadUserProfile() {
        const db   = getDB();
        const user = db.currentUser || db.users?.[0] || null;
        if (!user) return;

        const firstName  = (user.name || user.fullName || 'Student').split(' ')[0];
        const initial    = firstName.charAt(0).toUpperCase();
        const fullName   = user.name || user.fullName || 'Student';
        const email      = user.email || 'student@wmsu.edu.ph';
        const studentId  = user.studentId || user.id || '0000-0000';
        const statusRaw  = String(user.status || 'pending').toLowerCase();

        // Navbar avatar + short name
        const avatarEl   = document.getElementById('nav-profile-avatar');
        const nameShort  = document.getElementById('nav-profile-name-short');
        if (avatarEl)  avatarEl.textContent  = initial;
        if (nameShort) nameShort.textContent = firstName;

        // Panel header
        const panelAvatar = document.getElementById('profile-panel-avatar');
        const panelName   = document.getElementById('profile-panel-name');
        const panelEmail  = document.getElementById('profile-panel-email');
        const panelId     = document.getElementById('profile-panel-id');
        const panelStatus = document.getElementById('profile-panel-status');
        if (panelAvatar) panelAvatar.textContent = initial;
        if (panelName)   panelName.textContent   = fullName;
        if (panelEmail)  panelEmail.textContent   = email;
        if (panelId)     panelId.textContent      = 'ID: ' + studentId;

        if (panelStatus) {
            const statusMap = {
                approved: ['status-verified', 'Verified'],
                verified: ['status-verified', 'Verified'],
                pending:  ['status-pending',  'Pending'],
                active:   ['status-active',   'Active'],
            };
            const [cls, label] = statusMap[statusRaw] || ['status-other', statusRaw];
            panelStatus.innerHTML = `<span class="status-badge ${cls}">${label}</span>`;
        }

        // Welcome card
        const welcomeName  = document.getElementById('welcome-name');
        const welcomeEmail = document.getElementById('welcome-email');
        if (welcomeName)  welcomeName.textContent  = firstName;
        if (welcomeEmail) welcomeEmail.textContent = email;

        // Affiliation in panel
        const affWrap  = document.getElementById('profile-panel-affiliation-wrap');
        const affValue = document.getElementById('profile-panel-aff-value');
        const verified = (user.affiliations || []).find(a => a.status === 'verified');
        if (verified && affWrap && affValue) {
            affWrap.style.display  = 'flex';
            affValue.textContent   = verified.organizationName || '—';
        } else if (affWrap) {
            affWrap.style.display  = 'none';
        }

        // Account status banner
        const banner = document.getElementById('account-status-banner');
        if (banner && statusRaw === 'pending') {
            banner.className = 'account-status-banner account-status-banner--pending';
            banner.style.display = 'block';
            banner.textContent = '⚠ Your account is pending verification. Some features may be limited.';
        }
    }

    // ── Check if user has an approved affiliation ─────────────────────────
    function userHasApprovedAffiliation() {
        const db   = getDB();
        const user = db.currentUser || db.users?.[0] || null;
        if (!user) return false;
        return (user.affiliations || []).some(a => a.status === 'verified');
    }

    // Expose globally so create-order.html can call this
    window.userHasApprovedAffiliation = userHasApprovedAffiliation;

    // ── Expose panel functions globally ───────────────────────────────────
    window.toggleProfilePanel = toggleProfilePanel;
    window.closeProfilePanel  = closeProfilePanel;

    // ── Init ──────────────────────────────────────────────────────────────
    loadUserProfile();
})();