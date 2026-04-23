(function() {
  let scriptTag = document.currentScript;
  
  if (!scriptTag || !scriptTag.getAttribute('data-shop-id')) {
    const scripts = document.querySelectorAll('script[src*="booking-modal.js"], script[data-shop-id]');
    for (let i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].getAttribute('data-shop-id')) {
        scriptTag = scripts[i];
        break;
      }
    }
  }

  if (!scriptTag) {
    console.error('Booking modal script tag not found');
    return;
  }

  const shopId = scriptTag.getAttribute('data-shop-id');
  const scriptTagSrc = scriptTag.src || 'https://barbersaas.com/booking-modal.js';
  const parsedUrl = new URL(scriptTagSrc);
  const baseUrl = scriptTag.getAttribute('data-base-url') || parsedUrl.origin;
  
  // Create styles
  const style = document.createElement('style');
  style.innerHTML = `
    .barber-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999998;
      display: none;
      align-items: center;
      justify-content: center;
    }
    .barber-modal-content {
      width: 100%;
      max-width: 500px;
      height: 90vh;
      max-height: 800px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      z-index: 999999;
      position: relative;
    }
    @media (max-width: 600px) {
      .barber-modal-content {
        height: 100vh;
        max-height: 100vh;
        border-radius: 0;
        top: auto;
        bottom: 0;
        position: absolute;
      }
    }
    .barber-modal-close {
      position: absolute;
      top: 10px;
      right: 15px;
      background: transparent;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #333;
      z-index: 1000000;
    }
    .barber-modal-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  `;
  document.head.appendChild(style);

  // Create Modal Structure
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'barber-modal-overlay';
  
  const modalContent = document.createElement('div');
  modalContent.className = 'barber-modal-content';
  
  const closeButton = document.createElement('button');
  closeButton.className = 'barber-modal-close';
  closeButton.innerHTML = '&times;';
  closeButton.onclick = () => {
    modalOverlay.style.display = 'none';
  };
  
  const iframe = document.createElement('iframe');
  iframe.className = 'barber-modal-iframe';
  
  modalContent.appendChild(closeButton);
  modalContent.appendChild(iframe);
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  // Close when clicking outside
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.style.display = 'none';
    }
  });

  // Listen for close message from iframe
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'CLOSE_MODAL') {
      modalOverlay.style.display = 'none';
    }
  });

  // Expose a global function to open the modal
  window.BarberBooking = {
    open: function() {
      iframe.src = \`\${baseUrl}/embed/book/\${shopId}\`;
      modalOverlay.style.display = 'flex';
    }
  };

  // If a button with id="barber-booking-btn" exists, bind it automatically
  const btn = document.getElementById('barber-booking-btn');
  if (btn) {
    btn.addEventListener('click', window.BarberBooking.open);
  }
})();
