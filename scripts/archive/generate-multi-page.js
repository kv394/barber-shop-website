const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '../public/html-sections');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const sharedStyles = `
    :root {
      --primary-color: #1a1a1a;
      --secondary-color: #f5f5f5;
      --accent-gold: #c0a05b;
      --accent-red: #cc0000;
      --text-color: #333333;
      --button-bg: #000;
      --button-text: #fff;
    }
    body {
      font-family: "Times New Roman", Times, serif;
      background-color: var(--secondary-color);
      color: var(--text-color);
      line-height: 1.8;
      margin: 0;
      padding: 0;
    }
    .navbar {
      background-color: var(--primary-color);
      padding: 20px 0;
      text-align: center;
    }
    .navbar a {
      color: var(--button-text);
      text-decoration: none;
      margin: 0 20px;
      font-family: Arial, sans-serif;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: bold;
      transition: color 0.2s;
    }
    .navbar a:hover {
      color: var(--accent-gold);
    }
    #heritage-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      box-sizing: border-box;
    }
    .content-section {
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      border-top: 10px solid var(--primary-color);
      border-radius: 8px;
      padding: 40px;
      margin-bottom: 60px;
      width: 100%;
      box-sizing: border-box;
    }
    .text-content-wrapper { max-width: 900px; margin: 0 auto; }
    header.shop-welcome { text-align: center; margin-top: 20px; margin-bottom: 50px; border-bottom: 2px dashed #cccccc; padding-bottom: 20px; }
    h1.main-title { font-family: Arial, sans-serif; color: var(--primary-color); font-size: 3.2em; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2.5px; }
    h1.main-title .brand-accent { color: var(--accent-gold); font-style: italic; }
    .intro-paragraph { font-size: 1.15em; color: #555; }
    h2.section-header { font-family: Arial, sans-serif; color: #ffffff; background-color: var(--primary-color); padding: 12px 24px; display: inline-block; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 40px; margin-bottom: 20px; border-radius: 4px; }
    .brand-inline { color: var(--primary-color); font-weight: bold; }
    mark.vibrant-keyword { background-color: rgba(192, 160, 91, 0.2); color: var(--primary-color); padding: 0 4px; font-style: normal; font-weight: bold; }
    .services-container ul.services-list { list-style: none; padding: 0; border-left: 4px solid var(--accent-gold); padding-left: 30px; margin-top: 25px; margin-bottom: 30px; }
    li.service-item { margin-bottom: 12px; font-size: 1.15em; position: relative; }
    li.service-item::before { content: "✂"; color: var(--accent-red); margin-right: 12px; font-size: 0.95em; }
    section.philosophy-container { margin-bottom: 40px; }
    .services-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 30px; padding-top: 20px; }
    .service-card { background-color: #fcfcfc; border: 1px solid #e0e0e0; padding: 30px; border-radius: 8px; display: flex; flex-direction: column; transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; position: relative; }
    .service-card:hover { transform: translateY(-5px); box-shadow: 0 5px 20px rgba(192, 160, 91, 0.15); border-color: var(--accent-gold); }
    .service-card::before { content: ""; position: absolute; top: 0; left: 0; bottom: 0; width: 5px; background-color: var(--accent-gold); border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
    .service-name { font-family: Arial, sans-serif; color: var(--primary-color); font-size: 1.7em; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; }
    .service-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px dashed #eeeeee; }
    .service-price { color: var(--accent-gold); font-weight: bold; font-size: 1.5em; font-family: Arial, sans-serif; }
    .service-duration { color: #777; font-size: 0.95em; text-transform: uppercase; display: flex; align-items: center; gap: 5px; font-style: italic; }
    .service-description { margin: 0 0 25px 0; color: #555; font-size: 1.05em; flex-grow: 1; }
    .scrollable-desc { max-height: 180px; overflow-y: auto; padding-right: 10px; margin-bottom: 25px; flex-grow: 1; scrollbar-width: thin; scrollbar-color: var(--accent-gold) #f0f0f0; }
    .scrollable-desc::-webkit-scrollbar { width: 6px; }
    .scrollable-desc::-webkit-scrollbar-track { background: #f0f0f0; border-radius: 4px; }
    .scrollable-desc::-webkit-scrollbar-thumb { background-color: var(--accent-gold); border-radius: 4px; }
    .barber-booking-trigger, .barber-reviews-trigger { display: block; width: 100%; text-align: center; padding: 14px 24px; background: var(--button-bg); color: var(--button-text); border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 1.05em; text-transform: uppercase; letter-spacing: 1.5px; transition: background 0.3s ease, transform 0.1s ease; text-decoration: none; font-family: Arial, sans-serif; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); }
    .barber-booking-trigger:hover, .barber-reviews-trigger:hover { background: var(--accent-gold); color: var(--primary-color); box-shadow: 0 4px 10px rgba(192, 160, 91, 0.4); }
    .barber-booking-trigger:active, .barber-reviews-trigger:active { transform: translateY(1px); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); }
    .action-buttons { display: flex; gap: 15px; width: 100%; margin-top: auto; }
    .btn { flex: 1; text-align: center; padding: 12px 0; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 1em; text-transform: uppercase; letter-spacing: 1.5px; transition: all 0.3s ease; font-family: Arial, sans-serif; }
    .btn-buy { background: var(--button-bg); color: var(--button-text); border: 2px solid var(--button-bg); box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); }
    .btn-buy:hover { background: var(--accent-gold); border-color: var(--accent-gold); color: var(--primary-color); box-shadow: 0 4px 10px rgba(192, 160, 91, 0.4); }
    .btn-details { background: transparent; color: var(--primary-color); border: 2px solid var(--primary-color); }
    .btn-details:hover { background: var(--secondary-color); color: var(--accent-gold); border-color: var(--accent-gold); }
    .review-btn-container { text-align: center; margin-top: 30px; }
    .barber-reviews-trigger { display: inline-block; padding: 12px 30px; background: transparent; color: var(--primary-color); border: 2px solid var(--primary-color); width: auto; }
`;

const getBaseHtml = (title, activePage, content, scriptBody) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Heritage Haircuts</title>
  <style>
    ${sharedStyles}
    .navbar a.active { color: var(--accent-gold); border-bottom: 2px solid var(--accent-gold); padding-bottom: 5px; }
  </style>
</head>
<body>
  <nav class="navbar">
    <a href="about.html" class="${activePage === 'about' ? 'active' : ''}">About Us</a>
    <a href="services.html" class="${activePage === 'services' ? 'active' : ''}">Services</a>
    <a href="products.html" class="${activePage === 'products' ? 'active' : ''}">Products</a>
    <a href="reviews.html" class="${activePage === 'reviews' ? 'active' : ''}">Reviews</a>
  </nav>

  <article id="heritage-container">
    <div id="loading-spinner" style="text-align: center; padding: 100px 20px; font-size: 1.5em; color: var(--primary-color); font-family: Arial, sans-serif;">
      Loading ${title}...
    </div>
    <div id="page-content" style="display: none;">
      ${content}
    </div>
  </article>

  <!-- KutzApp SDK -->
  <script src="https://kutzapp-henna.vercel.app/kutzapp-sdk.js"></script>
  <!-- Booking Modal logic -->
  <script src="https://kutzapp-henna.vercel.app/booking-modal.js" data-shop-id="cmn9kj24n0000lqzc7kcsmpst"></script>

  <script>
    window.addEventListener("load", function () {
      function initializeShop() {
        if (typeof KutzApp === "undefined") {
          console.error("KutzApp SDK script failed to load or initialize.");
          document.getElementById("heritage-container").innerHTML =
            '<div style="text-align: center; padding: 100px;"><h2>Failed to load KutzApp SDK.</h2><p>Please check your network connection and ad-blockers.</p></div>';
          return;
        }

        // Initialize the SDK with the Shop ID
        KutzApp.init("cmn9kj24n0000lqzc7kcsmpst");

        // Fetch all data and render
        KutzApp.getPublicData()
          .then((data) => {
            // Execute page-specific rendering logic
            try {
              ${scriptBody}
              document.getElementById("loading-spinner").style.display = "none";
              document.getElementById("page-content").style.display = "block";
            } catch (renderError) {
              console.error("Rendering error:", renderError);
              document.getElementById("loading-spinner").innerHTML = "Error rendering content.";
            }
          })
          .catch((err) => {
            console.error("❌ KutzApp SDK initialization failed:", err);
            document.getElementById("heritage-container").innerHTML =
              '<div style="text-align: center; padding: 100px;"><h2>Failed to load shop data.</h2><p>' + err.message + "</p></div>";
          });
      }

      // Safe script loading check
      if (typeof KutzApp !== "undefined") {
        initializeShop();
      } else {
        let attempts = 0;
        let checkInterval = setInterval(function () {
          attempts++;
          if (typeof KutzApp !== "undefined") {
            clearInterval(checkInterval);
            initializeShop();
          } else if (attempts >= 150) {
            clearInterval(checkInterval);
            initializeShop();
          }
        }, 100);
      }
      
      // Common modal functions
      window.showCheckoutModal = function(product, quantity) {
          const existingModal = document.getElementById("product-checkout-modal");
          if (existingModal) existingModal.remove();

          const overlay = document.createElement("div");
          overlay.id = "product-checkout-modal";
          Object.assign(overlay.style, {
            position: "fixed", top: "0", left: "0", width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: "999999", display: "flex", alignItems: "center", justifyContent: "center", opacity: "0", transition: "opacity 0.3s ease",
          });

          const modalContent = document.createElement("div");
          Object.assign(modalContent.style, {
            backgroundColor: "#fff", borderRadius: "12px", padding: "40px", maxWidth: "400px", width: "90%", position: "relative", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", transform: "translateY(20px)", transition: "transform 0.3s ease", boxSizing: "border-box", fontFamily: "Arial, sans-serif", textAlign: "center",
          });

          const icon = document.createElement("div");
          icon.innerHTML = "✅";
          Object.assign(icon.style, { fontSize: "4em", marginBottom: "20px" });

          const title = document.createElement("h2");
          title.textContent = "Added to Cart";
          Object.assign(title.style, { marginTop: "0", color: "var(--primary-color)", fontSize: "1.8em", marginBottom: "10px" });

          const desc = document.createElement("p");
          desc.innerHTML = \`You have selected <strong>\${quantity}x \${product.name}</strong>.<br><br><em>(Stripe checkout integration pending)</em>\`;
          Object.assign(desc.style, { color: "#555", fontSize: "1.1em", lineHeight: "1.6", marginBottom: "30px" });

          const closeBtn = document.createElement("button");
          closeBtn.textContent = "CONTINUE SHOPPING";
          closeBtn.className = "btn btn-buy";
          Object.assign(closeBtn.style, { width: "100%", padding: "15px", fontSize: "1.1em" });
          closeBtn.onclick = () => {
            overlay.style.opacity = "0";
            modalContent.style.transform = "translateY(20px)";
            setTimeout(() => overlay.remove(), 300);
          };

          modalContent.appendChild(icon); modalContent.appendChild(title); modalContent.appendChild(desc); modalContent.appendChild(closeBtn);
          overlay.appendChild(modalContent); document.body.appendChild(overlay);

          requestAnimationFrame(() => { overlay.style.opacity = "1"; modalContent.style.transform = "translateY(0)"; });
      };

      window.showProductModal = function(product) {
          const existingModal = document.getElementById("product-details-modal");
          if (existingModal) { existingModal.remove(); }

          const overlay = document.createElement("div");
          overlay.id = "product-details-modal";
          Object.assign(overlay.style, {
            position: "fixed", top: "0", left: "0", width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: "999999", display: "flex", alignItems: "center", justifyContent: "center", opacity: "0", transition: "opacity 0.3s ease",
          });

          const modalContent = document.createElement("div");
          Object.assign(modalContent.style, {
            backgroundColor: "#fff", borderRadius: "12px", padding: "40px", maxWidth: "500px", width: "90%", position: "relative", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", transform: "translateY(20px)", transition: "transform 0.3s ease", boxSizing: "border-box", fontFamily: "Arial, sans-serif",
          });

          const closeBtn = document.createElement("button");
          closeBtn.innerHTML = "&times;";
          Object.assign(closeBtn.style, {
            position: "absolute", top: "15px", right: "20px", background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#666", lineHeight: "1",
          });
          closeBtn.onclick = () => {
            overlay.style.opacity = "0";
            modalContent.style.transform = "translateY(20px)";
            setTimeout(() => overlay.remove(), 300);
          };

          const title = document.createElement("h2");
          title.textContent = product.name;
          Object.assign(title.style, { marginTop: "0", color: "var(--primary-color)", fontSize: "2em", borderBottom: "2px solid var(--accent-gold)", paddingBottom: "10px", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "1px" });

          const price = document.createElement("div");
          price.textContent = "$" + Number(product.price).toFixed(2);
          Object.assign(price.style, { fontSize: "1.8em", fontWeight: "bold", color: "var(--accent-gold)", marginBottom: "20px" });

          const description = document.createElement("div");
          description.innerHTML = product.description ? product.description.replace(/\\n/g, "<br/>") : "No description available for this product.";
          Object.assign(description.style, { color: "#555", fontSize: "1.1em", lineHeight: "1.6", marginBottom: "30px", maxHeight: "300px", overflowY: "auto" });

          const buyBtn = document.createElement("button");
          buyBtn.textContent = "BUY NOW";
          buyBtn.className = "btn btn-buy";
          Object.assign(buyBtn.style, { width: "100%", padding: "15px", fontSize: "1.1em" });
          buyBtn.onclick = () => {
            if (typeof KutzApp !== "undefined") {
              closeBtn.onclick(); 
              KutzApp.getProductDetails(product.id)
                .then((prod) => { window.showCheckoutModal(prod, 1); })
                .catch((err) => { alert("Checkout failed: " + err.message); });
            }
          };

          modalContent.appendChild(closeBtn); modalContent.appendChild(title); modalContent.appendChild(price); modalContent.appendChild(description); modalContent.appendChild(buyBtn);
          overlay.appendChild(modalContent); document.body.appendChild(overlay);

          requestAnimationFrame(() => { overlay.style.opacity = "1"; modalContent.style.transform = "translateY(0)"; });
          overlay.addEventListener("click", (e) => { if (e.target === overlay) closeBtn.onclick(); });
      };

    });
  </script>
</body>
</html>`;

const aboutContent = `
<section class="content-section" id="about">
    <div class="text-content-wrapper">
        <header class="shop-welcome">
            <h1 class="main-title">
                Welcome to <span class="brand-accent" id="dyn-shop-name">Heritage Haircuts</span>
            </h1>
            <p class="intro-paragraph" id="dyn-shop-desc">
                Welcome to our shop, where timeless style meets skilled care.
            </p>
        </header>

        <section class="philosophy-container">
            <h2 class="section-header">Our Philosophy</h2>
            <p>
                At <span class="brand-inline" id="dyn-shop-name-2">Heritage Haircuts</span>, we believe a great haircut
                should reflect your personality and fit your lifestyle. Whether you want
                a sharp professional cut, a classic style, or a fresh modern look,
                our team takes the time to <strong>listen, understand, and deliver</strong>
                with precision.
            </p>
        </section>

        <section class="services-container">
            <h2 class="section-header">What We Offer</h2>
            <p>
                Explore our <mark class="vibrant-keyword">Service Menu</mark> below,
                or visit our <mark class="vibrant-keyword">Booking Portal</mark>
                to view availability.
            </p>
            <ul class="services-list">
                <li class="service-item">Professional haircut services.</li>
                <li class="service-item">Beard trims and grooming.</li>
                <li class="service-item">Classic and modern styles.</li>
                <li class="service-item">Friendly service for the whole family.</li>
                <li class="service-item">A clean and relaxing atmosphere.</li>
            </ul>
        </section>
    </div>
</section>
`;

const aboutScript = `
  const shop = data.shop || {};
  document.getElementById('dyn-shop-name').textContent = shop.name || "Heritage Haircuts";
  document.getElementById('dyn-shop-name-2').textContent = shop.name || "Heritage Haircuts";
  document.getElementById('dyn-shop-desc').textContent = shop.description || "Welcome to our shop, where timeless style meets skilled care.";
`;

fs.writeFileSync(path.join(outputDir, 'about.html'), getBaseHtml('About Us', 'about', aboutContent, aboutScript));


const servicesContent = `
<section class="content-section" id="services">
    <header class="shop-welcome text-content-wrapper">
        <h1 class="main-title">Service Menu</h1>
        <p class="intro-paragraph">Defined by heritage, serving the community.</p>
    </header>
    <div class="services-grid" id="services-grid-container">
        <!-- Rendered by JS -->
    </div>
</section>
`;

const servicesScript = `
  const services = (data.services || []).filter(s => s.duration && s.duration > 0);
  const container = document.getElementById("services-grid-container");
  
  if (services.length > 0) {
    let html = "";
    services.forEach((service) => {
      const priceDisplay = service.price ? Number(service.price).toFixed(2) : "0.00";
      const durationDisplay = service.duration || "30";
      html += \`
        <div class="service-card">
            <h2 class="service-name">\${service.name}</h2>
            <div class="service-meta">
                <span class="service-price">$\${priceDisplay}</span>
                <span class="service-duration">⏱️ \${durationDisplay}MIN</span>
            </div>
            <p class="service-description">\${service.description || ""}</p>
            <button class="barber-booking-trigger" data-service-id="\${service.id}">Book</button>
        </div>
      \`;
    });
    container.innerHTML = html;
    
    // Wire up booking buttons
    document.querySelectorAll(".barber-booking-trigger").forEach(function (button) {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        var serviceId = this.getAttribute("data-service-id");
        if (typeof window.BarberBooking !== "undefined") {
          window.BarberBooking.open(serviceId);
        } else {
          alert("Booking widget not loaded yet. Please try again in a moment.");
        }
      });
    });
  } else {
    container.innerHTML = "<p>No services currently available.</p>";
  }
`;

fs.writeFileSync(path.join(outputDir, 'services.html'), getBaseHtml('Services', 'services', servicesContent, servicesScript));


const productsContent = `
<section class="content-section" id="shop">
    <header class="shop-welcome text-content-wrapper">
        <h1 class="main-title">Grooming <span class="brand-accent">Products</span></h1>
        <p class="intro-paragraph">Take the styling experience home with you.</p>
    </header>
    <div class="services-grid" id="products-grid-container">
        <!-- Rendered by JS -->
    </div>
</section>
`;

const productsScript = `
  const products = data.products || [];
  const container = document.getElementById("products-grid-container");
  
  if (products.length > 0) {
    let html = "";
    products.forEach((product) => {
      const priceDisplay = product.price ? Number(product.price).toFixed(2) : "0.00";
      html += \`
        <div class="service-card">
            <h2 class="service-name">\${product.name}</h2>
            <div class="service-meta">
                <span class="service-price">$\${priceDisplay}</span>
            </div>
            <div class="scrollable-desc service-description">
                <p>\${product.description || ""}</p>
            </div>
            <div class="action-buttons">
                <button class="btn btn-details" data-product-id="\${product.id}">Details</button>
                <button class="btn btn-buy" data-product-id="\${product.id}">Buy</button>
            </div>
        </div>
      \`;
    });
    container.innerHTML = html;
    
    // Wire up buy buttons
    document.querySelectorAll(".btn-buy").forEach(function (button) {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        var productId = this.getAttribute("data-product-id");
        if (typeof KutzApp !== "undefined") {
          KutzApp.getProductDetails(productId)
            .then((product) => { window.showCheckoutModal(product, 1); })
            .catch((err) => alert("Checkout failed: " + err.message));
        } else {
          alert("KutzApp SDK not loaded.");
        }
      });
    });

    // Wire up details buttons
    document.querySelectorAll(".btn-details").forEach(function (button) {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        var productId = this.getAttribute("data-product-id");
        if (typeof KutzApp !== "undefined") {
          KutzApp.getProductDetails(productId)
            .then((product) => { if (product) { window.showProductModal(product); } })
            .catch((err) => { alert("Failed to fetch product details: " + err.message); });
        }
      });
    });
  } else {
    container.innerHTML = "<p>No products currently available.</p>";
  }
`;

fs.writeFileSync(path.join(outputDir, 'products.html'), getBaseHtml('Products', 'products', productsContent, productsScript));


const reviewsContent = `
<section class="content-section" id="reviews">
    <header class="shop-welcome text-content-wrapper">
        <h1 class="main-title">Customer <span class="brand-accent">Reviews</span></h1>
    </header>
    <div class="services-grid" id="reviews-grid-container">
        <!-- Rendered by JS -->
    </div>
    <div class="review-btn-container" style="margin-top: 40px;">
        <button class="barber-reviews-trigger" id="add-review-btn">Leave a Review</button>
    </div>
</section>
`;

const reviewsScript = `
  const reviews = data.reviews || [];
  const container = document.getElementById("reviews-grid-container");
  
  if (reviews.length > 0) {
    let html = "";
    reviews.forEach((review) => {
      const stars = "⭐".repeat(review.rating || 5);
      html += \`
        <div class="service-card">
            <h2 class="service-name" style="color: var(--accent-gold); font-size: 1.5em;">\${stars}</h2>
            <p class="service-description" style="font-style: italic;">"\${review.comment || "Great service!"}"</p>
        </div>
      \`;
    });
    container.innerHTML = html;
  } else {
    container.innerHTML = "<p>No reviews yet. Be the first to leave one!</p>";
  }
  
  var addReviewBtn = document.getElementById("add-review-btn");
  if (addReviewBtn) {
    addReviewBtn.addEventListener("click", function (e) {
      e.preventDefault();
      showAddReviewModal();
    });
  }
  
  function showAddReviewModal() {
      const existingModal = document.getElementById("add-review-modal");
      if (existingModal) existingModal.remove();

      const overlay = document.createElement("div");
      overlay.id = "add-review-modal";
      Object.assign(overlay.style, { position: "fixed", top: "0", left: "0", width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: "999999", display: "flex", alignItems: "center", justifyContent: "center", opacity: "0", transition: "opacity 0.3s ease" });

      const modalContent = document.createElement("div");
      Object.assign(modalContent.style, { backgroundColor: "#fff", borderRadius: "12px", padding: "40px", maxWidth: "500px", width: "90%", position: "relative", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", transform: "translateY(20px)", transition: "transform 0.3s ease", boxSizing: "border-box", fontFamily: "Arial, sans-serif" });

      const closeBtn = document.createElement("button");
      closeBtn.innerHTML = "&times;";
      Object.assign(closeBtn.style, { position: "absolute", top: "15px", right: "20px", background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#666", lineHeight: "1" });
      closeBtn.onclick = () => { overlay.style.opacity = "0"; modalContent.style.transform = "translateY(20px)"; setTimeout(() => overlay.remove(), 300); };

      const title = document.createElement("h2");
      title.textContent = "Leave a Review";
      Object.assign(title.style, { marginTop: "0", color: "var(--primary-color)", fontSize: "1.8em", borderBottom: "2px solid var(--accent-gold)", paddingBottom: "10px", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "1px" });

      const form = document.createElement("form");
      const aptLabel = document.createElement("label"); aptLabel.textContent = "Appointment ID:"; Object.assign(aptLabel.style, { display: "block", marginBottom: "5px", fontWeight: "bold" });
      const aptInput = document.createElement("input"); aptInput.type = "text"; aptInput.required = true; aptInput.placeholder = "e.g. appt_123xyz"; Object.assign(aptInput.style, { width: "100%", padding: "10px", marginBottom: "20px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box" });
      const ratingLabel = document.createElement("label"); ratingLabel.textContent = "Rating (1-5):"; Object.assign(ratingLabel.style, { display: "block", marginBottom: "5px", fontWeight: "bold" });
      const ratingInput = document.createElement("input"); ratingInput.type = "number"; ratingInput.min = "1"; ratingInput.max = "5"; ratingInput.value = "5"; ratingInput.required = true; Object.assign(ratingInput.style, { width: "100%", padding: "10px", marginBottom: "20px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box" });
      const commentLabel = document.createElement("label"); commentLabel.textContent = "Comments:"; Object.assign(commentLabel.style, { display: "block", marginBottom: "5px", fontWeight: "bold" });
      const commentInput = document.createElement("textarea"); commentInput.rows = 4; commentInput.placeholder = "Tell us about your experience..."; Object.assign(commentInput.style, { width: "100%", padding: "10px", marginBottom: "20px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box", fontFamily: "inherit" });
      
      const submitBtn = document.createElement("button"); submitBtn.textContent = "SUBMIT REVIEW"; submitBtn.type = "submit"; submitBtn.className = "btn btn-buy";
      Object.assign(submitBtn.style, { width: "100%", padding: "15px", fontSize: "1.1em", backgroundColor: "var(--button-bg)", color: "var(--button-text)", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", textTransform: "uppercase" });

      form.onsubmit = (e) => {
        e.preventDefault();
        if (typeof KutzApp !== "undefined") {
          submitBtn.textContent = "Submitting..."; submitBtn.disabled = true;
          KutzApp.submitReview({ appointmentId: aptInput.value.trim(), rating: parseInt(ratingInput.value, 10), comment: commentInput.value.trim() })
            .then((res) => { alert("Review submitted successfully!"); closeBtn.onclick(); window.location.reload(); })
            .catch((err) => { alert("Failed to submit review: " + err.message); submitBtn.textContent = "SUBMIT REVIEW"; submitBtn.disabled = false; });
        }
      };

      form.appendChild(aptLabel); form.appendChild(aptInput); form.appendChild(ratingLabel); form.appendChild(ratingInput); form.appendChild(commentLabel); form.appendChild(commentInput); form.appendChild(submitBtn);
      modalContent.appendChild(closeBtn); modalContent.appendChild(title); modalContent.appendChild(form); overlay.appendChild(modalContent); document.body.appendChild(overlay);

      requestAnimationFrame(() => { overlay.style.opacity = "1"; modalContent.style.transform = "translateY(0)"; });
      overlay.addEventListener("click", (e) => { if (e.target === overlay) closeBtn.onclick(); });
  }
`;

fs.writeFileSync(path.join(outputDir, 'reviews.html'), getBaseHtml('Reviews', 'reviews', reviewsContent, reviewsScript));

console.log('Successfully generated independent HTML pages in public/html-sections/');
