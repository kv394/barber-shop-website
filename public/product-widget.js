(function() {
  const containerId = 'barbersaas-product-widget-container';
  const existingContainer = document.getElementById(containerId);
  if (existingContainer) {
    existingContainer.remove();
  }

  // Find the script tag that has the data-shop-id. 
  let scriptTag = document.currentScript;
  if (!scriptTag || !scriptTag.getAttribute('data-shop-id')) {
    const scripts = document.querySelectorAll('script[src*="product-widget.js"], script[data-shop-id]');
    for (let i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].getAttribute('data-shop-id')) {
        scriptTag = scripts[i];
        break;
      }
    }
  }

  if (!scriptTag) {
    console.error('Product widget script tag not found');
    return;
  }
  
  const shopId = scriptTag.getAttribute('data-shop-id') || (window.BarberSaaS && window.BarberSaaS.shopId);
  const primaryColor = (window.BarberSaaS && window.BarberSaaS.primaryColor) || scriptTag.getAttribute('data-theme-color') || '#1a1a1a';
  const secondaryColor = (window.BarberSaaS && window.BarberSaaS.secondaryColor) || scriptTag.getAttribute('data-secondary-color') || '#c0a05b';
  
  if (!shopId) {
    console.error('Product widget requires data-shop-id attribute');
    return;
  }

  const style = document.createElement('style');
  style.textContent = `
    .barber-product-modal-overlay {
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
      font-family: Arial, sans-serif;
      backdrop-filter: blur(4px);
    }
    .barber-product-modal-content {
      width: 100%;
      max-width: 450px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      z-index: 999999;
      position: relative;
      padding: 30px;
      text-align: center;
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .barber-product-modal-close {
      position: absolute;
      top: 15px;
      right: 20px;
      background: transparent;
      border: none;
      font-size: 28px;
      cursor: pointer;
      color: #333;
      transition: color 0.2s;
    }
    .barber-product-modal-close:hover {
      color: #cc0000;
    }
    .barber-product-title {
      font-size: 24px;
      font-weight: bold;
      margin-top: 10px;
      margin-bottom: 10px;
      color: ${primaryColor};
      line-height: 1.2;
    }
    .barber-product-desc {
      font-size: 15px;
      color: #555;
      margin-bottom: 25px;
      line-height: 1.6;
      text-align: left;
      max-height: 200px;
      overflow-y: auto;
      padding: 10px;
      background: #f9f9f9;
      border-radius: 8px;
    }
    .barber-product-price {
      font-size: 22px;
      font-weight: bold;
      color: ${secondaryColor};
      margin-bottom: 20px;
    }
    .barber-product-buy-btn {
      display: inline-block;
      width: 100%;
      padding: 14px;
      background: ${primaryColor};
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: all 0.3s ease;
    }
    .barber-product-buy-btn:hover {
      background: ${secondaryColor};
      color: ${primaryColor};
      box-shadow: 0 4px 12px rgba(192, 160, 91, 0.3);
    }
  `;
  document.head.appendChild(style);

  // Modal overlay
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'barber-product-modal-overlay';
  
  const modalContent = document.createElement('div');
  modalContent.className = 'barber-product-modal-content';
  
  const closeButton = document.createElement('button');
  closeButton.className = 'barber-product-modal-close';
  closeButton.innerHTML = '&times;';
  closeButton.onclick = () => {
    modalOverlay.style.display = 'none';
  };
  
  const titleEl = document.createElement('div');
  titleEl.className = 'barber-product-title';
  
  const priceEl = document.createElement('div');
  priceEl.className = 'barber-product-price';

  const descEl = document.createElement('div');
  descEl.className = 'barber-product-desc';

  const buyBtn = document.createElement('button');
  buyBtn.className = 'barber-product-buy-btn';
  buyBtn.textContent = 'Add to Cart / Buy Now';

  modalContent.appendChild(closeButton);
  modalContent.appendChild(titleEl);
  modalContent.appendChild(priceEl);
  modalContent.appendChild(descEl);
  modalContent.appendChild(buyBtn);
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.style.display = 'none';
    }
  });

  window.BarberProductDetails = {
    open: function(productName, productPrice, productDesc) {
      titleEl.textContent = productName;
      priceEl.textContent = productPrice;
      
      // Strip out strong/ul/li tags for plain text display in modal or render as HTML if safe
      // Since desc comes from our custom HTML it's relatively safe, but let's just use textContent for safety
      descEl.textContent = productDesc || 'A premium grooming product from Heritage Haircuts.';
      
      modalOverlay.style.display = 'flex';
      
      buyBtn.onclick = function() {
        alert('Shopping Cart feature coming soon!\\n\\nWe are integrating online product checkouts for: ' + productName + '.');
        modalOverlay.style.display = 'none';
      };
    }
  };

  window.addEventListener('load', function() {
    // Find all 'Details' buttons
    const detailsButtons = document.querySelectorAll('.btn-details');
    // Find all 'Buy' buttons
    const buyButtons = document.querySelectorAll('.btn-buy');

    detailsButtons.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const card = btn.closest('.service-card');
        if (card) {
          const name = card.querySelector('.service-name')?.textContent?.trim();
          const price = card.querySelector('.service-price')?.textContent?.trim();
          const desc = card.querySelector('.service-description')?.textContent?.trim();
          window.BarberProductDetails.open(name, price, desc);
        }
      });
    });

    buyButtons.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const card = btn.closest('.service-card');
        if (card) {
          const name = card.querySelector('.service-name')?.textContent?.trim();
          alert('Shopping Cart feature coming soon!\\n\\nWe are integrating online product checkouts for: ' + name + '.');
        }
      });
    });
  });

})();
