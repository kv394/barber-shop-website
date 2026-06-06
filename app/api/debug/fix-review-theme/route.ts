import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';

/**
 * POST /api/debug/fix-review-theme
 * Replaces review form CSS with theme-appropriate colors detected from the page
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shopId } = body;

    if (!shopId) {
      return NextResponse.json({ error: 'shopId required' }, { status: 400 });
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { customization: true, name: true }
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const customization = (shop.customization || {}) as any;
    let html = customization.customHtml || '';

    // Detect if this is a light or dark theme
    const bgMainMatch = html.match(/--bg-main:\s*([^;]+);/);
    const bgMain = bgMainMatch ? bgMainMatch[1].trim() : '#131313';
    
    // Simple heuristic: if bg-main starts with #F or #E or #D or #C, it's light
    const isLight = /^#[C-Fc-f]/.test(bgMain);

    // Detect theme colors
    const getVar = (pattern: string, fallback: string) => {
      const m = html.match(new RegExp(pattern + ':\\s*([^;]+);'));
      return m ? m[1].trim() : fallback;
    };

    let sectionBg, cardBg, textColor, textMuted, borderColor, inputBg, accentColor, fontHeading, fontBody, submitBg, submitText, starInactive, hoverShadow;

    if (isLight) {
      sectionBg = getVar('--bg-cream|--bg-lightest|--bg-blush', '#FAF5F3');
      cardBg = '#FFFFFF';
      textColor = getVar('--text-heading', '#2D2428');
      textMuted = getVar('--text-muted', '#8B7580');
      borderColor = 'rgba(45,36,40,0.1)';
      inputBg = getVar('--bg-lightest|--bg-main', '#FFF9F7');
      accentColor = getVar('--rose-primary|--gold|--primary', '#D4849C');
      fontHeading = getVar('--font-heading', 'Georgia, serif');
      fontBody = getVar('--font-body', 'sans-serif');
      submitBg = accentColor;
      submitText = '#FFFFFF';
      starInactive = 'rgba(45,36,40,0.15)';
      hoverShadow = accentColor + '30';
    } else {
      sectionBg = getVar('--bg-darkest|--bg-main', '#0e0e0e');
      cardBg = getVar('--bg-card|--bg-section', '#252525');
      textColor = '#FFFFFF';
      textMuted = getVar('--text-muted', 'rgba(255,255,255,0.5)');
      borderColor = 'rgba(255,255,255,0.08)';
      inputBg = getVar('--bg-main', 'rgba(0,0,0,0.3)');
      accentColor = getVar('--gold-primary|--gold|--primary', '#e9c176');
      fontHeading = getVar('--font-serif|--font-heading', 'Georgia, serif');
      fontBody = getVar('--font-sans|--font-body', 'sans-serif');
      submitBg = accentColor;
      submitText = '#000000';
      starInactive = 'rgba(255,255,255,0.15)';
      hoverShadow = accentColor + '40';
    }

    const newCss = `/* Review Form */
    .review-form-section { padding: 100px 0; background: ${sectionBg}; }
    .review-form { max-width: 600px; margin: 0 auto; padding: 48px; background: ${cardBg}; border-radius: 16px; border: 1px solid ${borderColor}; box-shadow: 0 8px 30px rgba(0,0,0,0.06); }
    .review-form h3 { font-family: ${fontHeading}; font-size: clamp(1.4rem, 2.5vw, 1.8rem); font-weight: 700; color: ${textColor}; margin-bottom: 8px; text-align: center; }
    .review-form__subtitle { text-align: center; color: ${textMuted}; font-size: 0.9rem; margin-bottom: 24px; }
    .review-form__stars { display: flex; gap: 8px; justify-content: center; margin-bottom: 20px; }
    .review-form__star { font-size: 2.2rem; cursor: pointer; color: ${starInactive}; transition: color 0.2s, transform 0.2s; user-select: none; }
    .review-form__star:hover, .review-form__star.active { color: ${accentColor}; transform: scale(1.15); }
    .review-form textarea { width: 100%; min-height: 120px; padding: 16px; background: ${inputBg}; border: 1px solid ${borderColor}; border-radius: 8px; color: ${textColor}; font-family: ${fontBody}; font-size: 0.95rem; resize: vertical; transition: border-color 0.3s; }
    .review-form textarea:focus { outline: none; border-color: ${accentColor}; }
    .review-form textarea::placeholder { color: ${textMuted}; }
    .review-form__submit { display: block; width: 100%; margin-top: 20px; padding: 16px; background: ${submitBg}; color: ${submitText}; font-family: ${fontBody}; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; border: none; border-radius: 50px; cursor: pointer; transition: transform 0.3s, box-shadow 0.3s; }
    .review-form__submit:hover { transform: translateY(-2px); box-shadow: 0 8px 30px ${hoverShadow}; }
    .review-form__submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
    .review-form__msg { text-align: center; margin-top: 14px; font-size: 0.9rem; font-family: ${fontBody}; }
    .review-form__msg--success { color: #16a34a; }
    .review-form__msg--error { color: #dc2626; }`;

    // Find and replace old review CSS
    const oldCssStart = html.indexOf('/* Review Form */');
    if (oldCssStart === -1) {
      return NextResponse.json({ error: 'Review form CSS not found' }, { status: 400 });
    }
    
    const oldCssEnd = html.indexOf('.review-form__msg--error', oldCssStart);
    if (oldCssEnd === -1) {
      return NextResponse.json({ error: 'Review form CSS end not found' }, { status: 400 });
    }
    
    let endPos = html.indexOf('}', oldCssEnd);
    if (endPos > -1) {
      html = html.slice(0, oldCssStart) + newCss + html.slice(endPos + 1);
    }

    await prisma.shop.update({
      where: { id: shopId },
      data: { customization: { ...customization, customHtml: html } }
    });

    const slug = shop.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || '';
    await cacheService.invalidate(`shop_public_page_data:${slug}`).catch(() => {});
    await cacheService.invalidate(`api_public_data:${shopId}`).catch(() => {});

    return NextResponse.json({
      success: true,
      theme: isLight ? 'light' : 'dark',
      colors: { sectionBg, cardBg, accentColor, textColor },
      html_length: html.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
