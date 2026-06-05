import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function SDKDocsPage({ params }: { params: Promise<{ shopId: string }> }) {
 const { shopId } = await params;
 
 const shop = await prisma.shop.findUnique({
 where: { id: shopId },
 select: { name: true, subdomain: true, customDomain: true, customization: true }
 });

 if (!shop) return notFound();

 return (
 <div className="w-full max-w-4xl space-y-8">
 <div className="mb-6">
 <h1 className="text-2xl font-bold text-crm-text mb-2">Developer SDK & Headless Integration</h1>
 <p className="text-crm-muted text-[14px]">
 Use the Kutz Client SDK to build completely custom headless front-ends or embed functionality into your existing website. The SDK is hardened to only expose public-facing customer functionality (Products, Services, Staff, Reviews, Booking, and Purchasing).
 </p>
 </div>

 <div className="bg-crm-primary/10 border border-crm-primary/30 text-crm-primary p-4 rounded-xl text-[13px]">
 <strong>Security Notice:</strong> The SDK automatically validates the origin of incoming requests. To use the SDK on your custom landing page, ensure your domain is added to your <strong>Allowed Domains</strong> list in Settings.
 </div>

 <div className="bg-crm-surface p-8 rounded-xl shadow-sm border border-crm-border">
 <h2 className="font-bold text-lg mb-4">1. Include the SDK</h2>
 <p className="text-crm-muted text-[13px] mb-4">Add the following script tag to the <code>&lt;head&gt;</code> of your HTML file:</p>
 <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-[13px] overflow-x-auto mb-6">
 <code>{`<script src="https://your-domain.com/kutzapp-sdk.js"></script>`}</code>
 </pre>

 <h2 className="font-bold text-lg mb-4">2. Initialize the SDK</h2>
 <p className="text-crm-muted text-[13px] mb-4">Initialize the SDK using your unique Shop ID before calling any functions:</p>
 <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-[13px] overflow-x-auto mb-6">
 <code>{`// Initialize with your Shop ID
Kutz.init('${shopId}');`}</code>
 </pre>

 <h2 className="font-bold text-lg mb-4">3. Available Functions</h2>
 <p className="text-crm-muted text-[13px] mb-4">The SDK provides Promise-based functions to fetch your shop's data and perform actions. Note: All data retrieval functions automatically filter out private data (e.g. products marked as not sellable, services marked as not bookable).</p>
 
 <div className="space-y-6">
 <div className="border border-crm-border p-5 rounded-xl bg-crm-bg">
 <h3 className="font-bold text-crm-text mb-2">Fetch Public Data</h3>
 <p className="text-crm-muted text-[13px] mb-3">Retrieve your shop's sellable products, bookable services, public staff, and approved reviews using our modular helper methods.</p>
 <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-[12px] overflow-x-auto">
 <code>{`// Fetch everything simultaneously using Promise.all (Recommended)
Promise.all([
 Kutz.getShopDetails(),
 Kutz.getBookableServices(),
 Kutz.getSellableProducts(),
 Kutz.getReviews(),
 Kutz.getPublicStaff()
]).then(([shop, services, products, reviews, staff]) => {
 console.log('Shop Name:', shop.name);
 console.log('Services:', services);
});

// Or fetch individual collections if you only need certain data
const products = await Kutz.getSellableProducts();
const services = await Kutz.getBookableServices();

// Get specific details
const product = await Kutz.getProductDetails('product_123');
const service = await Kutz.getServiceDetails('service_456');`}</code>
 </pre>
 </div>

 <div className="border border-crm-border p-5 rounded-xl bg-crm-bg">
 <h3 className="font-bold text-crm-text mb-2">Book an Appointment</h3>
 <p className="text-crm-muted text-[13px] mb-3">Submit a new booking. The SDK will automatically create a guest profile if the client is not signed in.</p>
 <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-[12px] overflow-x-auto">
 <code>{`const booking = await Kutz.bookService({
 serviceId: 'service_123',
 staffId: 'staff_456',
 startTime: '2023-12-25T14:30:00.000Z', // ISO-8601 UTC
 clientName: 'John Doe',
 clientEmail: 'john@example.com', // Optional
 clientPhone: '555-123-4567', // Optional
 notes: 'First time visitor', // Optional
 addonIds: ['addon_789'] // Optional array of Add-on IDs
});

console.log('Booking successful:', booking);`}</code>
 </pre>
 </div>

 <div className="border border-crm-border p-5 rounded-xl bg-crm-bg">
 <h3 className="font-bold text-crm-text mb-2">Buy a Product</h3>
 <p className="text-crm-muted text-[13px] mb-3">Initiate a secure checkout session for a specific product.</p>
 <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-[12px] overflow-x-auto">
 <code>{`// Initiates the checkout flow (redirects to Stripe)
const checkout = await Kutz.buyProduct('product_123', 2); // Quantity: 2`}</code>
 </pre>
 </div>

 <div className="border border-crm-border p-5 rounded-xl bg-crm-bg">
 <h3 className="font-bold text-crm-text mb-2">Submit a Review</h3>
 <p className="text-crm-muted text-[13px] mb-3">Submit a new review linked to a specific appointment ID.</p>
 <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-[12px] overflow-x-auto">
 <code>{`const review = await Kutz.submitReview({
 appointmentId: 'appt_123', // The confirmed Appointment ID
 rating: 5, // 1 to 5
 comment: 'Great haircut!' // Optional
});

console.log('Review submitted:', review);`}</code>
 </pre>
 </div>
 </div>
 </div>

 <div className="bg-crm-surface p-8 rounded-xl shadow-sm border border-crm-border">
 <h2 className="font-bold text-lg mb-6">Drop-in Pre-built Widgets</h2>
 <p className="text-crm-muted text-[13px] mb-6">If you do not want to build your UI from scratch using the Headless methods above, you can simply drop in our pre-built widgets anywhere on your site.</p>

 <div className="space-y-8">
 <div>
 <h3 className="font-bold text-crm-text mb-2 border-b pb-2">Booking Modal Widget</h3>
 <p className="text-crm-muted text-[13px] mb-3">Embed the multi-step booking modal directly into your external website.</p>
 <p className="text-crm-muted text-[13px] mb-2 font-semibold">1. Add the Script Tag:</p>
 <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-[12px] overflow-x-auto mb-4">
 <code>{`<script src="https://your-domain.com/booking-modal.js" data-shop-id="${shopId}"></script>`}</code>
 </pre>
 <p className="text-crm-muted text-[13px] mb-2 font-semibold">2. Add the Booking Button:</p>
 <p className="text-crm-muted text-[13px] mb-2">Place this button anywhere on your page. The modal will open when clicked. Note: The button MUST have the <code>id="barber-booking-btn"</code>.</p>
 <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-[12px] overflow-x-auto">
 <code>{`<button id="barber-booking-btn" style="padding: 10px 20px; background: #000; color: #fff; border: none; border-radius: 5px; cursor: pointer;">
 Book Appointment
</button>`}</code>
 </pre>
 </div>

 <div>
 <h3 className="font-bold text-crm-text mb-2 border-b pb-2">Product Checkout Widget</h3>
 <p className="text-crm-muted text-[13px] mb-3">Display a pop-up modal for product details and initiate checkout.</p>
 <p className="text-crm-muted text-[13px] mb-2 font-semibold">1. Add the Script Tag:</p>
 <p className="text-crm-muted text-[13px] mb-2">It will automatically detect any buttons with the class <code>btn-details</code> or <code>btn-buy</code> inside a <code>.service-card</code>.</p>
 <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-[12px] overflow-x-auto">
 <code>{`<script src="https://your-domain.com/product-widget.js" data-shop-id="${shopId}"></script>`}</code>
 </pre>
 </div>

 <div>
 <h3 className="font-bold text-crm-text mb-2 border-b pb-2">Client Reviews Widget</h3>
 <p className="text-crm-muted text-[13px] mb-3">Embed a pop-up modal that displays your shop's reviews and allows clients to submit new ones.</p>
 <p className="text-crm-muted text-[13px] mb-2 font-semibold">1. Add the Script Tag:</p>
 <p className="text-crm-muted text-[13px] mb-2">To open the modal, add the class <code>barber-reviews-trigger</code> to any button or link on your site.</p>
 <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-[12px] overflow-x-auto">
 <code>{`<script src="https://your-domain.com/review-widget.js" data-shop-id="${shopId}"></script>`}</code>
 </pre>
 </div>
 </div>
 </div>
 </div>
 );
}
