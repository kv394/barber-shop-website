const fs = require('fs');

const about = fs.readFileSync('public/html-sections/about.html', 'utf8');
const services = fs.readFileSync('public/html-sections/services.html', 'utf8');
const products = fs.readFileSync('public/html-sections/products.html', 'utf8');
const reviews = fs.readFileSync('public/html-sections/reviews.html', 'utf8');

const headMatch = about.match(/<head>([\s\S]*?)<\/head>/);
const styleMatch = about.match(/<style>([\s\S]*?)<\/style>/);

const extractArticle = (html, id) => {
  const match = html.match(new RegExp(`<article id="${id}-heritage-container">([\\s\\S]*?)<\\/article>`));
  return match ? match[0] : '';
};

const extractJsLogic = (html) => {
  const match = html.match(/try \{([\s\S]*?)\} catch \(renderError\)/);
  return match ? match[1].trim() : '';
};

const aboutArticle = extractArticle(about, 'about');
const servicesArticle = extractArticle(services, 'services');
const productsArticle = extractArticle(products, 'products');
const reviewsArticle = extractArticle(reviews, 'reviews');

const aboutJs = extractJsLogic(about);
const servicesJs = extractJsLogic(services);
const productsJs = extractJsLogic(products);
const reviewsJs = extractJsLogic(reviews);

const singlePageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Heritage Haircuts - Booking & Store</title>
  ${styleMatch ? styleMatch[0] : ''}
  <style>
    /* Smooth scrolling for anchor links */
    html { scroll-behavior: smooth; }
    /* Padding for fixed nav */
    body { padding-top: 60px; }
    .navbar { position: fixed; top: 0; width: 100%; z-index: 100; }
  </style>
</head>
<body>
  <nav class="navbar">
    <a href="#about-heritage-container" class="">About Us</a>
    <a href="#services-heritage-container" class="">Services</a>
    <a href="#products-heritage-container" class="">Products</a>
    <a href="#reviews-heritage-container" class="">Reviews</a>
  </nav>

  ${aboutArticle}
  ${servicesArticle}
  ${productsArticle}
  ${reviewsArticle}

  <!-- BarberSaaS SDK -->
  <script src="https://barbersaas-henna.vercel.app/barbersaas-sdk.js"></script>
  <!-- Booking Modal logic -->
  <script src="https://barbersaas-henna.vercel.app/booking-modal.js" data-shop-id="cmn9kj24n0000lqzc7kcsmpst"></script>

  <script>
    window.addEventListener("load", function () {
      function initializeShop() {
        if (typeof BarberSaaS === "undefined") {
          console.error("BarberSaaS SDK script failed to load or initialize.");
          document.querySelectorAll('article[id$="-heritage-container"]').forEach(el => {
            el.innerHTML = '<div style="text-align: center; padding: 100px;"><h2>Failed to load BarberSaaS SDK.</h2><p>Please check your network connection and ad-blockers.</p></div>';
          });
          return;
        }

        BarberSaaS.init("cmn9kj24n0000lqzc7kcsmpst");

        BarberSaaS.getPublicData()
          .then((data) => {
            // --- ABOUT LOGIC ---
            try {
              ${aboutJs}
            } catch (err) { console.error(err); document.getElementById("about-loading-spinner").innerHTML = "Error rendering content."; }

            // --- SERVICES LOGIC ---
            try {
              ${servicesJs}
            } catch (err) { console.error(err); document.getElementById("services-loading-spinner").innerHTML = "Error rendering content."; }

            // --- PRODUCTS LOGIC ---
            try {
              ${productsJs}
            } catch (err) { console.error(err); document.getElementById("products-loading-spinner").innerHTML = "Error rendering content."; }

            // --- REVIEWS LOGIC ---
            try {
              ${reviewsJs}
            } catch (err) { console.error(err); document.getElementById("reviews-loading-spinner").innerHTML = "Error rendering content."; }
          })
          .catch((err) => {
            console.error("❌ BarberSaaS SDK initialization failed:", err);
            document.querySelectorAll('article[id$="-heritage-container"]').forEach(el => {
              el.innerHTML = '<div style="text-align: center; padding: 100px;"><h2>Failed to load shop data.</h2><p>' + err.message + "</p></div>";
            });
          });
      }

      if (typeof BarberSaaS !== "undefined") {
        initializeShop();
      } else {
        let attempts = 0;
        let checkInterval = setInterval(function () {
          attempts++;
          if (typeof BarberSaaS !== "undefined") {
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
          Object.assign(overlay.style, { position: "fixed", top: "0", left: "0", width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: "999999", display: "flex", alignItems: "center", justifyContent: "center", opacity: "0", transition: "opacity 0.3s ease" });

          const modalContent = document.createElement("div");
          Object.assign(modalContent.style, { backgroundColor: "#fff", borderRadius: "12px", padding: "40px", maxWidth: "400px", width: "90%", position: "relative", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", transform: "translateY(20px)", transition: "transform 0.3s ease", boxSizing: "border-box", fontFamily: "Arial, sans-serif", textAlign: "center" });

          const icon = document.createElement("div"); icon.innerHTML = "✅"; Object.assign(icon.style, { fontSize: "4em", marginBottom: "20px" });
          const title = document.createElement("h2"); title.textContent = "Added to Cart"; Object.assign(title.style, { marginTop: "0", color: "var(--primary-color)", fontSize: "1.8em", marginBottom: "10px" });
          const desc = document.createElement("p"); desc.innerHTML = \`You have selected <strong>\${quantity}x \${product.name}</strong>.<br><br><em>(Stripe checkout integration pending)</em>\`; Object.assign(desc.style, { color: "#555", fontSize: "1.1em", lineHeight: "1.6", marginBottom: "30px" });
          const closeBtn = document.createElement("button"); closeBtn.textContent = "CONTINUE SHOPPING"; closeBtn.className = "btn btn-buy"; Object.assign(closeBtn.style, { width: "100%", padding: "15px", fontSize: "1.1em" });
          closeBtn.onclick = () => { overlay.style.opacity = "0"; modalContent.style.transform = "translateY(20px)"; setTimeout(() => overlay.remove(), 300); };

          modalContent.appendChild(icon); modalContent.appendChild(title); modalContent.appendChild(desc); modalContent.appendChild(closeBtn); overlay.appendChild(modalContent); document.body.appendChild(overlay);
          requestAnimationFrame(() => { overlay.style.opacity = "1"; modalContent.style.transform = "translateY(0)"; });
      };

      window.showProductModal = function(product) {
          const existingModal = document.getElementById("product-details-modal");
          if (existingModal) { existingModal.remove(); }

          const overlay = document.createElement("div");
          overlay.id = "product-details-modal";
          Object.assign(overlay.style, { position: "fixed", top: "0", left: "0", width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: "999999", display: "flex", alignItems: "center", justifyContent: "center", opacity: "0", transition: "opacity 0.3s ease" });

          const modalContent = document.createElement("div");
          Object.assign(modalContent.style, { backgroundColor: "#fff", borderRadius: "12px", padding: "40px", maxWidth: "500px", width: "90%", position: "relative", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", transform: "translateY(20px)", transition: "transform 0.3s ease", boxSizing: "border-box", fontFamily: "Arial, sans-serif" });

          const closeBtn = document.createElement("button"); closeBtn.innerHTML = "&times;"; Object.assign(closeBtn.style, { position: "absolute", top: "15px", right: "20px", background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#666", lineHeight: "1" });
          closeBtn.onclick = () => { overlay.style.opacity = "0"; modalContent.style.transform = "translateY(20px)"; setTimeout(() => overlay.remove(), 300); };

          const title = document.createElement("h2"); title.textContent = product.name; Object.assign(title.style, { marginTop: "0", color: "var(--primary-color)", fontSize: "2em", borderBottom: "2px solid var(--accent-gold)", paddingBottom: "10px", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "1px" });
          const price = document.createElement("div"); price.textContent = "$" + Number(product.price).toFixed(2); Object.assign(price.style, { fontSize: "1.8em", fontWeight: "bold", color: "var(--accent-gold)", marginBottom: "20px" });
          const description = document.createElement("div"); description.innerHTML = product.description ? product.description.replace(/\n/g, "<br/>") : "No description available for this product."; Object.assign(description.style, { color: "#555", fontSize: "1.1em", lineHeight: "1.6", marginBottom: "30px", maxHeight: "300px", overflowY: "auto" });

          const buyBtn = document.createElement("button"); buyBtn.textContent = "BUY NOW"; buyBtn.className = "btn btn-buy"; Object.assign(buyBtn.style, { width: "100%", padding: "15px", fontSize: "1.1em" });
          buyBtn.onclick = () => { if (typeof BarberSaaS !== "undefined") { closeBtn.onclick(); BarberSaaS.getProductDetails(product.id).then((prod) => { window.showCheckoutModal(prod, 1); }).catch((err) => { alert("Checkout failed: " + err.message); }); } };

          modalContent.appendChild(closeBtn); modalContent.appendChild(title); modalContent.appendChild(price); modalContent.appendChild(description); modalContent.appendChild(buyBtn); overlay.appendChild(modalContent); document.body.appendChild(overlay);
          requestAnimationFrame(() => { overlay.style.opacity = "1"; modalContent.style.transform = "translateY(0)"; });
          overlay.addEventListener("click", (e) => { if (e.target === overlay) closeBtn.onclick(); });
      };
    });
  </script>
</body>
</html>`;

fs.writeFileSync('public/html-sections/index.html', singlePageHtml);
console.log('Created index.html');
