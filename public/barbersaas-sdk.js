/**
 * BarberSaaS Client SDK
 * 
 * This SDK provides easy access to your shop's public data and core booking functionalities
 * so you can build entirely custom headless front-ends.
 */

(function(global) {
  class BarberSaaSClient {
    constructor() {
      this.shopId = null;
      this.apiUrl = 'https://barbersaas-henna.vercel.app'; // Default production URL
      this._publicDataCache = null;
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
        console.error('BarberSaaS SDK: init() requires a valid shopId or a data-shop-id attribute on the script tag.');
        return;
      }
      this.shopId = shopId;
      if (typeof options === 'string') {
        this.apiUrl = options;
      } else {
        if (options.apiUrl) this.apiUrl = options.apiUrl;
        this.primaryColor = options.primaryColor || null;
        this.secondaryColor = options.secondaryColor || null;
      }
      console.log('BarberSaaS SDK initialized for shop:', shopId);
    }

    _checkInit() {
      if (!this.shopId) {
        throw new Error('BarberSaaS SDK is not initialized. Please call BarberSaaS.init("YOUR_SHOP_ID") first.');
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

      const res = await fetch(`${this.apiUrl}/api/shops/${this.shopId}/public-data?_t=${Date.now()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch public data.');
      }

      const data = await res.json();
      this._publicDataCache = data;
      return data;
    }

    /**
     * Retrieves general shop details (name, description, branding, business hours).
     */
    async getShopDetails() {
      const data = await this.getPublicData();
      return data.shop;
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
     * @param {string} reviewDetails.appointmentId - The Appointment ID confirming the client's visit
     * @param {number} reviewDetails.rating - Rating from 1 to 5
     * @param {string} [reviewDetails.comment] - Optional text comment
     */
    async submitReview(reviewDetails) {
      this._checkInit();

      const { appointmentId, rating, comment } = reviewDetails;
      if (!appointmentId || !rating) {
        throw new Error('appointmentId and rating are required to submit a review.');
      }

      const res = await fetch(`${this.apiUrl}/api/shops/${this.shopId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, rating, comment })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit review.');
      }

      return await res.json();
    }

    /**
     * Initiates the checkout flow to buy a product.
     * Note: This is currently a placeholder representing the integration point for Stripe.
     * @param {string} productId 
     * @param {number} [quantity=1] 
     */
    async buyProduct(productId, quantity = 1) {
      this._checkInit();
      const product = await this.getProductDetails(productId);
      
      console.log(`Initiating checkout for ${quantity}x ${product.name} ($${product.price} each).`);
      
      // In a full implementation, this would call a backend endpoint to generate a Stripe Checkout Session URL
      // e.g. POST /api/shops/${this.shopId}/checkout/product
      // and then redirect the user: window.location.href = sessionUrl;
      
      alert(`SDK Output: Proceeding to checkout for ${quantity}x ${product.name}.\\n(Stripe integration required to complete transaction)`);
      return { status: 'pending_checkout', product, quantity };
    }
  }

  // Expose to global scope
  const root = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global;
  root.BarberSaaS = new BarberSaaSClient();

})(typeof window !== 'undefined' ? window : this);
