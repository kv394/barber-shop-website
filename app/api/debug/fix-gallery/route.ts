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

    // 1. Replace gallery-grid CSS with 3-box fade layout
    if (!html.includes('gallery-fade-box')) {
      const fadeCss = `
    /* Gallery 3-Box Fade */
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      position: relative;
      z-index: 1;
    }
    .gallery-fade-box {
      position: relative;
      border-radius: 16px;
      overflow: hidden;
      aspect-ratio: 3/4;
      background: var(--bg-deeper-blush, #F5ECEA);
    }
    .gallery-fade-box img {
      position: absolute;
      top: 0; left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 1.2s ease-in-out;
    }
    .gallery-fade-box img.active { opacity: 1; }
    .gallery-fade-box .gallery-overlay {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      padding: 20px;
      background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
      opacity: 0;
      transition: opacity 0.4s;
      z-index: 2;
    }
    .gallery-fade-box:hover .gallery-overlay { opacity: 1; }
    .gallery-fade-box .gallery-overlay span {
      color: #fff;
      font-family: var(--font-heading, serif);
      font-size: 1rem;
      font-weight: 600;
    }
    @media (max-width: 600px) { .gallery-grid { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto; } }`;

      // Remove old gallery-grid CSS
      const oldGridCss = `.gallery-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      position: relative;
      z-index: 1;
    }`;
      if (html.includes(oldGridCss)) {
        html = html.replace(oldGridCss, '');
        changes.push('Removed old gallery-grid CSS');
      }

      const lastStyleClose = html.lastIndexOf('</style>');
      if (lastStyleClose > -1) {
        html = html.slice(0, lastStyleClose) + fadeCss + '\n' + html.slice(lastStyleClose);
        changes.push('Added 3-box fade gallery CSS');
      }
    }

    // 2. Replace the gallery HTML with 3 fade boxes
    const galleryGridStart = html.indexOf('<div class="gallery-grid">');
    if (galleryGridStart > -1) {
      const galleryGridEnd = html.indexOf('</div>', html.indexOf('</div>', html.indexOf('</div>', html.indexOf('</div>', galleryGridStart) + 1) + 1) + 1);
      // Find the actual end - count nested divs
      let depth = 0;
      let gEnd = galleryGridStart;
      for (let i = galleryGridStart; i < html.length; i++) {
        if (html.substring(i, i + 4) === '<div') depth++;
        if (html.substring(i, i + 6) === '</div>') {
          depth--;
          if (depth === 0) {
            gEnd = i + 6;
            break;
          }
        }
      }

      // Extract existing images
      const galleryChunk = html.substring(galleryGridStart, gEnd);
      const imgMatches = galleryChunk.match(/src="([^"]+)"/g) || [];
      const altMatches = galleryChunk.match(/alt="([^"]+)"/g) || [];
      
      const images = imgMatches.map((m, i) => ({
        src: m.replace('src="', '').replace('"', ''),
        alt: altMatches[i] ? altMatches[i].replace('alt="', '').replace('"', '') : `Gallery ${i+1}`
      }));

      // Build 3 fade boxes, distributing images across them
      const boxCount = 3;
      let newGalleryHtml = '<div class="gallery-grid" id="gallery-grid">\n';
      for (let b = 0; b < boxCount; b++) {
        newGalleryHtml += '        <div class="gallery-fade-box" data-box="' + b + '">\n';
        // Put all images in each box, stacked
        images.forEach((img, i) => {
          const isActive = (i % boxCount === b && i < boxCount) ? ' active' : '';
          newGalleryHtml += '          <img src="' + img.src + '" alt="' + img.alt + '" class="gallery-fade-img' + isActive + '" />\n';
        });
        newGalleryHtml += '          <div class="gallery-overlay"><span></span></div>\n';
        newGalleryHtml += '        </div>\n';
      }
      newGalleryHtml += '      </div>';

      html = html.slice(0, galleryGridStart) + newGalleryHtml + html.slice(gEnd);
      changes.push('Replaced gallery with 3 fade boxes');
    }

    // 3. Add fade rotation JS
    if (!html.includes('galleryFadeRotate')) {
      const fadeJs = `

          // ---- Gallery Fade Rotation ----
          (function() {
            var boxes = document.querySelectorAll('.gallery-fade-box');
            if (!boxes.length) return;
            
            boxes.forEach(function(box, boxIndex) {
              var imgs = box.querySelectorAll('.gallery-fade-img');
              if (imgs.length <= 1) return;
              
              var currentIdx = 0;
              // Find active image
              imgs.forEach(function(img, i) { if (img.classList.contains('active')) currentIdx = i; });
              
              // Stagger timing per box for variety
              var interval = 3000 + (boxIndex * 1000);
              var delay = boxIndex * 800;
              
              setTimeout(function() {
                setInterval(function() {
                  imgs[currentIdx].classList.remove('active');
                  currentIdx = Math.floor(Math.random() * imgs.length);
                  // Avoid showing same image, try once more
                  var prev = currentIdx;
                  while (currentIdx === prev && imgs.length > 1) {
                    currentIdx = Math.floor(Math.random() * imgs.length);
                  }
                  imgs[currentIdx].classList.add('active');
                  // Update overlay caption
                  var overlay = box.querySelector('.gallery-overlay span');
                  if (overlay) overlay.textContent = imgs[currentIdx].getAttribute('alt') || '';
                }, interval);
              }, delay);
            });
          })();`;

      const lastScript = html.lastIndexOf('</script>');
      if (lastScript > -1) {
        html = html.slice(0, lastScript) + fadeJs + '\n' + html.slice(lastScript);
        changes.push('Added gallery fade rotation JS');
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
