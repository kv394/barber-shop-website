const fs = require('fs');

let html = fs.readFileSync('Barber Shop SaaS.html', 'utf8');

// Replace SDK URL
html = html.replace('https://barbersaas-henna.vercel.app/barbersaas-sdk.js', 'http://localhost:3000/barbersaas-sdk.js');

// Replace SDK Initialization
html = html.replace('BarberSaaS.init("cmn9kj24n0000lqzc7kcsmpst");', 'BarberSaaS.init("cmn9kj24n0000lqzc7kcsmpst", "http://localhost:3000");');

// Replace service IDs
html = html.replace(/data-service-id="srv_royale"/g, 'data-service-id="hh-svc-royale"');
html = html.replace(/data-service-id="srv_design"/g, 'data-service-id="hh-svc-design"');
html = html.replace(/data-service-id="srv_braids"/g, 'data-service-id="hh-svc-braids"');
html = html.replace(/data-service-id="srv_color"/g, 'data-service-id="hh-svc-color"');
html = html.replace(/data-service-id="srv_facial"/g, 'data-service-id="hh-svc-facial"');
html = html.replace(/data-service-id="srv_facial_2"/g, 'data-service-id="hh-svc-facial"');
html = html.replace(/data-service-id="srv_shave"/g, 'data-service-id="hh-svc-shave"');
html = html.replace(/data-service-id="srv_lineup"/g, 'data-service-id="hh-svc-lineup"');
html = html.replace(/data-service-id="srv_fade"/g, 'data-service-id="hh-svc-fade"');
html = html.replace(/data-service-id="srv_combo"/g, 'data-service-id="hh-svc-cut-beard"');
html = html.replace(/data-service-id="srv_beard"/g, 'data-service-id="hh-svc-beard-trim"');
html = html.replace(/data-service-id="srv_kids"/g, 'data-service-id="hh-svc-kids-cut"');
html = html.replace(/data-service-id="srv_kids_2"/g, 'data-service-id="hh-svc-kids-cut"');
html = html.replace(/data-service-id="srv_mens"/g, 'data-service-id="hh-svc-mens-cut"');
html = html.replace(/data-service-id="srv_mens_2"/g, 'data-service-id="hh-svc-mens-cut"');

// Replace product IDs
html = html.replace(/data-product-id="prod_gc50"/g, 'data-product-id="hh-prod-gift50"');
html = html.replace(/data-product-id="prod_shampoo"/g, 'data-product-id="hh-prod-shampoo"');
html = html.replace(/data-product-id="prod_conditioner"/g, 'data-product-id="hh-prod-conditioner"');
html = html.replace(/data-product-id="prod_gc25"/g, 'data-product-id="hh-prod-gift25"');
html = html.replace(/data-product-id="prod_beardoil"/g, 'data-product-id="hh-prod-beard-oil"');
html = html.replace(/data-product-id="prod_clubman"/g, 'data-product-id="hh-prod-aftershave"');

fs.writeFileSync('Barber Shop SaaS.html', html);
console.log('Fixed IDs and SDK init.');
