const fs = require('fs');
let html = fs.readFileSync('public/html-sections/index.html', 'utf8');

const cssToAdd = `
    /* List View Styles */
    .menu-list { display: flex; flex-direction: column; gap: 15px; padding-top: 20px; }
    .menu-item { display: flex; justify-content: space-between; align-items: flex-start; padding: 25px; background-color: #fcfcfc; border: 1px solid #e0e0e0; border-radius: 8px; transition: transform 0.2s ease, border-color 0.2s ease; }
    .menu-item:hover { transform: translateX(5px); border-color: var(--accent-gold); }
    .menu-item-left { display: flex; flex-direction: column; max-width: 70%; }
    .menu-item-title { font-family: Arial, sans-serif; color: var(--primary-color); font-size: 1.5em; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px; }
    .menu-item-meta { display: flex; gap: 10px; color: #777; font-size: 0.9em; text-transform: uppercase; font-style: italic; margin-bottom: 10px; }
    .menu-item-desc { margin: 0; color: #555; font-size: 1.05em; line-height: 1.6; }
    .menu-item-right { display: flex; flex-direction: column; align-items: flex-end; gap: 15px; min-width: 120px; }
    .menu-item-price { color: var(--accent-gold); font-weight: bold; font-size: 1.6em; font-family: Arial, sans-serif; }
    .menu-item-btn { width: 100%; text-align: center; padding: 10px 20px; background: var(--button-bg); color: var(--button-text); border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.95em; text-transform: uppercase; letter-spacing: 1px; transition: background 0.3s ease; }
    .menu-item-btn:hover { background: var(--accent-gold); color: var(--primary-color); }
    .menu-item-action-buttons { display: flex; gap: 10px; width: 100%; }
    .menu-item-btn-outline { background: transparent; color: var(--primary-color); border: 2px solid var(--primary-color); }
    .menu-item-btn-outline:hover { background: var(--secondary-color); color: var(--accent-gold); border-color: var(--accent-gold); }
`;

html = html.replace('.services-grid {', cssToAdd + '\n    .services-grid {');

// Update HTML containers
html = html.replace(/<div class="services-grid" id="services-grid-container">/g, '<div class="menu-list" id="services-grid-container">');
html = html.replace(/<div class="services-grid" id="products-grid-container">/g, '<div class="menu-list" id="products-grid-container">');
html = html.replace(/<div class="services-grid" id="reviews-grid-container">/g, '<div class="menu-list" id="reviews-grid-container">');


// Update Service Render
html = html.replace(/<div class="service-card">[\s\S]*?<\/div>\n\s+`;/g, 
`<div class="menu-item">
            <div class="menu-item-left">
                <h2 class="menu-item-title">\${service.name}</h2>
                <div class="menu-item-meta">
                    <span>⏱️ \${durationDisplay}MIN</span>
                </div>
                <p class="menu-item-desc">\${service.description || ""}</p>
            </div>
            <div class="menu-item-right">
                <span class="menu-item-price">$\${priceDisplay}</span>
                <button class="menu-item-btn barber-booking-trigger" data-service-id="\${service.id}">Book</button>
            </div>
        </div>
      \`;`
);

// Update Product Render
html = html.replace(/<div class="service-card">[\s\S]*?<\/div>\n\s+`;/g, 
`<div class="menu-item">
            <div class="menu-item-left">
                <h2 class="menu-item-title">\${product.name}</h2>
                <p class="menu-item-desc" style="max-height: 100px; overflow-y: auto;">\${product.description || ""}</p>
            </div>
            <div class="menu-item-right">
                <span class="menu-item-price">$\${priceDisplay}</span>
                <div class="menu-item-action-buttons">
                    <button class="menu-item-btn menu-item-btn-outline btn-details" data-product-id="\${product.id}">Details</button>
                    <button class="menu-item-btn btn-buy" data-product-id="\${product.id}">Buy</button>
                </div>
            </div>
        </div>
      \`;`
);

// We need to be careful with the review render, so let's run a separate targeted replace for reviews.
fs.writeFileSync('public/html-sections/index.html', html);
