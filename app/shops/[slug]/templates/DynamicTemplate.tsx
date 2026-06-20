import React, { useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { sanitizeTemplate } from '@/lib/sanitize';
import ReviewsSection from '../components/ReviewsSection';
import CustomPageContent from '../components/CustomPageContent';

const BookingModal = dynamic(() => import('@/components/appointments/BookingModal'), { ssr: false });
const BookingWizard = dynamic(() => import('@/components/booking/BookingWizard'), { ssr: false });

function sanitizeCss(css: string): string {
  if (!css) return '';
  return css
    .replace(/expression\s*\(/gi, '')
    .replace(/url\s*\(\s*['"]?\s*javascript:/gi, 'url(')
    .replace(/-moz-binding/gi, 'blocked-binding')
    .replace(/behavior\s*:/gi, 'blocked-behavior:')
    .replace(/@import\b/gi, 'blocked-import')
    .replace(/url\s*\(\s*['"]?\s*data:(text\/html|image\/svg\+xml)/gi, 'url(data:blocked');
}

/**
 * Extract <script> blocks and inline <style>/<link> tags from the raw HTML
 * before DOMPurify strips them, so we can re-inject them safely.
 *
 * Templates are admin-controlled (from DB / Google Drive), NOT user-submitted,
 * so re-executing their scripts is an acceptable trust level.
 */
function extractTemplateAssets(html: string) {
 // Extract all <script> blocks (inline content only — no src attrs)
 const scripts: string[] = [];
 const scriptSrcUrls: string[] = [];
 const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
 let match;
 while ((match = scriptRegex.exec(html)) !== null) {
  const tag = match[0];
  const content = match[1]?.trim();
  // Check for src attribute
  const srcMatch = tag.match(/src=["']([^"']+)["']/);
  if (srcMatch) {
   scriptSrcUrls.push(srcMatch[1]);
  } else if (content) {
   scripts.push(content);
  }
 }

 // Extract inline <style> blocks from the HTML (often embedded in <head>)
 const styles: string[] = [];
 const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
 while ((match = styleRegex.exec(html)) !== null) {
  if (match[1]?.trim()) {
   styles.push(match[1].trim());
  }
 }

 // Extract <link rel="stylesheet"> hrefs (e.g. Google Fonts)
 const linkHrefs: string[] = [];
 const linkRegex = /<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi;
 while ((match = linkRegex.exec(html)) !== null) {
  const hrefMatch = match[0].match(/href=["']([^"']+)["']/);
  if (hrefMatch) {
   linkHrefs.push(hrefMatch[1]);
  }
 }

 // Strip <html>, <head>, <body>, <meta>, <title>, <link>, <script>, <style> wrappers
 // so DOMPurify only processes the actual body content
 let bodyHtml = html;
 // Try to extract just the <body> content
 const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
 if (bodyMatch) {
  bodyHtml = bodyMatch[1];
 } else {
  // Fallback: strip document-level tags
  bodyHtml = bodyHtml
   .replace(/<(!doctype|html|head|\/head|body|\/body|\/html)[^>]*>/gi, '')
   .replace(/<meta\b[^>]*\/?>/gi, '')
   .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
   .replace(/<link\b[^>]*\/?>/gi, '')
   .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
   .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
 }

 return { bodyHtml, scripts, scriptSrcUrls, styles, linkHrefs };
}

export default function DynamicTemplate({ ctx }: { ctx: any }) {
 const { 
 shop, templateType, primaryColor, secondaryColor, sportRed, reviews, dynamicTemplateHtml, dynamicTemplateCss,
 selectedService, setSelectedService, handleBookClick, handleDynamicTemplateClick,
 c, headingFont, bodyFont, buttonShape, buttonVariant, colorTheme, headerStyle,
 heroLayout, heroOverlayOpacity, heroOverlayColor, enableScrollAnimations,
 faviconUrl, customCss, sectionOrder, isDark, themeBg, themeText, themeMuted, themeBorder,
 pages, fontFamily, ctaText, announcement, heroVideoUrl, shopPhone, shopEmail,
 shopWebsite, shopAddress, shopFB, shopIG, shopTW, logoUrl, heroImageUrl, authButton 
 } = ctx;

 const containerRef = useRef<HTMLDivElement>(null);

 // Parse the template HTML once, extracting scripts/styles before DOMPurify
 const { bodyHtml, scripts, scriptSrcUrls, styles, linkHrefs } = useMemo(() => {
  if (!dynamicTemplateHtml) return { bodyHtml: '', scripts: [], scriptSrcUrls: [], styles: [], linkHrefs: [] };
  return extractTemplateAssets(dynamicTemplateHtml);
 }, [dynamicTemplateHtml]);

 // Sanitize only the body HTML (scripts/styles already extracted)
 // Templates are admin-controlled (not user-submitted), so we allow event
 // handler attributes (onclick etc.) needed for SDK booking integration.
 const sanitizedHtml = useMemo(() => {
  if (!bodyHtml) return '';
  return sanitizeTemplate(bodyHtml);
 }, [bodyHtml]);

 // Combine all CSS: separate dynamicTemplateCss + extracted inline styles
 const combinedCss = useMemo(() => {
  const parts: string[] = [];
  if (dynamicTemplateCss) parts.push(sanitizeCss(dynamicTemplateCss));
  styles.forEach(s => parts.push(sanitizeCss(s)));
  return parts.join('\n');
 }, [dynamicTemplateCss, styles]);

 // After mount, inject external stylesheets and execute template scripts
 useEffect(() => {
  // Set theme colors BEFORE any template scripts execute so they use
  // server-side DB values instead of potentially cached API values
  (window as any).__KUTZ_THEME__ = { primaryColor, secondaryColor, logoUrl, shopName: shop?.name };

  // Inject <link rel="stylesheet"> for Google Fonts etc.
  const injectedLinks: HTMLLinkElement[] = [];
  linkHrefs.forEach(href => {
   // Don't duplicate if already in <head>
   if (document.querySelector(`link[href="${href}"]`)) return;
   const link = document.createElement('link');
   link.rel = 'stylesheet';
   link.href = href;
   document.head.appendChild(link);
   injectedLinks.push(link);
  });

   // Inject external <script src="..."> tags and wait for them to load
   // BEFORE executing inline scripts (which may depend on the SDK)
   const injectedScripts: HTMLScriptElement[] = [];

   const loadExternalScripts = () => {
    return Promise.all(
     scriptSrcUrls.map(src => {
      return new Promise<void>((resolve) => {
       if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
       }
       const script = document.createElement('script');
       script.src = src;
       script.async = false; // Preserve execution order
       script.onload = () => resolve();
       script.onerror = () => {
        console.warn(`[DynamicTemplate] Failed to load script: ${src}`);
        resolve(); // Don't block other scripts
       };
       document.body.appendChild(script);
       injectedScripts.push(script);
      });
     })
    );
   };

    // Execute inline scripts only AFTER external scripts are loaded
    const executeInlineScripts = () => {
     scripts.forEach((code, i) => {
      try {
       const wrappedCode = `
        (function() {
         var _origWinAddEL = window.addEventListener;
         var _origDocAddEL = document.addEventListener;
         var _origCreateElement = document.createElement.bind(document);
         var _dynamicScriptPromises = [];
         var _queuedLoadCallbacks = [];

         // Track dynamically created script elements with load promises
         document.createElement = function(tag) {
          var el = _origCreateElement(tag);
          if (tag.toLowerCase() === 'script') {
           // Wrap with a promise that resolves when the script loads
           var p = new Promise(function(resolve) {
            var _origSrcSetter = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
            // Once src is set and element is appended, it will load
            el._resolveLoad = resolve;
            el.addEventListener('load', function() { resolve(); });
            el.addEventListener('error', function() { resolve(); });
            // Safety timeout
            setTimeout(resolve, 8000);
           });
           _dynamicScriptPromises.push(p);
          }
          return el;
         };

         // Queue load/DOMContentLoaded callbacks
         window.addEventListener = function(type, fn, opts) {
          if ((type === 'load' || type === 'DOMContentLoaded') && document.readyState === 'complete') {
           _queuedLoadCallbacks.push(fn);
          } else {
           _origWinAddEL.call(window, type, fn, opts);
          }
         };
         document.addEventListener = function(type, fn, opts) {
          if ((type === 'load' || type === 'DOMContentLoaded') && document.readyState === 'complete') {
           _queuedLoadCallbacks.push(fn);
          } else {
           _origDocAddEL.call(document, type, fn, opts);
          }
         };

         try {
          ${code}
         } finally {
          document.createElement = _origCreateElement;
          window.addEventListener = _origWinAddEL;
          document.addEventListener = _origDocAddEL;
         }

         // Wait for all dynamically created scripts to load, then fire queued callbacks
         if (_queuedLoadCallbacks.length > 0) {
          if (_dynamicScriptPromises.length === 0) {
           _queuedLoadCallbacks.forEach(function(fn) { setTimeout(fn, 0); });
          } else {
           Promise.all(_dynamicScriptPromises).then(function() {
            _queuedLoadCallbacks.forEach(function(fn) { setTimeout(fn, 50); });
           });
          }
         }
        })();
       `;
       // eslint-disable-next-line no-new-func
       new Function(wrappedCode)();
      } catch (err) {
       console.warn(`[DynamicTemplate] Script block ${i} error:`, err);
      }
     });
    };

    // Chain: load external scripts → then execute inline scripts
    let cancelled = false;
    loadExternalScripts().then(() => {
     if (!cancelled) {
      // Small delay to ensure external scripts have initialized globals
      setTimeout(executeInlineScripts, 50);
     }
    });

   return () => {
    cancelled = true;
    injectedLinks.forEach(el => el.remove());
    injectedScripts.forEach(el => el.remove());
   };
 }, [scripts, scriptSrcUrls, linkHrefs]);

  // Post-process sanitized HTML to add lazy loading to images
  const optimizedHtml = useMemo(() => {
   if (!sanitizedHtml) return '';
   // Add loading="lazy" and decoding="async" to all <img> tags that don't already have them
   return sanitizedHtml.replace(/<img\b(?![^>]*loading=)/gi, '<img loading="lazy" decoding="async" ');
  }, [sanitizedHtml]);

  return (
  <main ref={containerRef} className="min-h-screen overflow-x-hidden flex flex-col relative" onClick={handleDynamicTemplateClick}>

   {authButton}
   {combinedCss && <style dangerouslySetInnerHTML={{ __html: combinedCss }} />}
   <div dangerouslySetInnerHTML={{ __html: optimizedHtml }} />
   
   {selectedService && (
   <BookingModal shopId={shop.id} service={selectedService} onClose={() => setSelectedService(null)} shopHours={c.businessHours || {}} themeColor={primaryColor} templateType={templateType} />
   )}
  </main>

  );
}
