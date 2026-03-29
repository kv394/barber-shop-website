import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

async function getShopBySlug(slug: string) {
  // First, try to find by ID (for backward compatibility)
  let shop: any = await prisma.shop.findUnique({
    where: { id: slug },
    include: {
      services: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!shop) {
    // If not found by ID, search by name (converted to slug format)
    const allShops = await prisma.shop.findMany({
      include: {
        services: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    shop = allShops.find(
      (s: any) => s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') === slug.toLowerCase()
    ) || null;
  }

  if (!shop) {
    return null;
  }

  // Serialize to plain objects and ensure customization is included
  const serialized = JSON.parse(JSON.stringify(shop));
  return {
    ...serialized,
    customization: serialized.customization || {},
    template: serialized.template || 'modern',
  };
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const shop = await getShopBySlug(params.slug);

  if (!shop) {
    return {
      title: 'Shop Not Found',
      description: 'The shop you are looking for does not exist.',
    };
  }

  return {
    title: `${shop.name} - Services & Booking`,
    description: shop.description || `Book services at ${shop.name}`,
    openGraph: {
      title: `${shop.name} - Services & Booking`,
      description: shop.description || `Book services at ${shop.name}`,
    },
  };
}

export default async function PublicShopPage({
  params,
}: {
  params: { slug: string };
}) {
  const shop = await getShopBySlug(params.slug);

  if (!shop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Shop Not Found</h1>
          <p className="text-gray-400">We couldn't find the shop you're looking for.</p>
        </div>
      </div>
    );
  }

  // Use the custom colors if they exist, otherwise fallback to defaults
  const primaryColor = shop.customization?.primaryColor || '#3b82f6'; // Default blue-500
  const secondaryColor = shop.customization?.secondaryColor || '#06b6d4'; // Default cyan-500
  const templateType = shop.template || 'modern';

  // Define different layouts based on the selected template
  
  if (templateType === 'minimal') {
    return (
      <main className="min-h-screen bg-white text-gray-900 font-sans">
        <header className="max-w-4xl mx-auto px-6 py-12 border-b border-gray-100 flex flex-col md:flex-row justify-between items-end md:items-center">
          <div>
            <h1 className="text-4xl font-light tracking-tight" style={{ color: primaryColor }}>{shop.name}</h1>
            {shop.description && <p className="text-gray-500 mt-2">{shop.description}</p>}
          </div>
          <div className="text-right mt-6 md:mt-0 text-sm text-gray-500">
             {shop.customization?.phone && <p>{shop.customization.phone}</p>}
             {shop.customization?.address && <p>{shop.customization.address}</p>}
          </div>
        </header>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-10">Service Menu</h2>
          {shop.services && shop.services.length > 0 ? (
            <div className="space-y-8">
              {shop.services.map((service: any) => (
                <div key={service.id} className="flex justify-between items-baseline group cursor-pointer">
                  <div className="flex-1 border-b border-dotted border-gray-300 pb-1 mr-4">
                    <h3 className="text-lg font-medium transition-colors" style={{ color: primaryColor }}>{service.name}</h3>
                    {service.description && <p className="text-gray-500 text-sm mt-1">{service.description}</p>}
                  </div>
                  <div className="text-right">
                    <span className="font-medium">${service.price.toFixed(2)}</span>
                    <span className="text-gray-400 text-xs ml-2">{service.duration}m</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">No services listed.</p>
          )}
        </section>

        <section className="max-w-4xl mx-auto px-6 pb-20 text-center">
            <button 
              className="px-8 py-3 text-white transition-colors text-sm font-medium tracking-wide uppercase rounded-md"
              style={{ backgroundColor: primaryColor }}
            >
              Make an Appointment
            </button>
        </section>
      </main>
    );
  }

  if (templateType === 'classic') {
    return (
      <main className="min-h-screen bg-[#fdfbf7] text-[#2c1e16] font-serif">
        <header className="border-b-4 border-[#2c1e16] py-16 text-center bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]">
          <h1 className="text-6xl font-bold uppercase tracking-widest mb-4" style={{ color: primaryColor }}>{shop.name}</h1>
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="h-px w-16 bg-[#2c1e16]"></div>
            <span className="italic text-lg">Est. {new Date(shop.createdAt).getFullYear()}</span>
            <div className="h-px w-16 bg-[#2c1e16]"></div>
          </div>
          {shop.description && <p className="max-w-xl mx-auto text-[#5a4634]">{shop.description}</p>}
        </header>

        <section className="max-w-5xl mx-auto px-8 py-20">
          <h2 className="text-3xl font-bold text-center uppercase tracking-widest mb-16 relative">
            <span className="bg-[#fdfbf7] px-6 relative z-10">Our Services</span>
            <div className="absolute left-0 top-1/2 w-full h-px bg-[#e6d9c6] -z-0"></div>
          </h2>

          <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
            {shop.services?.map((service: any) => (
              <div key={service.id} className="text-center">
                <h3 className="text-2xl font-bold mb-2" style={{ color: primaryColor }}>{service.name}</h3>
                <div className="font-sans text-[#8b7355] text-sm tracking-widest uppercase mb-3">
                  ${service.price.toFixed(2)} &bull; {service.duration} MINS
                </div>
                {service.description && <p className="text-[#5a4634] italic text-sm">{service.description}</p>}
              </div>
            ))}
          </div>

          <div className="text-center mt-20">
            <button 
              className="border-2 px-12 py-4 uppercase tracking-widest font-bold transition-colors"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              Book a Chair
            </button>
          </div>
        </section>
        
        <footer className="bg-[#2c1e16] text-[#e6d9c6] py-12 text-center text-sm font-sans tracking-widest uppercase">
             <p className="mb-2">{shop.customization?.address || 'Visit us today'}</p>
             <p>{shop.customization?.phone} | {shop.customization?.email}</p>
        </footer>
      </main>
    );
  }

  // Default 'modern' template (the one that was originally there)
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section 
        className="bg-black/40 backdrop-blur-md border-b border-slate-700"
        style={{ borderBottomColor: primaryColor }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <h1 
              className="text-5xl md:text-6xl font-bold mb-6"
              style={{ color: primaryColor }}
            >
              {shop.name}
            </h1>
            {shop.description && (
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                {shop.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Our Services</h2>
          <div 
            className="w-20 h-1 rounded-full"
            style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
          ></div>
        </div>

        {shop.services && shop.services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shop.services.map((service: any) => (
              <div
                key={service.id}
                className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-slate-700 transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-2xl font-bold text-white transition-colors">
                    {service.name}
                  </h3>
                  <div 
                    className="px-3 py-1 rounded-full text-sm font-semibold"
                    style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                  >
                    ${service.price.toFixed(2)}
                  </div>
                </div>

                {service.description && (
                  <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                    {service.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                  <div className="text-gray-500 text-sm">
                    ⏱️ {service.duration} minutes
                  </div>
                  <button 
                    className="text-white px-4 py-2 rounded-lg font-semibold transition-opacity hover:opacity-90 text-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">
              No services available at the moment. Please check back later.
            </p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section 
        className="py-16"
        style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Book?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Schedule your appointment today and get the best service in town.
          </p>
          <button 
            className="bg-white font-bold py-3 px-8 rounded-lg transition-colors text-lg"
            style={{ color: primaryColor }}
          >
            Book an Appointment
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/50 border-t border-slate-700 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">{shop.name}</h3>
              <p className="text-gray-400 mb-4">
                {shop.description || 'Your trusted service provider'}
              </p>
              {shop.customization?.address && (
                <p className="text-gray-400 text-sm">{shop.customization.address}</p>
              )}
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                {shop.customization?.phone && (
                  <li>
                    <a href={`tel:${shop.customization.phone}`} className="hover:text-white transition">
                      📞 {shop.customization.phone}
                    </a>
                  </li>
                )}
                {shop.customization?.email && (
                  <li>
                    <a href={`mailto:${shop.customization.email}`} className="hover:text-white transition">
                      ✉️ {shop.customization.email}
                    </a>
                  </li>
                )}
                <li>
                  <a href="#services" className="hover:text-white transition">
                    Services
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Follow Us</h4>
              <div className="flex gap-4">
                {shop.customization?.social?.facebook && (
                  <a
                    href={shop.customization.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition"
                  >
                    Facebook
                  </a>
                )}
                {shop.customization?.social?.instagram && (
                  <a
                    href={shop.customization.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition"
                  >
                    Instagram
                  </a>
                )}
                {shop.customization?.social?.twitter && (
                  <a
                    href={shop.customization.social.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition"
                  >
                    Twitter
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-gray-500 text-sm">
            <p>
              &copy; {new Date().getFullYear()} {shop.name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
