(function() {
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  const containerId = 'kutzapp-review-widget-container';
  const existingContainer = document.getElementById(containerId);
  if (existingContainer) {
    existingContainer.remove();
  }

  // Find the script tag that has the data-shop-id. 
  let scriptTag = document.currentScript;
  if (!scriptTag || !scriptTag.getAttribute('data-shop-id')) {
    const scripts = document.querySelectorAll('script[src*="review-widget.js"], script[data-shop-id]');
    for (let i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].getAttribute('data-shop-id')) {
        scriptTag = scripts[i];
        break;
      }
    }
  }

  const shopId = (scriptTag && scriptTag.getAttribute('data-shop-id')) || (window.KutzApp && window.KutzApp.shopId);
  const primaryColor = (window.KutzApp && window.KutzApp.primaryColor) || (scriptTag && scriptTag.getAttribute('data-theme-color')) || '#1a1a1a';
  const secondaryColor = (window.KutzApp && window.KutzApp.secondaryColor) || (scriptTag && scriptTag.getAttribute('data-secondary-color')) || '#c0a05b';

  if (!shopId) {
    console.error('Review widget requires data-shop-id attribute or window.KutzApp.shopId');
    return;
  }

  const style = document.createElement('style');
  style.textContent = `
    .barber-review-modal-overlay {
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
    .barber-review-modal-content {
      width: 100%;
      max-width: 500px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      z-index: 999999;
      position: relative;
      padding: 30px;
      text-align: center;
      animation: fadeIn 0.3s ease-out;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .barber-review-modal-close {
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
    .barber-review-modal-close:hover {
      color: #cc0000;
    }
    .barber-review-title {
      font-size: 24px;
      font-weight: bold;
      margin-top: 10px;
      margin-bottom: 20px;
      color: ${primaryColor};
      line-height: 1.2;
    }
    
    /* View Reviews Tab */
    .barber-review-list-container {
      flex: 1;
      overflow-y: auto;
      text-align: left;
      margin-bottom: 20px;
      padding-right: 10px;
    }
    .barber-review-list-container::-webkit-scrollbar {
      width: 6px;
    }
    .barber-review-list-container::-webkit-scrollbar-track {
      background: #f0f0f0; 
      border-radius: 4px;
    }
    .barber-review-list-container::-webkit-scrollbar-thumb {
      background-color: ${secondaryColor}; 
      border-radius: 4px;
    }
    
    .barber-review-item {
      background: #f9f9f9;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
      border-left: 4px solid ${secondaryColor};
    }
    .barber-review-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .barber-review-author {
      font-weight: bold;
      color: #333;
    }
    .barber-review-stars {
      color: #eab308;
    }
    .barber-review-text {
      color: #555;
      font-size: 14px;
      line-height: 1.5;
    }
    
    /* Submit Review Tab */
    .barber-review-form {
      display: none;
      flex-direction: column;
      text-align: left;
      gap: 15px;
    }
    .barber-review-form label {
      font-weight: bold;
      color: #333;
      font-size: 14px;
    }
    .barber-review-form input, .barber-review-form textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-family: inherit;
    }
    .barber-review-form textarea {
      resize: vertical;
      min-height: 100px;
    }
    
    /* Star Rating Input */
    .barber-star-rating-input {
      display: flex;
      gap: 5px;
      font-size: 32px;
      cursor: pointer;
      color: #ddd;
      justify-content: center;
      margin-bottom: 10px;
    }
    .barber-star-rating-input span {
        transition: color 0.2s;
    }
    .barber-star-rating-input span:hover,
    .barber-star-rating-input span.active {
      color: #eab308;
    }
    
    .barber-review-btn-primary {
      display: inline-block;
      width: 100%;
      padding: 12px;
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
    .barber-review-btn-primary:hover {
      background: ${secondaryColor};
      color: ${primaryColor};
    }
    .barber-review-btn-primary:disabled {
      background: #ccc;
      color: #777;
      cursor: not-allowed;
    }
    
    .barber-review-btn-secondary {
      background: transparent;
      border: none;
      color: #555;
      cursor: pointer;
      text-decoration: underline;
      font-size: 14px;
      margin-top: 10px;
    }
    .barber-review-btn-secondary:hover {
      color: ${primaryColor};
    }
    .barber-review-toast {
      position: absolute;
      top: 12px;
      left: 12px;
      right: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      text-align: center;
      z-index: 1000000;
      animation: barberToastIn 0.3s ease-out;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .barber-review-toast--success {
      background: #16a34a;
    }
    .barber-review-toast--error {
      background: #dc2626;
    }
    @keyframes barberToastIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);

  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'barber-review-modal-overlay';
  
  const modalContent = document.createElement('div');
  modalContent.className = 'barber-review-modal-content';
  
  const closeButton = document.createElement('button');
  closeButton.className = 'barber-review-modal-close';
  closeButton.innerHTML = '&times;';
  closeButton.onclick = () => {
    modalOverlay.style.display = 'none';
  };
  
  const titleEl = document.createElement('div');
  titleEl.className = 'barber-review-title';
  titleEl.textContent = 'Client Reviews';
  
  // VIEW REVIEWS SECTION
  const listView = document.createElement('div');
  listView.style.display = 'flex';
  listView.style.flexDirection = 'column';
  listView.style.flex = '1';
  listView.style.overflow = 'hidden';
  
  const listContainer = document.createElement('div');
  listContainer.className = 'barber-review-list-container';
  listContainer.innerHTML = '<div style="text-align: center; color: #777; padding: 20px;">Loading reviews...</div>';
  
  const switchToWriteBtn = document.createElement('button');
  switchToWriteBtn.className = 'barber-review-btn-primary';
  switchToWriteBtn.textContent = 'Write a Review';
  
  listView.appendChild(listContainer);
  listView.appendChild(switchToWriteBtn);
  
  // WRITE REVIEW SECTION
  const formView = document.createElement('div');
  formView.className = 'barber-review-form';
  
  let selectedRating = 5;
  const ratingContainer = document.createElement('div');
  ratingContainer.style.textAlign = 'center';
  ratingContainer.innerHTML = '<label style="display:block; margin-bottom:5px;">Rating</label>';
  
  const starsDiv = document.createElement('div');
  starsDiv.className = 'barber-star-rating-input';
  
  function updateStarsUI(rating) {
      Array.from(starsDiv.children).forEach((s, idx) => {
        if(idx < rating) s.classList.add('active');
        else s.classList.remove('active');
      });
  }

  for(let i=1; i<=5; i++) {
    const star = document.createElement('span');
    star.innerHTML = '★';
    star.className = 'active';
    star.dataset.value = i;
    star.onclick = () => {
      selectedRating = i;
      updateStarsUI(selectedRating);
    };
    star.onmouseover = () => {
        updateStarsUI(i);
    };
    star.onmouseout = () => {
        updateStarsUI(selectedRating);
    }
    starsDiv.appendChild(star);
  }
  ratingContainer.appendChild(starsDiv);
  
  const commentContainer = document.createElement('div');
  commentContainer.innerHTML = '<label style="display:block; margin-bottom:5px;">Your Review (Optional)</label>';
  const commentInput = document.createElement('textarea');
  commentInput.placeholder = 'Tell us about your experience...';
  commentContainer.appendChild(commentInput);
  
  const submitBtn = document.createElement('button');
  submitBtn.className = 'barber-review-btn-primary';
  submitBtn.textContent = 'Submit Review';
  
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'barber-review-btn-secondary';
  cancelBtn.textContent = 'Back to Reviews';

  formView.appendChild(ratingContainer);
  formView.appendChild(commentContainer);
  formView.appendChild(submitBtn);
  formView.appendChild(cancelBtn);

  modalContent.appendChild(closeButton);
  modalContent.appendChild(titleEl);
  modalContent.appendChild(listView);
  modalContent.appendChild(formView);
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.style.display = 'none';
    }
  });

  // Toggle Logic
  switchToWriteBtn.onclick = () => {
    listView.style.display = 'none';
    formView.style.display = 'flex';
    titleEl.textContent = 'Write a Review';
  };
  
  cancelBtn.onclick = () => {
    formView.style.display = 'none';
    listView.style.display = 'flex';
    titleEl.textContent = 'Client Reviews';
  };
  
  function renderStars(rating) {
    let stars = '';
    for(let i=1; i<=5; i++) {
      if(i <= rating) stars += '★';
      else stars += '☆';
    }
    return stars;
  }

  // Fetch Reviews Logic
  async function loadReviews() {
    listContainer.innerHTML = '<div style="text-align: center; color: #777; padding: 20px;">Loading reviews...</div>';
    try {
      const res = await fetch(`/api/shops/${shopId}/reviews`);
      if(!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      
      if(!data.reviews || data.reviews.length === 0) {
        listContainer.innerHTML = '<div style="text-align: center; color: #777; padding: 20px;">No reviews yet. Be the first!</div>';
        return;
      }
      
      listContainer.innerHTML = '';
      data.reviews.forEach(review => {
        const item = document.createElement('div');
        item.className = 'barber-review-item';
        
        const date = new Date(review.createdAt).toLocaleDateString();
        const userName = review.user?.name || 'Verified Client';
        
        item.innerHTML = `
          <div class="barber-review-header">
            <span class="barber-review-author">${escapeHtml(userName)}</span>
            <span class="barber-review-stars">${renderStars(review.rating)}</span>
          </div>
          <div class="barber-review-text">${escapeHtml(review.comment || '')}</div>
          <div style="font-size: 11px; color: #999; margin-top: 8px;">${escapeHtml(date)}</div>
        `;
        listContainer.appendChild(item);
      });
      
    } catch(err) {
      listContainer.innerHTML = '<div style="text-align: center; color: #cc0000; padding: 20px;">Could not load reviews.</div>';
    }
  }

  // Submit Review Logic
  submitBtn.onclick = async () => {
    const comment = commentInput.value.trim();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
      const res = await fetch(`/api/shops/${shopId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            rating: selectedRating, 
            comment: comment 
        })
      });
      
      if(!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit review');
      }
      
      var successToast = document.createElement('div');
      successToast.className = 'barber-review-toast barber-review-toast--success';
      successToast.textContent = 'Review submitted successfully! Thank you.';
      modalContent.appendChild(successToast);
      setTimeout(function() { if (successToast.parentNode) successToast.parentNode.removeChild(successToast); }, 3000);
      commentInput.value = '';
      selectedRating = 5;
      updateStarsUI(5);
      
      // Go back to list and refresh
      cancelBtn.onclick();
      loadReviews();
      
    } catch(err) {
      var errorToast = document.createElement('div');
      errorToast.className = 'barber-review-toast barber-review-toast--error';
      errorToast.textContent = 'Error: ' + err.message;
      modalContent.appendChild(errorToast);
      setTimeout(function() { if (errorToast.parentNode) errorToast.parentNode.removeChild(errorToast); }, 4000);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Review';
    }
  };

  window.BarberReviews = {
    open: function(showWriteForm = false) {
      modalOverlay.style.display = 'flex';
      if (showWriteForm) {
        switchToWriteBtn.onclick();
      } else {
        cancelBtn.onclick(); // Reset to view mode
        loadReviews();
      }
    }
  };

  window.addEventListener('load', function() {
    // Automatically bind to elements with class 'btn-reviews' or 'barber-reviews-trigger'
    const triggers = document.querySelectorAll('.btn-reviews, .barber-reviews-trigger');
    triggers.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        window.BarberReviews.open();
      });
    });
  });

})();
