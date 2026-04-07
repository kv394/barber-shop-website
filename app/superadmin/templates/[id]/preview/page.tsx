import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import Handlebars from 'handlebars';

export const dynamic = 'force-dynamic';

export default async function TemplatePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const userId = authUser?.id;
  if (!userId) return redirect('/');

  const dbUser = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUser?.email || '' }] }, select: { role: true } });
  if (dbUser?.role !== 'SUPER_ADMIN') {
    return redirect('/');
  }

  const { id } = await params;
  
  const template = await prisma.dynamicTemplate.findUnique({
    where: { id }
  });

  if (!template) {
    notFound();
  }

  const mockShop = {
    name: 'Vintage Barber Co.',
    description: 'Premium grooming for the modern gentleman. Step back in time and enjoy a classic experience.',
    services: [
      { name: 'Classic Haircut', description: 'A tailored haircut with a hot towel finish.', price: 35, duration: 30 },
      { name: 'Beard Trim', description: 'Precision trimming and straight razor lineup.', price: 25, duration: 20 },
      { name: 'The Full Works', description: 'Haircut, beard trim, and a relaxing facial massage.', price: 70, duration: 60 },
    ]
  };

  const primaryColor = '#eab308'; // yellow-500
  const secondaryColor = '#f59e0b'; // amber-500

  let html = '';
  try {
    const compiledTemplate = Handlebars.compile(template.htmlCode);
    html = compiledTemplate({
      shop: mockShop,
      primaryColor,
      secondaryColor
    });
  } catch (err: any) {
    html = `<div style="padding: 2rem; color: red;"><h2>Handlebars Compilation Error</h2><pre>${err.message}</pre></div>`;
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      {/* Super Admin Preview Header */}
      <div className="bg-black/80 text-white p-3 border-b border-white/10 flex justify-between items-center sticky top-0 z-50">
        <div>
          <span className="font-bold text-brand-gold mr-3">Previewing Template:</span>
          <span>{template.name}</span>
        </div>
        <Link 
          href="/superadmin/templates"
          className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition"
        >
          Close Preview
        </Link>
      </div>

      {/* Rendered Template */}
      <div className="bg-white text-black min-h-screen">
        {template.cssCode && (
          <style dangerouslySetInnerHTML={{ __html: template.cssCode }} />
        )}
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </main>
  );
}