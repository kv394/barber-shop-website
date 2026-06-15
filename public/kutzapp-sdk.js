/**
 * KutzApp Client SDK
 * 
 * This SDK provides easy access to your shop's public data and core booking functionalities
 * so you can build entirely custom headless front-ends.
 */

(function(global) {
  class KutzAppClient {
    constructor() {
      this.shopId = null;
      
      let defaultOrigin = 'http://localhost:3000';
      if (typeof window !== 'undefined') {
        defaultOrigin = window.location.origin;
        const scriptEls = document.querySelectorAll('script[src*="kutzapp-sdk.js"]');
        if (scriptEls.length > 0 && scriptEls[0].src.startsWith('http')) {
            try {
               defaultOrigin = new URL(scriptEls[0].src).origin;
            } catch(e) {}
        }
      }
      this.apiUrl = defaultOrigin;
      this._publicDataCache = null;
      this._publicDataPromise = null;
    }

    /**
     * Initialize the SDK.
     * @param {string} [shopId] - Your unique shop ID (auto-detected if data-shop-id is set on script tag)
     * @param {Object|string} [options] - Configuration options or custom API base URL
     * @param {string} [options.apiUrl] - Custom API base URL
     * @param {string} [options.primaryColor] - Primary theme color
     * @param {string} [options.secondaryColor] - Secondary theme color
     */
    init(shopId, options = {}) {
      if (!shopId) {
        const scriptEl = document.querySelector('script[data-shop-id]');
        if (scriptEl) {
          shopId = scriptEl.getAttribute('data-shop-id');
        }
      }

      if (!shopId) {
        console.error('KutzApp SDK: init() requires a valid shopId or a data-shop-id attribute on the script tag.');
        return;
      }
      this.shopId = shopId;
      if (typeof options === 'string') {
        this.apiUrl = options;
      } else {
        if (options.apiUrl) this.apiUrl = options.apiUrl;
        this.primaryColor = options.primaryColor || null;
        this.secondaryColor = options.secondaryColor || null;
        this.chatbotPosition = options.position || null;

        // Apply colors to root for external widgets (User Profile, etc.)
        if (this.primaryColor) {
          document.documentElement.style.setProperty('--primary', this.primaryColor);
          if (document.body) {
             document.body.style.setProperty('--primary', this.primaryColor);
          }
        }
        if (this.secondaryColor) {
          document.documentElement.style.setProperty('--secondary', this.secondaryColor);
          document.documentElement.style.setProperty('--theme-color', this.secondaryColor);
          document.documentElement.style.setProperty('--brand-color', this.secondaryColor);
          if (document.body) {
             document.body.style.setProperty('--secondary', this.secondaryColor);
             document.body.style.setProperty('--theme-color', this.secondaryColor);
             document.body.style.setProperty('--brand-color', this.secondaryColor);
          }
        }
      }
      console.log('KutzApp SDK initialized for shop:', shopId);
    }

    _checkInit() {
      if (!this.shopId) {
        throw new Error('KutzApp SDK is not initialized. Please call KutzApp.init("YOUR_SHOP_ID") first.');
      }
    }

    /**
     * Fetches all public data required for a custom landing page.
     * Includes shop details, sellable products, bookable services, public staff, and reviews.
     * @param {boolean} forceRefresh - If true, bypasses the local cache.
     * @returns {Promise<Object>} An object containing { shop, products, services, staff, reviews }
     */
    async getPublicData(forceRefresh = false) {
      this._checkInit();

      if (this._publicDataCache && !forceRefresh) {
        return this._publicDataCache;
      }

      if (this._publicDataPromise && !forceRefresh) {
        return this._publicDataPromise;
      }

      this._publicDataPromise = fetch(`${this.apiUrl}/api/shops/${this.shopId}/public-data?_t=${Date.now()}`)
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch public data.');
          }
          return res.json();
        })
        .then((data) => {
          if (data && data.shop) {
            const shop = data.shop;
            const custom = shop.customization || {};
            const seo = custom.seo || {};

            const normalizeImageUrl = (url) => {
              if (!url) return null;
              const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
              if (fileMatch) return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
              const openMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
              if (openMatch) return `https://lh3.googleusercontent.com/d/${openMatch[1]}`;
              const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([^&]+)/);
              if (ucMatch) return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`;
              return url;
            };

            data.shop.name = seo.title || shop.name || "Shop";
            data.shop.description = seo.description || shop.description || "";
            data.shop.logoUrl = normalizeImageUrl(custom.logoUrl || shop.logoUrl);
            data.shop.heroImageUrl = normalizeImageUrl(custom.heroImageUrl || shop.heroImageUrl);
            data.shop.primaryColor = custom.primaryColor || shop.primaryColor || "#E31837";
            data.shop.secondaryColor = custom.secondaryColor || shop.secondaryColor || "#000000";
            data.shop.customDomain = shop.customDomain || null;

            // ── Contact info (top-level for easy access) ──
            var contact = custom.contact || {};
            var rawAddr = custom.address || contact.address || '';
            if (typeof rawAddr === 'object' && rawAddr !== null) {
              rawAddr = [rawAddr.street, rawAddr.suite, rawAddr.city, rawAddr.state, rawAddr.zip].filter(Boolean).join(', ');
            }
            data.shop.address = rawAddr || null;
            data.shop.phone = custom.phone || contact.phone || null;
            data.shop.email = custom.email || contact.email || null;
            data.shop.businessHours = custom.businessHours || null;

            // Widget color overrides (all configurable from admin console)
            data.shop.widgetBgColor = custom.widgetBgColor || null;
            data.shop.widgetTextColor = custom.widgetTextColor || null;
            data.shop.widgetHeaderColor = custom.widgetHeaderColor || null;
            data.shop.widgetSurfaceColor = custom.widgetSurfaceColor || null;
            data.shop.widgetMutedColor = custom.widgetMutedColor || null;
            data.shop.widgetBorderColor = custom.widgetBorderColor || null;
            data.shop.colorTheme = custom.colorTheme || null;
          }
          this._publicDataCache = data;
          this._publicDataPromise = null;
          return data;
        })
        .catch((err) => {
          this._publicDataPromise = null;
          throw err;
        });

      return this._publicDataPromise;
    }

    /**
     * Retrieves general shop details (name, description, branding, business hours).
     */
    async getShopDetails() {
      const data = await this.getPublicData();
      return data.shop;
    }

    /**
     * Get the shop's address as a formatted string.
     * @returns {Promise<string|null>}
     */
    async getAddress() {
      const shop = await this.getShopDetails();
      return shop.address || null;
    }

    /**
     * Get the shop's phone number.
     * @returns {Promise<string|null>}
     */
    async getPhone() {
      const shop = await this.getShopDetails();
      return shop.phone || null;
    }

    /**
     * Get the shop's email.
     * @returns {Promise<string|null>}
     */
    async getEmail() {
      const shop = await this.getShopDetails();
      return shop.email || null;
    }

    /**
     * Retrieves all products marked as 'isSellable'.
     */
    async getSellableProducts() {
      const data = await this.getPublicData();
      return data.products || [];
    }

    /**
     * Retrieves all services marked as 'isBookable'.
     */
    async getBookableServices() {
      const data = await this.getPublicData();
      return data.services;
    }

    /**
     * Retrieves all public staff members.
     */
    async getPublicStaff() {
      const data = await this.getPublicData();
      return data.staff;
    }

    /**
     * Retrieves the latest public reviews for the shop.
     */
    async getReviews() {
      const data = await this.getPublicData();
      return data.reviews;
    }

    /**
     * Get details for a specific product.
     * @param {string} productId 
     */
    async getProductDetails(productId) {
      const data = await this.getPublicData();
      const product = (data.products || []).find(p => p.id === productId);
      if (!product) {
        throw new Error(`Product with ID ${productId} not found or is not sellable.`);
      }
      return product;
    }

    /**
     * Get details for a specific service.
     * @param {string} serviceId 
     */
    async getServiceDetails(serviceId) {
      const data = await this.getPublicData();
      const service = (data.services || []).find(s => s.id === serviceId);
      if (!service) {
        throw new Error(`Service with ID ${serviceId} not found or is not bookable.`);
      }
      return service;
    }

    /**
     * Retrieves all portfolio/gallery images for the shop.
     * @returns {Promise<Array>} Array of { id, imageUrl, caption, displayOrder, staffId }
     */
    async getPortfolioImages() {
      const data = await this.getPublicData();
      return data.portfolioImages || [];
    }

    /**
     * Retrieves the active loyalty program configuration.
     * @returns {Promise<Object|null>} Loyalty program details or null if none active
     */
    async getLoyaltyProgram() {
      const data = await this.getPublicData();
      return data.loyaltyProgram || null;
    }

    /**
     * Retrieves all membership tiers available at the shop.
     * @returns {Promise<Array>} Array of { id, name, description, price, interval }
     */
    async getMembershipTiers() {
      const data = await this.getPublicData();
      return data.membershipTiers || [];
    }

    /**
     * Retrieves the shop's business hours from customization.
     * @returns {Promise<Object|null>} Business hours object keyed by day, or null
     */
    async getBusinessHours() {
      const data = await this.getPublicData();
      return (data.shop && data.shop.customization && data.shop.customization.businessHours) || null;
    }

    /**
     * Fetches available time slots for a specific service and date.
     * @param {string} serviceId - The ID of the service to check availability for
     * @param {string} date - Date string in YYYY-MM-DD format
     * @param {string} [staffId] - Optional staff member ID to filter slots
     * @returns {Promise<Array>} Array of { time, staffId, staffName }
     */
    async getAvailableSlots(serviceId, date, staffId) {
      this._checkInit();
      if (!serviceId || !date) {
        throw new Error('serviceId and date are required to check available slots.');
      }

      let url = `${this.apiUrl}/api/shops/${this.shopId}/available-slots?serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}`;
      if (staffId) {
        url += `&staffId=${encodeURIComponent(staffId)}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch available slots.');
      }
      const data = await res.json();
      return data.slots || [];
    }

    /**
     * Joins the walk-in waitlist from a landing page (no auth required).
     * @param {Object} details
     * @param {string} details.clientName - Name of the client
     * @param {string} [details.clientPhone] - Client's phone number
     * @param {string} [details.serviceId] - Optional preferred service ID
     * @param {number} [details.partySize] - Party size (default 1)
     * @returns {Promise<Object>} The created waitlist entry
     */
    async joinWaitlist(details) {
      this._checkInit();
      if (!details || !details.clientName) {
        throw new Error('clientName is required to join the waitlist.');
      }

      const res = await fetch(`${this.apiUrl}/api/shops/${this.shopId}/public-waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to join waitlist.');
      }

      return await res.json();
    }

    /**
     * Books an appointment for a service.
     * @param {Object} bookingDetails 
     * @param {string} bookingDetails.serviceId - The ID of the service
     * @param {string} bookingDetails.staffId - The ID of the staff member
     * @param {string} bookingDetails.startTime - ISO-8601 string of the appointment start time
     * @param {string} bookingDetails.clientName - Name of the client booking the appointment
     * @param {string} [bookingDetails.clientEmail] - Client's email
     * @param {string} [bookingDetails.clientPhone] - Client's phone number
     * @param {string} [bookingDetails.notes] - Any special requests
     * @param {string[]} [bookingDetails.addonIds] - Array of addon IDs selected
     */
    async bookService(bookingDetails) {
      this._checkInit();

      // We pass isWalkIn: true to ensure the backend creates a guest profile based on the details provided
      // if the user is not authenticated via Supabase.
      const payload = {
        ...bookingDetails,
        isWalkIn: true
      };

      const res = await fetch(`${this.apiUrl}/api/shops/${this.shopId}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to book appointment.');
      }

      return await res.json();
    }

    /**
     * Submits a review for the shop.
     * @param {Object} reviewDetails 
     * @param {number} reviewDetails.rating - Rating from 1 to 5
     * @param {string} [reviewDetails.comment] - Optional text comment
     * @param {string} [reviewDetails.appointmentId] - Optional Appointment ID
     */
    async submitReview(reviewDetails) {
      this._checkInit();

      const { appointmentId, rating, comment } = reviewDetails;
      if (!rating || rating < 1 || rating > 5) {
        throw new Error('A rating between 1 and 5 is required to submit a review.');
      }

      const payload = { rating, comment: comment || null };
      if (appointmentId) payload.appointmentId = appointmentId;

      const res = await fetch(`${this.apiUrl}/api/shops/${this.shopId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit review.');
      }

      return await res.json();
    }

    /**
     * Initiates the checkout flow to buy a product via Stripe Checkout.
     * Redirects the current page to Stripe's hosted checkout.
     * @param {string} productId - The ID of the product to purchase
     * @param {number} [quantity=1] - Number of items to buy
     * @returns {Promise<Object>} The checkout session { url, sessionId }
     */
    async buyProduct(productId, quantity = 1) {
      this._checkInit();

      const res = await fetch(`${this.apiUrl}/api/shops/${this.shopId}/checkout/product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quantity,
          successUrl: window.location.href + (window.location.href.includes('?') ? '&' : '?') + 'checkout=success',
          cancelUrl: window.location.href + (window.location.href.includes('?') ? '&' : '?') + 'checkout=cancelled'
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create checkout session.');
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
      return data;
    }

    /**
     * Cleans up the SDK instance, clearing caches and resetting state.
     */
    destroy() {
      this._publicDataCache = null;
      this._publicDataPromise = null;
      this.shopId = null;

      // Remove injected CSS custom properties
      if (typeof document !== 'undefined') {
        const props = ['--primary', '--secondary', '--theme-color', '--brand-color'];
        props.forEach(function(prop) {
          document.documentElement.style.removeProperty(prop);
          if (document.body) document.body.style.removeProperty(prop);
        });
      }
      console.log('KutzApp SDK destroyed.');
    }
  }

  // Expose to global scope
  const root = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global;
  root.KutzApp = new KutzAppClient();

  if (typeof document !== 'undefined') {
    // Expose BarberAppointments
    root.BarberAppointments = (function() {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:2147483647;display:none;align-items:center;justify-content:center;';

      const content = document.createElement('div');
      content.style.cssText = 'width:100%;max-width:900px;height:90vh;max-height:800px;background:white;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.2);z-index:2147483647;position:relative;';

      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '&times;';
      closeBtn.style.cssText = 'position:absolute;top:10px;right:15px;background:transparent;border:none;font-size:24px;cursor:pointer;color:#333;z-index:2147483647;';
      closeBtn.onclick = () => overlay.style.display = 'none';

      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'width:100%;height:100%;border:none;';

      content.appendChild(closeBtn);
      content.appendChild(iframe);
      overlay.appendChild(content);
      
      // Wait for body
      const attach = () => {
        if (document.body) document.body.appendChild(overlay);
        else requestAnimationFrame(attach);
      };
      attach();

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.style.display = 'none';
      });

      return {
        open: function() {
          const apiUrl = root.KutzApp.apiUrl || 'https://barber-shop-website-ashy.vercel.app';
          iframe.src = apiUrl + '/my-appointments';
          if (!document.body.contains(overlay)) {
            document.body.appendChild(overlay);
          }
          overlay.style.display = 'flex';
          overlay.style.zIndex = '2147483647';
        },
        close: function() {
          overlay.style.display = 'none';
        }
      };
    })();

    // Expose BarberSignIn
    root.BarberSignIn = (function() {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:2147483647;display:none;align-items:center;justify-content:center;';

      const content = document.createElement('div');
      content.style.cssText = 'width:100%;max-width:500px;height:90vh;max-height:800px;background:white;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.2);z-index:2147483647;position:relative;';

      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '&times;';
      closeBtn.style.cssText = 'position:absolute;top:10px;right:15px;background:transparent;border:none;font-size:24px;cursor:pointer;color:#333;z-index:2147483647;';
      closeBtn.onclick = () => overlay.style.display = 'none';

      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'width:100%;height:100%;border:none;';

      content.appendChild(closeBtn);
      content.appendChild(iframe);
      overlay.appendChild(content);
      
      const attach = () => {
        if (document.body) document.body.appendChild(overlay);
        else requestAnimationFrame(attach);
      };
      attach();

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.style.display = 'none';
      });

      return {
        open: function() {
          const apiUrl = root.KutzApp.apiUrl || 'https://barber-shop-website-ashy.vercel.app';
          iframe.src = apiUrl + '/sign-in';
          if (!document.body.contains(overlay)) {
            document.body.appendChild(overlay);
          }
          overlay.style.display = 'flex';
          overlay.style.zIndex = '2147483647';
        },
        close: function() {
          overlay.style.display = 'none';
        }
      };
    })();
  }

})(typeof window !== 'undefined' ? window : this);
