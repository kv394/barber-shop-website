# Custom HTML & Headless Integrations Guide

BarberSaaS provides shop administrators with ultimate flexibility over their brand's public presence. While we offer a variety of pre-built themes, you can also completely replace the public-facing shop page using the **Custom HTML Template** or expand your site by adding **Custom Pages**.

This document outlines how to use both features effectively.

---

## 1. Custom HTML Template (Single Page Application)

If you want absolute control over your shop's landing page, you can choose the **Custom HTML** template option in the "Appearance & Settings" tab.

### How it Works

When you select "Custom HTML":
1. The standard styling, theming, and layout controls are disabled.
2. A large code editor appears where you can paste a complete `index.html` file.
3. BarberSaaS serves your raw HTML exactly as you provided it, wrapped safely in a fullscreen iframe.
4. The system automatically overlays the required **Client Login / Sign Out** button in the top right corner, ensuring your clients can still manage their accounts.

### Integrating the BarberSaaS SDK

Your custom HTML should serve as a headless front-end for BarberSaaS. To make it functional (showing services, handling bookings, processing checkouts), you need to integrate the BarberSaaS Javascript SDK.

Include these scripts right before your closing `</body>` tag:

```html
<!-- Load the SDK Client -->
<script src="https://your-domain.com/barbersaas-sdk.js"></script>

<!-- Load the Booking Modal Logic -->
<script src="https://your-domain.com/booking-modal.js" data-shop-id="YOUR_SHOP_ID_HERE"></script>
```

### Fetching Data & Hydrating the UI

You must initialize the SDK and fetch your shop data manually. We recommend doing this inside a `window.addEventListener("load")` block.

```javascript
window.addEventListener("load", function () {
  // Initialize the SDK
  BarberSaaS.init("YOUR_SHOP_ID_HERE");

  // Fetch Public Data
  BarberSaaS.getPublicData()
    .then((data) => {
        // data.shop contains your customization and basic info
        // data.services contains the active service menu
        // data.products contains retail inventory
        // data.reviews contains the latest customer reviews
        
        // Example: Render Services
        const services = data.services || [];
        services.forEach(service => {
            // ... construct your HTML ...
            // Use window.BarberBooking.open(serviceId) to trigger the booking flow
        });
    })
    .catch((err) => console.error("Failed to load shop data", err));
});
```

### The Starter Boilerplate

We provide a fully functional Boilerplate `index.html` to get you started. It includes:
* **Smooth Scrolling Navbar** 
* **Dynamic Loading States** (Spinners that hide once data loads)
* **Pre-wired Buttons** for Booking Services, Buying Products, and Leaving Reviews
* **Safe Error Handling**

You can find the latest boilerplate code in our public resources or by checking the generated `index.html` file in the project.

---

## 2. Custom Pages

If you are using one of our **standard themes** (Modern, Classic, Minimal, etc.) but need to add extra content—like an "About Our Team" page, a "FAQ", or a "Cancellation Policy"—you can use the **Custom Pages** feature.

### How it Works

In the Shop Admin settings, scroll down to the "Custom Pages" section. You can add up to 2 unique pages per shop.

For each page you define:
1. **Title:** This determines the name of the page and automatically generates the URL slug (e.g., "Our Policy" becomes `/shops/your-shop-slug/our-policy`).
2. **Content:** A rich text/HTML editor where you can write the content of your page.

### Theming and Layout

Custom pages automatically inherit:
- Your shop's selected **Theme** (Color palettes, button styles, typography).
- The universal **Navigation Bar**, seamlessly adding your new pages to the top menu.
- The shop's **Footer**.

You do not need to provide `<head>` or `<body>` tags for Custom Pages. Simply provide the inner HTML (like paragraphs, headings, and images), and BarberSaaS will inject it securely into your existing layout.

### Custom Page Constraints

* **Maximum limit:** 2 pages per shop.
* **Security:** Custom pages sanitize scripts by default when rendered within standard themes to prevent cross-site scripting (XSS). If you need advanced script execution, you should migrate to the **Custom HTML Template** mentioned in Section 1.
