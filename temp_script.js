
    // Smooth scrolling nav
    document.querySelectorAll('.nav-link:not(.nav-cta)').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
        this.classList.add('active');
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          const headerOffset = document.querySelector('.navbar').offsetHeight;
          const elementPosition = targetElement.getBoundingClientRect().top;
          window.scrollTo({ top: elementPosition + window.scrollY - headerOffset, behavior: "smooth" });
        }
      });
    });

    window.addEventListener("load", function () {
      function initializeShop() {
        if (typeof BarberSaaS === "undefined") return;
        
        const urlParams = new URLSearchParams(window.location.search);
        let shopId = urlParams.get("shopId");
        if (!shopId) {
            try {
                const parentParams = new URLSearchParams(window.parent.location.search);
                shopId = parentParams.get("shopId");
            } catch(e) {}
        }
        if (!shopId) {
            try {
                const paths = window.parent.location.pathname.split('/');
                shopId = paths[paths.length - 1];
            } catch(e) {}
        }
        shopId = shopId || "cmn9kj24n0000lqzc7kcsmpst";
        
        let domain = window.location.origin;
        let isFileProtocol = window.location.protocol === "file:";
        
        if (domain === "null" || domain === "about://" || window.location.protocol === "about:" || isFileProtocol) {
          try { domain = window.parent.location.origin; } catch(e) {}
        }
        if (domain === "null" || domain === "about://" || domain === "file://" || !domain) {
          domain = "https://barbersaas-henna.vercel.app";
        }
        
        const apiUrlToUse = (domain.includes("localhost") || domain.includes("127.0.0.1")) && !isFileProtocol ? domain : "https://barbersaas-henna.vercel.app";

        // Initialize SDK
        BarberSaaS.init(shopId, { 
            position: "bottom-right",
            apiUrl: apiUrlToUse
        });

        BarberSaaS.getPublicData().then((data) => {
          try {
            const shop = data.shop || {};
            
            // 1. Extract dynamic theme colors
            const primaryColor = shop.primaryColor || "#E31837";
            const secondaryColor = shop.secondaryColor || "#000000";
            
            window.BarberSaaS.primaryColor = primaryColor;
            window.BarberSaaS.secondaryColor = secondaryColor;
            
            // 2. Apply Theme colors to root
            document.documentElement.style.setProperty('--primary', primaryColor, 'important');
            
            // 3. Inject CSS overrides for the external user profile (which loads outside the iframe) and Chatbot
            const styleEl = document.createElement('style');
            styleEl.innerHTML = \`
              :root {
                --primary: \${primaryColor} !important;
                --brand-color: \${primaryColor} !important;
              }
              .supabase-auth-ui_ui-button, [class*="supabase-"], [class*="avatar"], [class*="user-profile"], [class*="profile-badge"], a[href*="/sign-in"], .text-crm-primary {
                 color: \${primaryColor} !important;
                 border-color: \${primaryColor} !important;
              }
              [class*="avatar"] svg, [class*="user-profile"] svg, [class*="chat-button"], #widget-button, .bg-crm-primary {
                 fill: \${primaryColor} !important;
                 background-color: \${primaryColor} !important;
              }
            \`;
            document.body.appendChild(styleEl);

            // 4. Safely Inject Chatbot and Booking widgets
            setTimeout(() => {
                const cacheBuster = "?v=" + new Date().getTime();
                const widgetUrlPrefix = (isFileProtocol && domain === "file://") ? ".." : domain;
                
                const modalScript = document.createElement("script");
                modalScript.src = widgetUrlPrefix + "/booking-modal.js" + cacheBuster;
                modalScript.setAttribute("data-shop-id", shopId);
                modalScript.setAttribute("data-theme-color", primaryColor);
                document.body.appendChild(modalScript);
                
                const widgetScript = document.createElement("script");
                widgetScript.src = widgetUrlPrefix + "/booking-widget.js" + cacheBuster;
                widgetScript.setAttribute("data-shop-id", shopId);
                widgetScript.setAttribute("data-theme-color", primaryColor);
                document.body.appendChild(widgetScript);
                
                const reviewScript = document.createElement("script");
                reviewScript.src = widgetUrlPrefix + "/review-widget.js" + cacheBuster;
                reviewScript.setAttribute("data-shop-id", shopId);
                reviewScript.setAttribute("data-theme-color", primaryColor);
                document.body.appendChild(reviewScript);
            }, 50);

          } catch(e) { console.error(e); }

          // Render Data
          try {
            document.getElementById('dyn-shop-name').textContent = data.shop.name || "Sport Clips Haircuts";
            document.getElementById('dyn-shop-name-nav').textContent = data.shop.name || "SPORT CLIPS";
            document.getElementById('dyn-shop-desc').textContent = data.shop.description || "It's good to be a guy.";
            document.getElementById("about-loading").style.display = "none";
            document.getElementById("about-content").style.display = "block";
          } catch(e) {}

          try {
            const services = (data.services || []).filter(s => s.duration > 0);
            if (services.length > 0) {
              document.getElementById("services-list").innerHTML = services.map(s => \`
                <div class="card">
                  <h3 class="card-title">\${s.name}</h3>
                  <div class="card-price">$\${Number(s.price).toFixed(2)} <span style="font-size: 0.85rem; color: var(--text-main);">/ \${s.duration} MIN</span></div>
                  <p class="card-desc" title="\${s.description || ""}"><span style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.8em;">\${s.description || "The MVP Experience."}</span></p>
                  <button class="btn b-book" data-id="\${s.id}">Check In</button>
                </div>
              \`).join('');
              document.querySelectorAll(".b-book").forEach(b => b.addEventListener('click', e => {
                if (window.BarberBooking) window.BarberBooking.open(e.target.dataset.id);
              }));
            }
            document.getElementById("services-loading").style.display = "none";
            document.getElementById("services-content").style.display = "block";
          } catch(e) {}

          try {
            const products = data.products || [];
            if (products.length > 0) {
              document.getElementById("products-list").innerHTML = products.map(p => \`
                <div class="card" style="background: var(--white);">
                  <h3 class="card-title">\${p.name}</h3>
                  <div class="card-price">$\${Number(p.price).toFixed(2)}</div>
                  <p class="card-desc" title="\${p.name}\${p.description ? '\\n\\n' + p.description : ''}"><span style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.8em;">\${p.description || "Top-tier grooming gear."}</span></p>
                  <div class="card-actions">
                    <button class="btn btn-outline b-view" data-id="\${p.id}">Details</button>
                    <button class="btn b-buy" data-id="\${p.id}">Buy Now</button>
                  </div>
                </div>
              \`).join('');
              document.querySelectorAll(".b-buy").forEach(btn => btn.addEventListener("click", e => {
                BarberSaaS.getProductDetails(e.target.dataset.id).then(p => alert("Added to cart: 1x " + p.name));
              }));
              document.querySelectorAll(".b-view").forEach(btn => btn.addEventListener("click", e => {
                BarberSaaS.getProductDetails(e.target.dataset.id).then(p => {
                  let modal = document.getElementById("product-modal");
                  if (!modal) {
                    modal = document.createElement("div");
                    modal.id = "product-modal";
                    modal.style.cssText = "display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10001;align-items:center;justify-content:center;";
                    
                    const modalContent = document.createElement("div");
                    modalContent.style.cssText = "background:white;padding:30px;border-radius:8px;max-width:500px;width:90%;position:relative;box-shadow:0 10px 25px rgba(0,0,0,0.2);";
                    
                    const closeBtn = document.createElement("button");
                    closeBtn.innerHTML = "&times;";
                    closeBtn.style.cssText = "position:absolute;top:15px;right:15px;background:none;border:none;font-size:24px;cursor:pointer;color:#333;";
                    closeBtn.onclick = () => modal.style.display = "none";
                    
                    const title = document.createElement("h2");
                    title.id = "product-modal-title";
                    title.style.cssText = "color:var(--primary,#E31837);margin-top:0;margin-bottom:10px;text-transform:uppercase;font-weight:900;border-bottom:2px solid var(--primary,#E31837);padding-bottom:10px;";
                    
                    const price = document.createElement("div");
                    price.id = "product-modal-price";
                    price.style.cssText = "font-size:1.2rem;font-weight:900;margin-bottom:20px;";
                    
                    const desc = document.createElement("p");
                    desc.id = "product-modal-desc";
                    desc.style.cssText = "color:#555;line-height:1.6;";
                    
                    modalContent.appendChild(closeBtn);
                    modalContent.appendChild(title);
                    modalContent.appendChild(price);
                    modalContent.appendChild(desc);
                    modal.appendChild(modalContent);
                    document.body.appendChild(modal);
                    
                    modal.addEventListener("click", e => {
                      if(e.target === modal) modal.style.display = "none";
                    });
                  }
                  
                  document.getElementById("product-modal-title").textContent = p.name;
                  document.getElementById("product-modal-price").textContent = "$" + Number(p.price).toFixed(2);
                  document.getElementById("product-modal-desc").textContent = p.description || "No description available.";
                  modal.style.display = "flex";
                });
              }));
            }
            document.getElementById("products-loading").style.display = "none";
            document.getElementById("products-content").style.display = "block";
          } catch(e) {}

          try {
            const reviews = data.reviews || [];
            if (reviews.length > 0) {
              document.getElementById("reviews-list").innerHTML = reviews.slice(0, 3).map(r => \`
                <div class="testimonial">
                  <div class="testimonial-stars">\${"★".repeat(r.rating || 5)}</div>
                  <p class="testimonial-quote">\${r.comment || "Great experience, highly recommend!"}</p>
                </div>
              \`).join('');
            }
            document.getElementById("add-review-btn").addEventListener("click", () => {
              if (window.BarberReviews) {
                window.BarberReviews.open(true);
              } else {
                const aptId = prompt("Enter Check-In ID:");
                const rating = prompt("Rating (1-5):", "5");
                const comment = prompt("Comments:");
                if(aptId && rating && comment) {
                  BarberSaaS.submitReview({appointmentId: aptId, rating: parseInt(rating), comment}).then(() => alert("Highlight submitted!")).catch(e => alert("Error: " + e.message));
                }
              }
            });
            document.getElementById("reviews-loading").style.display = "none";
            document.getElementById("reviews-content").style.display = "block";
          } catch(e) {}
        }).catch(err => {
            console.error("Public Data Error: ", err);
            document.getElementById("services-loading").textContent = "Failed to load data. Please refresh.";
        });
      }

      if (typeof BarberSaaS !== "undefined") initializeShop();
      else {
        let attempts = 0;
        let intv = setInterval(() => {
          attempts++;
          if(typeof BarberSaaS !== "undefined" || attempts >= 50) { clearInterval(intv); initializeShop(); }
        }, 100);
      }
    });
  