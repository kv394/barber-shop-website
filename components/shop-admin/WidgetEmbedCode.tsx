'use client';

import { useState } from 'react';

export default function WidgetEmbedCode({ shopId }: { shopId: string }) {
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedButton, setCopiedButton] = useState(false);
  const [copiedProductScript, setCopiedProductScript] = useState(false);
  const [copiedReviewScript, setCopiedReviewScript] = useState(false);
  const [copiedSdkScript, setCopiedSdkScript] = useState(false);

  const scriptCode = `<script src="https://barbersaas.com/booking-modal.js" data-shop-id="${shopId}"></script>`;
  const buttonCode = `<button id="barber-booking-btn" style="padding: 10px 20px; background: #000; color: #fff; border: none; border-radius: 5px; cursor: pointer;">
  Book Appointment
</button>`;

  const productScriptCode = `<script src="https://barbersaas.com/product-widget.js" data-shop-id="${shopId}"></script>`;
  const reviewScriptCode = `<script src="https://barbersaas.com/review-widget.js" data-shop-id="${shopId}"></script>`;
  
  const sdkScriptCode = `<script src="https://barbersaas.com/barbersaas-sdk.js"></script>
<script>
  window.addEventListener('load', function() {
    BarberSaaS.init("${shopId}");
    
    // Example: Fetch public products, services, staff, and reviews
    BarberSaaS.getPublicData().then(data => console.log('Shop Data:', data));
  });
</script>`;

  const copyToClipboard = (text: string, setCopied: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 mt-6 mb-6">
      {/* BOOKING WIDGET */}
      <div className="bg-crm-bg/50 p-6 rounded-xl border border-crm-border shadow-sm">
        <h2 className="font-bold text-crm-text mb-2 text-xl">Booking Modal Embed Code</h2>
        <p className="text-crm-muted mb-6 text-[13px]">
          Embed the multi-step booking modal directly into your external website.
        </p>

        <div className="mb-6">
          <h3 className="font-semibold text-crm-text mb-2 text-[14px]">Step 1: Add the Script Tag</h3>
          <p className="text-crm-muted mb-3 text-[13px]">Add this script tag right before the closing <code>&lt;/body&gt;</code> tag of your website.</p>
          <div className="flex items-start gap-4 bg-crm-surface p-4 rounded-lg border border-crm-border relative">
            <div className="flex-1 overflow-x-auto pb-1 custom-scrollbar">
              <pre className="text-crm-accent text-[13px] whitespace-pre-wrap font-mono">
                {scriptCode}
              </pre>
            </div>
            <button
              onClick={() => copyToClipboard(scriptCode, setCopiedScript)}
              className="shrink-0 bg-crm-accent/10 hover:bg-crm-accent/20 text-crm-accent px-4 py-2 rounded-md text-[13px] font-semibold transition-colors flex items-center justify-center min-w-[110px] absolute top-4 right-4"
            >
              {copiedScript ? 'Copied!' : 'Copy Script'}
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-crm-text mb-2 text-[14px]">Step 2: Add the Booking Button</h3>
          <p className="text-crm-muted mb-3 text-[13px]">Place this button anywhere on your page. The modal will open when clicked. <em>Note: The button MUST have the <code>id="barber-booking-btn"</code> for it to work.</em></p>
          <div className="flex items-start gap-4 bg-crm-surface p-4 rounded-lg border border-crm-border relative">
            <div className="flex-1 overflow-x-auto pb-1 custom-scrollbar">
              <pre className="text-crm-accent text-[13px] whitespace-pre-wrap font-mono">
                {buttonCode}
              </pre>
            </div>
            <button
              onClick={() => copyToClipboard(buttonCode, setCopiedButton)}
              className="shrink-0 bg-crm-accent/10 hover:bg-crm-accent/20 text-crm-accent px-4 py-2 rounded-md text-[13px] font-semibold transition-colors flex items-center justify-center min-w-[110px] absolute top-4 right-4"
            >
              {copiedButton ? 'Copied!' : 'Copy Button'}
            </button>
          </div>
        </div>
      </div>

      {/* PRODUCT WIDGET */}
      <div className="bg-crm-bg/50 p-6 rounded-xl border border-crm-border shadow-sm">
        <h2 className="font-bold text-crm-text mb-2 text-xl">Product Display & Checkout Widget</h2>
        <p className="text-crm-muted mb-6 text-[13px]">
          Display a pop-up modal for product details and initiate checkout from your external website.
        </p>

        <div>
          <h3 className="font-semibold text-crm-text mb-2 text-[14px]">Step 1: Add the Script Tag</h3>
          <p className="text-crm-muted mb-3 text-[13px]">Add this script tag right before the closing <code>&lt;/body&gt;</code> tag. It will automatically detect any buttons with the class <code>btn-details</code> or <code>btn-buy</code> inside a <code>.service-card</code>.</p>
          <div className="flex items-start gap-4 bg-crm-surface p-4 rounded-lg border border-crm-border relative">
            <div className="flex-1 overflow-x-auto pb-1 custom-scrollbar">
              <pre className="text-crm-accent text-[13px] whitespace-pre-wrap font-mono">
                {productScriptCode}
              </pre>
            </div>
            <button
              onClick={() => copyToClipboard(productScriptCode, setCopiedProductScript)}
              className="shrink-0 bg-crm-accent/10 hover:bg-crm-accent/20 text-crm-accent px-4 py-2 rounded-md text-[13px] font-semibold transition-colors flex items-center justify-center min-w-[110px] absolute top-4 right-4"
            >
              {copiedProductScript ? 'Copied!' : 'Copy Script'}
            </button>
          </div>
        </div>
      </div>

      {/* REVIEW WIDGET */}
      <div className="bg-crm-bg/50 p-6 rounded-xl border border-crm-border shadow-sm">
        <h2 className="font-bold text-crm-text mb-2 text-xl">Client Reviews Widget</h2>
        <p className="text-crm-muted mb-6 text-[13px]">
          Embed a pop-up modal that displays your shop's reviews and allows verified clients to submit new ones.
        </p>

        <div>
          <h3 className="font-semibold text-crm-text mb-2 text-[14px]">Step 1: Add the Script Tag</h3>
          <p className="text-crm-muted mb-3 text-[13px]">Add this script tag right before the closing <code>&lt;/body&gt;</code> tag. To open the modal, add the class <code>barber-reviews-trigger</code> to any button or link on your site.</p>
          <div className="flex items-start gap-4 bg-crm-surface p-4 rounded-lg border border-crm-border relative">
            <div className="flex-1 overflow-x-auto pb-1 custom-scrollbar">
              <pre className="text-crm-accent text-[13px] whitespace-pre-wrap font-mono">
                {reviewScriptCode}
              </pre>
            </div>
            <button
              onClick={() => copyToClipboard(reviewScriptCode, setCopiedReviewScript)}
              className="shrink-0 bg-crm-accent/10 hover:bg-crm-accent/20 text-crm-accent px-4 py-2 rounded-md text-[13px] font-semibold transition-colors flex items-center justify-center min-w-[110px] absolute top-4 right-4"
            >
              {copiedReviewScript ? 'Copied!' : 'Copy Script'}
            </button>
          </div>
        </div>
      </div>

      {/* HEADLESS JS SDK */}
      <div className="bg-crm-bg/50 p-6 rounded-xl border border-crm-border shadow-sm">
        <h2 className="font-bold text-crm-text mb-2 text-xl">Headless JavaScript SDK</h2>
        <p className="text-crm-muted mb-6 text-[13px]">
          Build entirely custom front-ends using our lightweight JavaScript SDK. This gives you programmatic access to your public products, services, staff, and reviews, along with methods to book appointments or submit reviews from your own custom UI.
        </p>

        <div className="mb-6 bg-status-info/10 border border-status-info/30 rounded-lg p-4">
          <h3 className="font-bold text-status-info mb-1 text-[14px]">🔒 Security Note: Domain Validation</h3>
          <p className="text-crm-muted text-[13px]">
            To keep your shop data safe from unauthorized access or scraping, the SDK will <strong>only work</strong> on domains authorized by your shop. Your BarberSaaS subdomains and custom domains are automatically approved. If you are embedding this SDK on an external website (like WordPress or Webflow), please ensure your domain is configured correctly in your shop settings to prevent CORS and unauthorized access errors.
          </p>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-crm-text mb-2 text-[14px]">Step 1: Initialize the SDK</h3>
          <p className="text-crm-muted mb-3 text-[13px]">Add this script tag and initialization code. You can then call methods like <code>BarberSaaS.getPublicData()</code> or <code>BarberSaaS.bookService()</code>.</p>
          <div className="flex items-start gap-4 bg-crm-surface p-4 rounded-lg border border-crm-border relative">
            <div className="flex-1 overflow-x-auto pb-1 custom-scrollbar">
              <pre className="text-crm-accent text-[13px] whitespace-pre-wrap font-mono">
                {sdkScriptCode}
              </pre>
            </div>
            <button
              onClick={() => copyToClipboard(sdkScriptCode, setCopiedSdkScript)}
              className="shrink-0 bg-crm-accent/10 hover:bg-crm-accent/20 text-crm-accent px-4 py-2 rounded-md text-[13px] font-semibold transition-colors flex items-center justify-center min-w-[110px] absolute top-4 right-4"
            >
              {copiedSdkScript ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-crm-text mb-4 text-[14px]">SDK Method Reference</h3>
          <div className="space-y-4">
            
            <div className="bg-crm-surface p-4 rounded-lg border border-crm-border">
              <code className="text-status-info font-bold text-[13px] block mb-1">async BarberSaaS.getShopDetails()</code>
              <p className="text-crm-muted text-[13px]">Returns general shop details including name, description, address, contact info, business hours, and branding colors/logos.</p>
            </div>

            <div className="bg-crm-surface p-4 rounded-lg border border-crm-border">
              <code className="text-status-info font-bold text-[13px] block mb-1">async BarberSaaS.getSellableProducts()</code>
              <p className="text-crm-muted text-[13px]">Returns a list of all products marked as sellable by the shop admin.</p>
            </div>

            <div className="bg-crm-surface p-4 rounded-lg border border-crm-border">
              <code className="text-status-info font-bold text-[13px] block mb-1">async BarberSaaS.getBookableServices()</code>
              <p className="text-crm-muted text-[13px]">Returns a list of all services available for public booking, including prices and durations.</p>
            </div>

            <div className="bg-crm-surface p-4 rounded-lg border border-crm-border">
              <code className="text-status-info font-bold text-[13px] block mb-1">async BarberSaaS.getPublicStaff()</code>
              <p className="text-crm-muted text-[13px]">Returns public details of staff members (names, photos, working hours) available for booking.</p>
            </div>

            <div className="bg-crm-surface p-4 rounded-lg border border-crm-border">
              <code className="text-status-info font-bold text-[13px] block mb-1">async BarberSaaS.getReviews()</code>
              <p className="text-crm-muted text-[13px]">Returns the latest verified customer reviews and ratings for the shop.</p>
            </div>

            <div className="bg-crm-surface p-4 rounded-lg border border-crm-border">
              <code className="text-status-info font-bold text-[13px] block mb-1">async BarberSaaS.bookService(bookingDetails)</code>
              <p className="text-crm-muted text-[13px] mb-2">Creates a new appointment. Automatically provisions a guest client profile.</p>
              <pre className="text-crm-accent text-[12px] whitespace-pre-wrap font-mono bg-crm-bg p-2 rounded">
{`await BarberSaaS.bookService({
  serviceId: "srv_123",
  staffId: "usr_123",
  startTime: "2026-04-30T12:30:00Z",
  clientName: "John Doe",
  clientEmail: "john@example.com"
});`}
              </pre>
            </div>

            <div className="bg-crm-surface p-4 rounded-lg border border-crm-border">
              <code className="text-status-info font-bold text-[13px] block mb-1">async BarberSaaS.submitReview(reviewDetails)</code>
              <p className="text-crm-muted text-[13px] mb-2">Submits a verified review linked to an existing appointment.</p>
              <pre className="text-crm-accent text-[12px] whitespace-pre-wrap font-mono bg-crm-bg p-2 rounded">
{`await BarberSaaS.submitReview({
  appointmentId: "apt_123",
  rating: 5,
  comment: "Great experience!"
});`}
              </pre>
            </div>

            <div className="bg-crm-surface p-4 rounded-lg border border-crm-border">
              <code className="text-status-info font-bold text-[13px] block mb-1">async BarberSaaS.buyProduct(productId, quantity)</code>
              <p className="text-crm-muted text-[13px]">Initiates a checkout flow for a specific product. (Currently triggers a checkout alert event pending Stripe integration).</p>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
