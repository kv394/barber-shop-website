const fs = require('fs');

let html = fs.readFileSync('Barber Shop SaaS.html', 'utf8');

// Replace SDK URL
html = html.replace('https://barbersaas.com/barbersaas-sdk.js', 'https://barbersaas-henna.vercel.app/barbersaas-sdk.js');

// Replace SDK Initialization block
const oldInit = `// Note: Ensure your domain is authorized in BarberSaaS settings to prevent CORS errors.
            // Initialize the SDK with your Shop ID
            if (typeof BarberSaaS !== 'undefined') {
                BarberSaaS.init("cmn9kj24n0000lqzc7kcsmpst");
                
                // Fetch basic public data to ensure SDK connection is alive
                BarberSaaS.getPublicData()
                    .then(data => console.log('✅ BarberSaaS SDK initialized successfully:', data))
                    .catch(err => console.error('❌ BarberSaaS SDK initialization failed:', err));
            } else {
                console.error("BarberSaaS SDK did not load.");
            }`;

const newInit = `// Wait for BarberSaaS to be defined (handle async loading)
            let checkInterval = setInterval(function() {
                if (typeof BarberSaaS !== 'undefined') {
                    clearInterval(checkInterval);

                    // Note: Ensure your domain is authorized in BarberSaaS settings to prevent CORS errors.
                    // Initialize the SDK with your Shop ID
                    BarberSaaS.init("cmn9kj24n0000lqzc7kcsmpst");

                    // Fetch basic public data to ensure SDK connection is alive
                    BarberSaaS.getPublicData()
                        .then(data => console.log('✅ BarberSaaS SDK initialized successfully:', data))
                        .catch(err => console.error('❌ BarberSaaS SDK initialization failed:', err));
                }
            }, 100);

            // Timeout after 5 seconds if SDK fails to load
            setTimeout(function() {
                if (typeof BarberSaaS === 'undefined') {
                    clearInterval(checkInterval);
                    console.error("BarberSaaS SDK did not load after 5 seconds.");
                }
            }, 5000);`;

html = html.replace(oldInit, newInit);
fs.writeFileSync('Barber Shop SaaS.html', html);
console.log('Fixed Barber Shop SaaS.html via JS script.');
