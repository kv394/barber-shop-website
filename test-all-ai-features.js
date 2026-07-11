const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('response', response => {
    if (response.status() >= 400 && response.url().includes('/api/shops/')) {
      console.log(`API ERROR [${response.status()}]: ${response.url()}`);
    }
  });

  console.log('Logging in...');
  await page.goto('https://barber-shop-website-ashy.vercel.app/sign-in');
  
  await page.fill('input[name="email"]', 'admin@heritagehaircuts.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation({ waitUntil: 'networkidle' });
  console.log('Logged in! URL:', page.url());

  const shopUrl = 'https://barber-shop-website-ashy.vercel.app/shop/cm3shop001heritage0001';
  
  const pagesToTest = [
    { name: 'Dashboard', url: shopUrl },
    { name: 'Gamification', url: `${shopUrl}/gamification` },
    { name: 'Chat Widget', url: `${shopUrl}/engagement/chat-widget` },
    { name: 'Campaigns', url: `${shopUrl}/campaigns` },
    { name: 'Reviews', url: `${shopUrl}/reviews` },
  ];

  for (const p of pagesToTest) {
    console.log(`\nTesting ${p.name}...`);
    await page.goto(p.url, { waitUntil: 'networkidle' });
    console.log(`${p.name} loaded.`);
    await page.waitForTimeout(2000); // Wait a bit for client side fetch
  }
  
  console.log('Testing done.');
  await browser.close();
})();
