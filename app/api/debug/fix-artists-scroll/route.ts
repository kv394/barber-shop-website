import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shopId } = body;
    if (!shopId) return NextResponse.json({ error: 'shopId required' }, { status: 400 });

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { customization: true, name: true }
    });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const customization = (shop.customization || {}) as any;
    let html = customization.customHtml || '';
    const changes: string[] = [];

    // 1. Add fade edges CSS + auto-scroll wrapper
    if (!html.includes('artists-scroll-wrapper')) {
      const fadeCss = `
    /* Artists Scroll Fade + Auto-scroll */
    .artists-scroll-wrapper {
      position: relative;
      overflow: hidden;
    }
    .artists-scroll-wrapper::before,
    .artists-scroll-wrapper::after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 16px;
      width: 80px;
      z-index: 2;
      pointer-events: none;
    }
    .artists-scroll-wrapper::before {
      left: 0;
      background: linear-gradient(to right, var(--bg-cream, #FAF5F3) 0%, transparent 100%);
    }
    .artists-scroll-wrapper::after {
      right: 0;
      background: linear-gradient(to left, var(--bg-cream, #FAF5F3) 0%, transparent 100%);
    }
    .artists-grid { scroll-behavior: smooth; }`;

      const lastStyleClose = html.lastIndexOf('</style>');
      if (lastStyleClose > -1) {
        html = html.slice(0, lastStyleClose) + fadeCss + '\n' + html.slice(lastStyleClose);
        changes.push('Added fade edge CSS for artists scroll');
      }
    }

    // 2. Wrap the artists-grid in a scroll wrapper in the HTML
    if (!html.includes('artists-scroll-wrapper') || !html.includes('<div class="artists-scroll-wrapper">')) {
      // Find the team-list div and wrap it
      const teamListHtml = '<div id="team-list" class="artists-grid"';
      const teamListIdx = html.indexOf(teamListHtml);
      if (teamListIdx > -1) {
        // Find the loading div before it to wrap both
        const loadingDiv = '<div id="team-loading"';
        const loadingIdx = html.lastIndexOf(loadingDiv, teamListIdx);
        
        // Insert wrapper before team-loading or team-list
        const wrapStart = loadingIdx > -1 ? loadingIdx : teamListIdx;
        
        // Find closing of team-list div
        const teamListClose = html.indexOf('</div>', teamListIdx);
        if (teamListClose > -1) {
          const wrapEnd = teamListClose + '</div>'.length;
          const wrappedContent = html.substring(wrapStart, wrapEnd);
          html = html.slice(0, wrapStart) + 
            '<div class="artists-scroll-wrapper">\n      ' + wrappedContent + '\n      </div>' + 
            html.slice(wrapEnd);
          changes.push('Wrapped artists grid in scroll wrapper');
        }
      }
    }

    // 3. Add auto-scroll JS
    if (!html.includes('artistsAutoScroll')) {
      const autoScrollJs = `

          // ---- Artists Auto-Scroll ----
          (function() {
            var grid = document.getElementById('team-list');
            if (!grid) return;
            var scrollSpeed = 1;
            var scrollDirection = 1;
            var isPaused = false;
            
            function autoScroll() {
              if (!isPaused && grid.scrollWidth > grid.clientWidth) {
                grid.scrollLeft += scrollSpeed * scrollDirection;
                if (grid.scrollLeft >= grid.scrollWidth - grid.clientWidth - 2) {
                  scrollDirection = -1;
                }
                if (grid.scrollLeft <= 0) {
                  scrollDirection = 1;
                }
              }
              requestAnimationFrame(autoScroll);
            }
            
            grid.addEventListener('mouseenter', function() { isPaused = true; });
            grid.addEventListener('mouseleave', function() { isPaused = false; });
            grid.addEventListener('touchstart', function() { isPaused = true; }, { passive: true });
            grid.addEventListener('touchend', function() { 
              setTimeout(function() { isPaused = false; }, 3000);
            });
            
            // Start after a short delay
            setTimeout(function() { requestAnimationFrame(autoScroll); }, 2000);
          })();`;

      const lastScript = html.lastIndexOf('</script>');
      if (lastScript > -1) {
        html = html.slice(0, lastScript) + autoScrollJs + '\n' + html.slice(lastScript);
        changes.push('Added auto-scroll JS for artists');
      }
    }

    if (changes.length === 0) {
      return NextResponse.json({ message: 'No changes needed' });
    }

    await prisma.shop.update({
      where: { id: shopId },
      data: { customization: { ...customization, customHtml: html } }
    });

    const slug = shop.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || '';
    await cacheService.invalidate(`shop_public_page_data:${slug}`).catch(() => {});
    await cacheService.invalidate(`api_public_data:${shopId}`).catch(() => {});

    return NextResponse.json({ success: true, changes, html_length: html.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
