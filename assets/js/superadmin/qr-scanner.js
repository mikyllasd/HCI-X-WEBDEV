"use strict";

/* ==========================================================
   QR SCANNER PAGE
   ========================================================== */

let cameraStream = null;

async function activateCamera() {
  const video = document.getElementById("qr-video");
  const placeholder = document.querySelector(".qr-placeholder");
  const btn = document.getElementById("activate-camera-btn");

  if (!navigator.mediaDevices?.getUserMedia) {
    alert("Camera access is not supported in this browser.");
    return;
  }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
    video.srcObject = cameraStream;
    video.classList.remove("hidden");
    placeholder?.classList.add("hidden");
    btn.textContent = "Deactivate Camera";
    btn.onclick = deactivateCamera;
  } catch (err) {
    alert(`Could not access camera: ${err.message}`);
  }
}

function deactivateCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }
  const video = document.getElementById("qr-video");
  video.srcObject = null;
  video.classList.add("hidden");
  document.querySelector(".qr-placeholder")?.classList.remove("hidden");
  const btn = document.getElementById("activate-camera-btn");
  btn.textContent = "Activate Camera";
  btn.onclick = activateCamera;
}

function searchOrderById() {
  const input = document.getElementById("qr-order-input");
  const result = document.getElementById("qr-result");
  const query = input?.value.trim().toUpperCase();

  if (!query) {
    result.className = "qr-result hidden";
    return;
  }

  const order = ORDERS.find((o) => o.id.toUpperCase() === query);

  if (order) {
    result.className = "qr-result found";
    result.innerHTML = `
      <strong>✓ Order Found</strong><br>
      <strong>Order ID:</strong> ${escHtml(order.id)}<br>
      <strong>Student:</strong> ${escHtml(order.email)}<br>
      <strong>Service:</strong> ${escHtml(order.service)}<br>
      <strong>Amount:</strong> ₱${order.amount.toFixed(2)}<br>
      <strong>Status:</strong> ${statusBadgeHTML(order.status)}<br>
      <strong>Payment:</strong> ${escHtml(order.payment)}<br>
      ${
        order.status === "ready"
          ? `<button class="btn btn--success btn--sm mt-3" onclick="releaseOrder('${order.id}')">Release Order</button>`
          : ""
      }`;
  } else {
    result.className = "qr-result not-found";
    result.innerHTML = `<strong>✗ Order Not Found</strong><br>No order matching <code>${escHtml(query)}</code> was found.`;
  }
}

function releaseOrder(orderId) {
  const order = ORDERS.find((o) => o.id === orderId);
  if (order) {
    order.status = "completed";
    searchOrderById();
    showToast(`Order ${orderId} marked as completed.`);
  }
}
window.releaseOrder = releaseOrder;

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("activate-camera-btn")
    ?.addEventListener("click", activateCamera);
  document
    .getElementById("qr-search-btn")
    ?.addEventListener("click", searchOrderById);
  document
    .getElementById("qr-order-input")
    ?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") searchOrderById();
    });
});
