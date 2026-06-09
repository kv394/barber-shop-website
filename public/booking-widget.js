(function() {
  const containerId = 'kutzapp-booking-widget-container';
  const existingContainer = document.getElementById(containerId);
  if (existingContainer) {
    existingContainer.remove();
  }

  // Find the script tag that has the data-shop-id.
  // It might be document.currentScript, or we might need to search for it.
  let scriptTag = document.currentScript;

  if (!scriptTag || !scriptTag.getAttribute('data-shop-id')) {
    const scripts = document.querySelectorAll('script[src*="booking-widget.js"], script[data-shop-id]');
    for (let i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].getAttribute('data-shop-id')) {
        scriptTag = scripts[i];
        break;
      }
    }
  }

  const shopId = (scriptTag && scriptTag.getAttribute('data-shop-id')) || (window.KutzApp && window.KutzApp.shopId);

  if (!shopId) {
    console.error('Booking widget requires data-shop-id attribute or window.KutzApp.shopId');
    return;
  }

  const scriptApiUrl = scriptTag ? scriptTag.getAttribute('data-api-url') : null;
  const sdkApiUrl = (window.KutzApp && window.KutzApp.apiUrl) ? window.KutzApp.apiUrl + '/api/chat/booking' : null;
  
  const scriptSrc = scriptTag ? scriptTag.src : '';
  let fallbackOrigin = window.location.origin;
  try {
    if (scriptSrc && scriptSrc.startsWith('http')) {
      fallbackOrigin = new URL(scriptSrc).origin;
    }
  } catch (e) {}
  
  const defaultApiUrl = fallbackOrigin + '/api/chat/booking';
  const apiUrl = scriptApiUrl || sdkApiUrl || defaultApiUrl;
  
  let themeColor = (window.KutzApp && window.KutzApp.primaryColor) || (scriptTag && scriptTag.getAttribute('data-theme-color')) || '#d4af37';
  let secondaryColor = (window.KutzApp && window.KutzApp.secondaryColor) || (scriptTag && scriptTag.getAttribute('data-secondary-color')) || themeColor;
  const shopName = (scriptTag && scriptTag.getAttribute('data-shop-name')) || (window.KutzApp && window.KutzApp.shopName) || '';
  const position = (window.KutzApp && window.KutzApp.chatbotPosition) || (scriptTag && scriptTag.getAttribute('data-position')) || 'bottom-right';  const isLeft = position === 'bottom-left';
  const sideCSS = isLeft ? 'left: 24px;' : 'right: 24px;';
  const transformOrigin = isLeft ? 'bottom left' : 'bottom right';

  // ── Auto-detect page theme colors from CSS custom properties ──
  // Dynamic templates define their own color systems via :root CSS vars.
  // These are more accurate than the DB primaryColor for visual matching.
  try {
    const rootStyles = getComputedStyle(document.documentElement);
    // Common primary color variable names used across templates
    const primaryCandidates = [
      '--gold-primary', '--rose-primary', '--primary-color', '--color-primary',
      '--accent-color', '--brand-primary', '--theme-color', '--main-color',
      '--gold-accent', '--rose-deep', '--primary', '--accent'
    ];
    const secondaryCandidates = [
      '--gold-secondary', '--rose-hover', '--secondary-color', '--color-secondary',
      '--brand-secondary', '--gold-dark', '--rose-light', '--secondary', '--accent-light'
    ];
    let detectedPrimary = '';
    let detectedSecondary = '';
    for (const varName of primaryCandidates) {
      const val = rootStyles.getPropertyValue(varName).trim();
      if (val && val.startsWith('#') && val.length >= 4) {
        detectedPrimary = val;
        break;
      }
    }
    for (const varName of secondaryCandidates) {
      const val = rootStyles.getPropertyValue(varName).trim();
      if (val && val.startsWith('#') && val.length >= 4) {
        detectedSecondary = val;
        break;
      }
    }
    if (detectedPrimary) {
      themeColor = detectedPrimary;
      secondaryColor = detectedSecondary || detectedPrimary;
    }
  } catch (e) {}

  // ── Theme detection ──
  const colorTheme = (scriptTag && scriptTag.getAttribute('data-color-theme')) || (window.KutzApp && window.KutzApp.colorTheme) || '';
  const templateType = (scriptTag && scriptTag.getAttribute('data-template-type')) || (window.KutzApp && window.KutzApp.templateType) || '';
  
  // Determine if the page is dark-themed
  const darkTemplates = ['noir'];
  let isDark = colorTheme === 'dark' || darkTemplates.includes(templateType);
  
  // Fallback: inspect computed body background color if no explicit theme was provided
  if (!colorTheme && !darkTemplates.includes(templateType)) {
    try {
      const bodyBg = getComputedStyle(document.body).backgroundColor;
      const match = bodyBg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        const luminance = (parseInt(match[1]) * 299 + parseInt(match[2]) * 587 + parseInt(match[3]) * 114) / 1000;
        if (luminance < 80) isDark = true;
      }
    } catch (e) {}
  }

  // ── Shop metadata from data attributes ──
  const shopType = (scriptTag && scriptTag.getAttribute('data-shop-type')) || '';
  const shopSlogan = (scriptTag && scriptTag.getAttribute('data-slogan')) || '';

  // ── Page Context Collector ──
  // Tracks user behavior on the page to make the AI assistant context-aware
  const pageLoadTime = Date.now();
  const viewedSections = new Set();

  // Observe which sections the user has scrolled through
  try {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Try to identify the section by ID, heading, or data attribute
          const el = entry.target;
          const sectionId = el.id || el.getAttribute('data-section');
          if (sectionId) {
            viewedSections.add(sectionId.toLowerCase().replace(/[-_]/g, ' '));
          } else {
            // Try to infer from heading content
            const heading = el.querySelector('h1, h2, h3');
            if (heading && heading.textContent) {
              const text = heading.textContent.trim().toLowerCase();
              if (text.length < 40) viewedSections.add(text);
            }
          }
        }
      });
    }, { threshold: 0.3 });

    // Observe common section patterns after DOM is ready
    const startObserving = () => {
      // By ID
      ['services', 'team', 'staff', 'gallery', 'reviews', 'contact', 'about',
       'products', 'pricing', 'memberships', 'loyalty', 'hours', 'location',
       'services-container', 'staff-container', 'reviews-container', 'gallery-container',
       'services-section', 'team-section', 'gallery-section', 'reviews-section'].forEach(id => {
        const el = document.getElementById(id);
        if (el) sectionObserver.observe(el);
      });
      // By semantic element
      document.querySelectorAll('section, [data-section]').forEach(el => {
        sectionObserver.observe(el);
      });
    };
    if (document.readyState === 'complete') startObserving();
    else window.addEventListener('load', startObserving, { once: true });
  } catch (e) {}

  // Global context hook — external "Book" buttons can push context before opening chat
  window.__kutzappBookingContext = window.__kutzappBookingContext || {
    clickedService: null,
    clickedServiceId: null,
    clickedStaff: null,
    clickedStaffId: null
  };

  // Collect all page context signals into a serializable object
  function collectPageContext() {
    const ctx = {
      templateType: templateType || null,
      shopType: shopType || null,
      isMobile: window.innerWidth < 768,
      scrollDepth: Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100) || 0,
      timeOnPage: Date.now() - pageLoadTime,
      referrer: document.referrer || null,
      currentUrl: window.location.href,
      viewedSections: Array.from(viewedSections),
      clickedService: window.__kutzappBookingContext.clickedService || null,
      clickedServiceId: window.__kutzappBookingContext.clickedServiceId || null,
      clickedStaff: window.__kutzappBookingContext.clickedStaff || null,
      clickedStaffId: window.__kutzappBookingContext.clickedStaffId || null
    };
    return ctx;
  }

  // ── Helper: hex to RGB ──
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 128, g: 128, b: 128 };
  }

  const tc = hexToRgb(themeColor);
  const sc = hexToRgb(secondaryColor);

  // Create a container for the shadow DOM
  const container = document.createElement('div');
  container.id = containerId;
  container.style.position = 'relative';
  container.style.zIndex = '9999999';

  // Attach shadow DOM
  const shadow = container.attachShadow({ mode: 'closed' });

  const appendToBody = () => {
    if (document.body) {
      document.body.appendChild(container);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(container);
      });
    }
  };

  appendToBody();

  // Styles
  const style = document.createElement('style');
  style.textContent = `
    :host {
      --primary-color: ${themeColor};
      --secondary-color: ${secondaryColor};
      --bg-color: ${isDark ? '#1a1a1f' : '#ffffff'};
      --surface-color: ${isDark ? '#222228' : '#f8f8fa'};
      --text-color: ${isDark ? '#e8e8ec' : '#1f2937'};
      --text-muted: ${isDark ? '#9898a0' : '#6b7280'};
      --border-color: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'};
      --msg-user-bg: ${secondaryColor};
      --msg-user-text: #ffffff;
      --msg-bot-bg: ${isDark ? `rgba(${tc.r},${tc.g},${tc.b},0.08)` : `rgba(${tc.r},${tc.g},${tc.b},0.06)`};
      --msg-bot-text: ${isDark ? '#e8e8ec' : '#1f2937'};
      --msg-bot-border: ${isDark ? `rgba(${tc.r},${tc.g},${tc.b},0.15)` : `rgba(${tc.r},${tc.g},${tc.b},0.12)`};
      --input-bg: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)'};
      --shadow-color: ${isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.12)'};
      --color-scheme: ${isDark ? 'dark' : 'light'};
      font-family: system-ui, -apple-system, sans-serif;
    }
    
    #widget-button {
      position: fixed;
      bottom: 24px;
      ${sideCSS}
      width: 56px;
      height: 56px;
      border-radius: 28px;
      background: linear-gradient(135deg, ${themeColor}, ${secondaryColor});
      color: #ffffff;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 16px ${isDark ? `rgba(${tc.r},${tc.g},${tc.b},0.35)` : `rgba(${tc.r},${tc.g},${tc.b},0.3)`}, 0 2px 4px rgba(0,0,0,0.1);
      z-index: 999999;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
      animation: fabBounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, fabPulse 2s ease-in-out 1s 3;
    }
    
    #widget-button:hover {
      transform: scale(1.08) translateY(-2px);
      box-shadow: 0 6px 24px ${isDark ? `rgba(${tc.r},${tc.g},${tc.b},0.45)` : `rgba(${tc.r},${tc.g},${tc.b},0.4)`}, 0 4px 8px rgba(0,0,0,0.15);
    }

    #widget-button:active {
      transform: scale(0.95);
    }
    
    #widget-button svg {
      width: 28px;
      height: 28px;
      transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
    }

    #widget-button.open svg {
      transform: rotate(180deg) scale(1.1);
    }
    
    #chat-window {
      position: fixed;
      bottom: 96px;
      ${sideCSS}
      width: 380px;
      height: 520px;
      max-height: calc(100vh - 120px);
      background-color: var(--bg-color);
      ${isDark ? 'backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);' : ''}
      border: 1px solid var(--border-color);
      border-radius: 20px;
      box-shadow: 0 12px 40px var(--shadow-color), 0 0 0 1px var(--border-color);
      display: flex;
      flex-direction: column;
      z-index: 999999;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      transform: translateY(20px) scale(0.95);
      transform-origin: ${transformOrigin};
      transition: opacity 0.3s ease, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1);
    }
    
    #chat-window.open {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) scale(1);
    }
    
    @media (max-width: 480px) {
      #chat-window {
        width: 100%;
        max-width: none;
        left: 0 !important;
        right: 0 !important;
        top: auto !important;
        bottom: 0 !important;
        height: 75vh;
        max-height: 85%;
        border-radius: 20px 20px 0 0;
        border: none;
        border-top: 1px solid var(--border-color);
        box-shadow: 0 -8px 32px var(--shadow-color);
        transform-origin: bottom center;
        z-index: 9999999;
        display: flex;
        flex-direction: column;
        position: fixed;
      }
      
      #chat-window.open {
        transform: translateY(0) scale(1);
      }

      #chat-header {
        flex-shrink: 0;
        padding-top: 16px;
        border-radius: 20px 20px 0 0;
      }
      
      #chat-messages {
        flex: 1;
        height: auto;
        padding-bottom: max(20px, env(safe-area-inset-bottom));
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }

      #chat-input-area {
        position: relative;
        flex-shrink: 0;
        bottom: auto;
        left: auto;
        width: 100%;
        box-sizing: border-box;
        padding-bottom: max(12px, env(safe-area-inset-bottom));
      }
      
      #widget-button {
        bottom: max(16px, env(safe-area-inset-bottom));
        right: max(16px, env(safe-area-inset-right));
      }
    }
    
    #chat-header {
      background: ${isDark
        ? `linear-gradient(135deg, rgba(${tc.r},${tc.g},${tc.b},0.15), rgba(${sc.r},${sc.g},${sc.b},0.1))`
        : `linear-gradient(135deg, rgba(${tc.r},${tc.g},${tc.b},0.08), rgba(${sc.r},${sc.g},${sc.b},0.04))`};
      color: var(--text-color);
      border-bottom: 1px solid var(--border-color);
      padding: 16px 18px;
      font-weight: 600;
      font-size: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      letter-spacing: 0.01em;
    }
    
    #close-button {
      cursor: pointer;
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 22px;
      line-height: 1;
      padding: 4px;
      border-radius: 8px;
      transition: background-color 0.2s, color 0.2s;
    }
    
    #close-button:hover {
      background-color: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};
      color: var(--text-color);
    }

    #new-chat-button {
      cursor: pointer;
      background: none;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 10px;
      transition: background-color 0.2s, color 0.2s, border-color 0.2s;
      margin-right: 4px;
    }

    #new-chat-button:hover {
      background-color: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};
      color: var(--text-color);
      border-color: var(--text-muted);
    }
    
    #chat-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background-color: var(--bg-color);
    }
    
    /* Subtle scrollbar styling */
    #chat-messages::-webkit-scrollbar { width: 5px; }
    #chat-messages::-webkit-scrollbar-track { background: transparent; }
    #chat-messages::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 3px; }
    
    .message {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
      white-space: pre-wrap;
      animation: fadeIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards;
    }
    
    .message.user {
      align-self: flex-end;
      background-color: var(--msg-user-bg);
      color: var(--msg-user-text);
      border: none;
      border-bottom-right-radius: 4px;
      box-shadow: 0 1px 4px ${isDark ? `rgba(${sc.r},${sc.g},${sc.b},0.2)` : `rgba(${sc.r},${sc.g},${sc.b},0.15)`};
    }
    
    .message.bot {
      align-self: flex-start;
      background-color: var(--msg-bot-bg);
      color: var(--msg-bot-text);
      border: 1px solid var(--msg-bot-border);
      border-bottom-left-radius: 4px;
    }
    
    #chat-input-area {
      padding: 12px 14px;
      border-top: 1px solid var(--border-color);
      display: flex;
      gap: 8px;
      align-items: center;
      background-color: var(--bg-color);
      z-index: 10;
    }
    
    #chat-input {
      flex: 1;
      background-color: var(--input-bg);
      border: 1px solid var(--border-color);
      color: var(--text-color);
      padding: 10px 14px;
      border-radius: 20px;
      outline: none;
      font-size: 16px;
      color-scheme: var(--color-scheme);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    
    #chat-input::placeholder {
      color: var(--text-muted);
    }
    
    #chat-input:focus {
      border-color: ${themeColor};
      box-shadow: 0 0 0 2px ${isDark ? `rgba(${tc.r},${tc.g},${tc.b},0.2)` : `rgba(${tc.r},${tc.g},${tc.b},0.15)`};
    }
    
    #date-toggle-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      opacity: 0.7;
      transition: opacity 0.2s, color 0.2s;
    }
    
    #date-toggle-btn:hover {
      opacity: 1;
      color: ${themeColor};
    }

    #send-button {
      background: linear-gradient(135deg, ${themeColor}, ${secondaryColor});
      color: #ffffff;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      box-shadow: 0 2px 8px ${isDark ? `rgba(${tc.r},${tc.g},${tc.b},0.25)` : `rgba(${tc.r},${tc.g},${tc.b},0.2)`};
    }

    #send-button:hover {
      transform: scale(1.05);
    }
    
    #send-button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      transform: none;
    }

    #picker-sheet {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 75%;
      background-color: var(--bg-color);
      border-top: 1px solid var(--border-color);
      border-top-left-radius: 20px;
      border-top-right-radius: 20px;
      box-shadow: 0 -8px 32px var(--shadow-color);
      display: flex;
      flex-direction: column;
      transform: translateY(100%);
      transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1);
      z-index: 100;
      box-sizing: border-box;
      padding: 0 16px 16px 16px;
    }

    #picker-sheet.open {
      transform: translateY(0);
    }

    .picker-sheet-handle {
      width: 40px;
      height: 4px;
      background-color: var(--border-color);
      border-radius: 2px;
      margin: 12px auto 16px;
      flex-shrink: 0;
    }
    
    .typing-indicator {
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
      padding: 12px 16px !important;
      background-color: var(--msg-bot-bg) !important;
      border-radius: 16px !important;
      border-bottom-left-radius: 4px !important;
      align-self: flex-start !important;
      margin-bottom: 12px !important;
      border: 1px solid var(--msg-bot-border) !important;
      min-width: 60px !important;
      min-height: 24px !important;
    }
    
    .typing-indicator span {
      width: 6px;
      height: 6px;
      background-color: ${themeColor};
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;
      opacity: 0.7;
    }
    
    .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
    .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
    
    .slots-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
      margin-bottom: 12px;
      align-self: center;
      width: 100%;
      max-width: 100%;
      animation: slideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards;
    }
    

    @keyframes slideIn {
      0% { opacity: 0; transform: translateY(16px) scale(0.95); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes fadeIn {
      0% { opacity: 0; transform: translateY(10px) scale(0.98); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes fabPulse {
      0% { box-shadow: 0 4px 16px ${isDark ? `rgba(${tc.r},${tc.g},${tc.b},0.35)` : `rgba(${tc.r},${tc.g},${tc.b},0.3)`}, 0 0 0 0 rgba(${tc.r},${tc.g},${tc.b},0.4); }
      70% { box-shadow: 0 4px 16px ${isDark ? `rgba(${tc.r},${tc.g},${tc.b},0.35)` : `rgba(${tc.r},${tc.g},${tc.b},0.3)`}, 0 0 0 12px rgba(${tc.r},${tc.g},${tc.b},0); }
      100% { box-shadow: 0 4px 16px ${isDark ? `rgba(${tc.r},${tc.g},${tc.b},0.35)` : `rgba(${tc.r},${tc.g},${tc.b},0.3)`}, 0 0 0 0 rgba(${tc.r},${tc.g},${tc.b},0); }
    }

    @keyframes fabBounceIn {
      0% { transform: scale(0) rotate(-45deg); opacity: 0; }
      50% { transform: scale(1.15) rotate(5deg); opacity: 1; }
      70% { transform: scale(0.95) rotate(-2deg); }
      100% { transform: scale(1) rotate(0); }
    }

    .slot-btn {
      background-color: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-color);
      padding: 6px 12px;
      border-radius: 14px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .slot-btn:hover {
      background-color: ${isDark ? `rgba(${tc.r},${tc.g},${tc.b},0.15)` : `rgba(${tc.r},${tc.g},${tc.b},0.1)`};
      border-color: ${themeColor};
      color: ${isDark ? '#ffffff' : themeColor};
      transform: translateY(-1px);
    }

    .slot-btn:active {
      transform: scale(0.97);
    }

    .quick-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }

    .quick-action-btn {
      background-color: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-color);
      padding: 5px 10px;
      border-radius: 14px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .quick-action-btn:hover {
      background-color: ${isDark ? `rgba(${tc.r},${tc.g},${tc.b},0.15)` : `rgba(${tc.r},${tc.g},${tc.b},0.1)`};
      border-color: ${themeColor};
      color: ${isDark ? '#ffffff' : themeColor};
      transform: translateY(-1px);
    }

    .quick-action-btn:active {
      transform: scale(0.97);
    }

    #unread-badge {
      position: absolute; top: -2px; right: -2px;
      width: 14px; height: 14px;
      background: #ef4444; border-radius: 50%;
      border: 2px solid var(--bg-color, #fff);
      display: none; pointer-events: none;
      animation: fadeIn 0.3s ease;
    }

    #welcome-bubble {
      position: fixed; bottom: 88px; ${sideCSS}
      background: var(--bg-color, #fff);
      color: var(--text-color, #333);
      border: 1px solid var(--border-color);
      border-radius: 16px 16px ${isLeft ? '16px 4px' : '4px 16px'};
      padding: 12px 16px; max-width: 220px;
      font-size: 13px; line-height: 1.4;
      box-shadow: 0 4px 16px var(--shadow-color);
      opacity: 0; transform: translateY(10px) scale(0.9);
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      pointer-events: none; z-index: 999998;
      cursor: pointer;
    }

    #welcome-bubble.show {
      opacity: 1; transform: translateY(0) scale(1);
      pointer-events: auto;
    }  `;
  shadow.appendChild(style);

  // HTML Structure
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div id="widget-button">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
      </svg>
      <div id="unread-badge"></div>
    </div>
    
    <div id="chat-window">
      <div id="chat-header">
        <div>
          <div style="font-size:15px;font-weight:700">✂️ ${shopName || 'AI Assistant'}</div>
          <div style="font-size:11px;color:var(--text-muted);font-weight:400;margin-top:2px">Powered by KutzApp</div>
        </div>
        <div style="display:flex;align-items:center;gap:4px">
          <button id="new-chat-button" title="Start new conversation">↻ New</button>
          <button id="close-button">&times;</button>
        </div>
      </div>
      <div id="chat-messages">
        <div class="message bot">${shopName ? '👋 Welcome to ' + shopName + '! How can I help you today?' : '👋 Hi there! How can I help you today?'}</div>
        <div class="quick-actions" id="quick-actions">
          <button class="quick-action-btn" data-msg="📅 Book Appointment">📅 Book Appointment</button>
          <button class="quick-action-btn" data-msg="💈 View Services">💈 View Services</button>
          <button class="quick-action-btn" data-msg="📋 My Appointments">📋 My Appointments</button>
          <button class="quick-action-btn" data-msg="❓ Shop Info">❓ Shop Info</button>
        </div>
      </div>
      <form id="chat-input-area">
        <input type="text" id="chat-input" placeholder="Type a message..." autocomplete="off" />
        <button type="submit" id="send-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
      <div id="picker-sheet"></div>
    </div>
    <div id="welcome-bubble">👋 Need help booking? Tap here!</div>
  `;
  shadow.appendChild(wrapper);

  // Logic
  const button = shadow.getElementById('widget-button');
  const windowEl = shadow.getElementById('chat-window');
  const closeBtn = shadow.getElementById('close-button');
  const form = shadow.getElementById('chat-input-area');
  const input = shadow.getElementById('chat-input');
  const messagesEl = shadow.getElementById('chat-messages');
  const sendBtn = shadow.getElementById('send-button');
  const unreadBadge = shadow.getElementById('unread-badge');
  const welcomeBubble = shadow.getElementById('welcome-bubble');
  const newChatBtn = shadow.getElementById('new-chat-button');

  // New Chat button — clears session and resets UI
  if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
      try { sessionStorage.removeItem('kutzapp-chat-' + shopId); } catch(e) {}
      const greetingMsg = shopName ? '\ud83d\udc4b Welcome to ' + shopName + '! How can I help you today?' : '\ud83d\udc4b Hi there! How can I help you today?';
      messages = [{ role: 'assistant', content: greetingMsg }];
      messagesEl.innerHTML = '<div class="message bot">' + greetingMsg + '</div>' +
        '<div class="quick-actions" id="quick-actions">' +
        '<button class="quick-action-btn" data-msg="\ud83d\udcc5 Book Appointment">\ud83d\udcc5 Book Appointment</button>' +
        '<button class="quick-action-btn" data-msg="\ud83d\udc88 View Services">\ud83d\udc88 View Services</button>' +
        '<button class="quick-action-btn" data-msg="\ud83d\udccb My Appointments">\ud83d\udccb My Appointments</button>' +
        '<button class="quick-action-btn" data-msg="\u2753 Shop Info">\u2753 Shop Info</button>' +
        '</div>';
      // Re-attach quick action handlers
      shadow.querySelectorAll('.quick-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const msg = btn.getAttribute('data-msg');
          const qa = shadow.getElementById('quick-actions');
          if (qa) { qa.style.opacity = '0.5'; qa.style.pointerEvents = 'none'; }
          sendChatRequest(msg, msg);
        });
      });
      hidePickerSheet();
    });
  }

  let isOpen = false;
  let hasUnread = false;
  const greetingText = shopName ? '👋 Welcome to ' + shopName + '! How can I help you today?' : '👋 Hi there! How can I help you today?';
  let messages = [
    { role: 'assistant', content: greetingText }
  ];

  // ── Rich text formatting for bot messages ──
  function formatBotText(text) {
    // Sanitize: strip dangerous tags
    let safe = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    safe = safe.replace(/<img[^>]*>/gi, '');
    safe = safe.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
    // Bold: **text**
    safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text* (but not **)
    safe = safe.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    // Newlines
    safe = safe.replace(/\n/g, '<br>');
    return safe;
  }

  // ── Session persistence: restore previous conversation ──
  function restoreSession() {
    try {
      const saved = sessionStorage.getItem('kutzapp-chat-' + shopId);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 1) {
          messages = parsed;
          messagesEl.innerHTML = '';
          // Hide quick actions since session is restored
          const qa = shadow.getElementById('quick-actions');
          if (qa) qa.style.display = 'none';
          messages.forEach(msg => {
            if (msg.role === 'model' || msg.role === 'assistant') {
              const text = msg.parts ? msg.parts.map(p => p.text || '').join('') : (msg.content || '');
              if (text) addMessageToUI(text, false);
            } else if (msg.role === 'user') {
              const text = msg.parts ? msg.parts.map(p => p.text || '').join('') : (msg.content || '');
              if (text) addMessageToUI(text, true);
            }
          });
        }
      }
    } catch(e) {}
  }

  // ── Quick action buttons ──
  const quickActionsEl = shadow.getElementById('quick-actions');
  if (quickActionsEl) {
    quickActionsEl.querySelectorAll('.quick-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const msg = btn.getAttribute('data-msg');
        quickActionsEl.style.opacity = '0.5';
        quickActionsEl.style.pointerEvents = 'none';
        setTimeout(() => { quickActionsEl.style.display = 'none'; }, 300);
        sendChatRequest(msg, msg);
      });
    });
  }

  let pendingAutoBooking = null; // Queued auto-booking from context click

  function toggleChat(forceOpen = false) {
    if (typeof forceOpen === 'boolean') {
      isOpen = forceOpen;
    } else {
      isOpen = !isOpen;
    }

    if (isOpen) {
      windowEl.classList.add('open');
      button.classList.add('open');
      input.focus();
      // Hide unread badge
      hasUnread = false;
      if (unreadBadge) unreadBadge.style.display = 'none';
      // Dismiss welcome bubble
      if (welcomeBubble) welcomeBubble.classList.remove('show');
      sessionStorage.setItem('kutzapp-bubble-dismissed', '1');

      // ── Context-aware auto-booking ──
      // If a service was clicked before opening, auto-send a booking request
      if (pendingAutoBooking && messages.length <= 1) {
        const serviceName = pendingAutoBooking;
        pendingAutoBooking = null;
        // Hide quick actions since we're auto-progressing
        const qa = shadow.getElementById('quick-actions');
        if (qa) { qa.style.display = 'none'; }
        // Small delay so the user sees the chat open first
        setTimeout(() => {
          sendChatRequest('\ud83d\udcc5 Book ' + serviceName, '\ud83d\udcc5 Book ' + serviceName);
        }, 300);
      }
    } else {
      windowEl.classList.remove('open');
      button.classList.remove('open');
    }
  }
  button.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);

  // Expose a global function to open the chat from outside
  // Accepts an optional serviceName to auto-start booking for that service
  window.openKutzAppChat = function(serviceName) {
    if (serviceName) {
      // Store context for the AI backend and queue auto-booking
      window.__kutzappBookingContext.clickedService = serviceName;
      pendingAutoBooking = serviceName;
    }
    toggleChat(true);
  };

  function addMessageToUI(text, isUser) {
    const el = document.createElement('div');
    el.className = `message ${isUser ? 'user' : 'bot'}`;
    if (isUser) {
      el.textContent = text;
    } else {
      el.innerHTML = formatBotText(text);
      // Show unread badge if chat is closed
      if (!isOpen && unreadBadge) {
        hasUnread = true;
        unreadBadge.style.display = 'block';
      }
    }
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    hideTyping(); // ensure no duplicates
    const el = document.createElement('div');
    el.className = 'typing-indicator';
    el.id = 'typing-indicator';
    el.innerHTML = '<span style="display:inline-block; margin-right:2px;"></span><span style="display:inline-block; margin-right:2px;"></span><span style="display:inline-block;"></span><div class="processing-text" style="margin-left: 8px; font-size: 13px; font-style: italic; opacity: 0.8; color: var(--text-muted);">Processing...</div>';
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    const els = messagesEl.querySelectorAll('.typing-indicator');
    els.forEach(el => el.remove());
  }

  function showPickerSheet(contentElement) {
    const sheet = shadow.getElementById('picker-sheet');
    sheet.innerHTML = '';
    
    const handle = document.createElement('div');
    handle.className = 'picker-sheet-handle';
    sheet.appendChild(handle);
    
    sheet.appendChild(contentElement);
    sheet.classList.add('open');
  }

  function hidePickerSheet() {
    const sheet = shadow.getElementById('picker-sheet');
    if (sheet) {
      sheet.classList.remove('open');
      setTimeout(() => { sheet.innerHTML = ''; }, 400);
    }
  }
  async function sendChatRequest(messageText, displayUserText) {
    hidePickerSheet();
    if (displayUserText) {
      addMessageToUI(displayUserText, true);
    }
    messages.push({ role: 'user', content: messageText });

    input.disabled = true;
    sendBtn.disabled = true;
    showTyping();

    // Give UI a chance to render the typing indicator before fetching
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 50))));

    try {
      const fetchUrl = (apiUrl.startsWith('http') || apiUrl.startsWith('/')) 
          ? apiUrl 
          : `/api/chat/booking`;

      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          shopId, 
          messages,
          userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          pageContext: collectPageContext()
        })
      });

      const data = await response.json();
      hideTyping();
      
      if (data.error) {
        addMessageToUI('Sorry, I encountered an error: ' + data.error, false);
      } else if (data.text !== undefined || data.ui) {
        let displayText = data.text || "";
        let options = [];
        
        // Parse numbered lists like "1. Option A"
        const listRegex = /^(\d+)\.\s+(.+)$/gm;
        let match;
        while ((match = listRegex.exec(displayText)) !== null) {
          options.push({ value: match[1], label: match[2].trim() });
        }
        
        if (options.length > 0) {
           // Remove the options from the text
           displayText = displayText.replace(listRegex, '').trim();
           // Remove any trailing sentences asking to pick a number
           displayText = displayText.replace(/Reply with \d+.*$/gi, '').trim();
           displayText = displayText.replace(/Please select a number.*$/gi, '').trim();
        }
        
        if (displayText) {
          addMessageToUI(displayText, false);
        } else if (options.length > 0) {
          addMessageToUI("Please select an option:", false);
        }
        
        if (data.history) {
          messages = data.history;
        } else {
          messages.push({ role: 'assistant', content: data.text });
        }
        // Persist session
        try { sessionStorage.setItem('kutzapp-chat-' + shopId, JSON.stringify(messages)); } catch(e) {}
        
        if (options.length > 0 && (!data.ui || data.ui.type !== 'time_picker')) {
          const container = document.createElement('div');
          container.className = 'slots-container';
          container.style.marginTop = '8px';
          
          options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'slot-btn';
            btn.textContent = opt.label;
            btn.style.textAlign = 'left';
            btn.addEventListener('click', () => {
              container.style.opacity = '0.5';
              container.style.pointerEvents = 'none';
              sendChatRequest(opt.label, opt.label);
            });
            container.appendChild(btn);
          });
          
          messagesEl.appendChild(container);
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        const createDateCarousel = (selectedDateStr, onChange) => {
          const carousel = document.createElement('div');
          carousel.className = 'date-carousel';
          carousel.style.display = 'flex';
          carousel.style.overflowX = 'auto';
          carousel.style.gap = '8px';
          carousel.style.paddingBottom = '12px';
          carousel.style.marginBottom = '16px';
          
          const styleEl = document.createElement('style');
          styleEl.textContent = `
            .date-carousel::-webkit-scrollbar { display: none; }
            .date-carousel { -ms-overflow-style: none; scrollbar-width: none; }
          `;
          carousel.appendChild(styleEl);

          const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          
          const getYYYYMMDD = (d) => {
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
          };

          let todayStr = getYYYYMMDD(new Date());
          let currentSelected = selectedDateStr || todayStr;

          for (let i = 0; i < 14; i++) {
              const d = new Date();
              d.setDate(d.getDate() + i);
              const dateStr = getYYYYMMDD(d);
              const isSelected = dateStr === currentSelected;
              
              const btn = document.createElement('button');
              btn.style.flex = '0 0 auto';
              btn.style.display = 'flex';
              btn.style.flexDirection = 'column';
              btn.style.alignItems = 'center';
              btn.style.justifyContent = 'center';
              btn.style.padding = '8px 16px';
              btn.style.borderRadius = '12px';
              btn.style.border = isSelected ? `2px solid ${themeColor}` : '1px solid var(--border-color)';
              btn.style.backgroundColor = isSelected ? `rgba(${tc.r},${tc.g},${tc.b},0.1)` : 'transparent';
              btn.style.color = isSelected ? 'var(--text-color)' : 'var(--text-color)';
              btn.style.cursor = 'pointer';
              btn.style.transition = 'all 0.2s ease';
              
              const dayName = document.createElement('span');
              dayName.textContent = daysOfWeek[d.getDay()];
              dayName.style.fontSize = '11px';
              dayName.style.textTransform = 'uppercase';
              dayName.style.opacity = isSelected ? '1' : '0.6';
              dayName.style.marginBottom = '4px';
              
              const dayNumber = document.createElement('span');
              dayNumber.textContent = d.getDate().toString();
              dayNumber.style.fontSize = '18px';
              dayNumber.style.fontWeight = 'bold';

              btn.appendChild(dayName);
              btn.appendChild(dayNumber);

              if (!isSelected) {
                  btn.addEventListener('mouseover', () => btn.style.backgroundColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)');
                  btn.addEventListener('mouseout', () => btn.style.backgroundColor = 'transparent');
              }

              btn.addEventListener('click', () => {
                  if (isSelected) return;
                  onChange(dateStr);
              });
              
              carousel.appendChild(btn);
          }
          
          // Scroll to selected date if it's not the first few items
          setTimeout(() => {
              const selectedBtn = Array.from(carousel.children).find(child => child.tagName === 'BUTTON' && child.style.backgroundColor !== 'transparent');
              if (selectedBtn && selectedBtn.offsetLeft > carousel.clientWidth / 2) {
                  carousel.scrollTo({ left: selectedBtn.offsetLeft - (carousel.clientWidth / 2) + (selectedBtn.clientWidth / 2), behavior: 'smooth' });
              }
          }, 50);
          
          return carousel;
        };

        if (data.ui && data.ui.type === 'date_picker') {
          const container = document.createElement('div');
          container.style.display = 'flex';
          container.style.flexDirection = 'column';
          container.style.alignItems = 'stretch';
          container.style.width = '100%';

          const title = document.createElement('div');
          title.textContent = 'Select Date';
          title.style.fontWeight = 'bold';
          title.style.color = 'var(--text-color)';
          title.style.fontSize = '18px';
          title.style.marginBottom = '16px';
          title.style.textAlign = 'center';
          
          container.appendChild(title);

          const carousel = createDateCarousel(null, (dateStr) => {
            container.style.opacity = '0.5';
            container.style.pointerEvents = 'none';
            sendChatRequest(dateStr, false);
          });
          container.appendChild(carousel);
          
          showPickerSheet(container);
        } else if (data.ui && data.ui.type === 'time_picker' && data.ui.slots && data.ui.slots.length > 0) {
          const container = document.createElement('div');
          container.style.display = 'flex';
          container.style.flexDirection = 'column';
          container.style.alignItems = 'stretch';
          container.style.width = '100%';
          container.style.flex = '1';
          container.style.overflow = 'hidden';

          // Cohesive Header Row
          const header = document.createElement('div');
          header.style.display = 'flex';
          header.style.justifyContent = 'space-between';
          header.style.alignItems = 'center';
          header.style.borderBottom = '2px solid var(--border-color)';
          header.style.paddingBottom = '12px';
          header.style.marginBottom = '12px';

          const title = document.createElement('div');
          title.textContent = 'Select Date & Time';
          title.style.fontWeight = 'bold';
          title.style.color = 'var(--text-color)';
          title.style.fontSize = '18px';

          header.appendChild(title);
          container.appendChild(header);
          
          const carousel = createDateCarousel(data.ui.date, (dateStr) => {
            container.style.opacity = '0.5';
            container.style.pointerEvents = 'none';
            sendChatRequest(dateStr, false);
          });
          container.appendChild(carousel);

          const styleEl = document.createElement('style');
          styleEl.textContent = `
            .time-grid-container::-webkit-scrollbar {
              width: 5px;
            }
            .time-grid-container::-webkit-scrollbar-track {
              background: transparent;
              border-radius: 3px;
            }
            .time-grid-container::-webkit-scrollbar-thumb {
              background: var(--border-color);
              border-radius: 3px;
            }
          `;
          container.appendChild(styleEl);

          const timeGrid = document.createElement('div');
          timeGrid.className = 'time-grid-container';
          timeGrid.style.display = 'grid';
          timeGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
          timeGrid.style.gap = '8px';
          timeGrid.style.marginBottom = '16px';
          timeGrid.style.maxHeight = '220px';
          timeGrid.style.overflowY = 'auto';
          timeGrid.style.paddingRight = '4px';

          let selectedIndex = null;
          const timeButtons = [];

          for (let i = 0; i < data.ui.slots.length; i++) {
             const slot = data.ui.slots[i];
             const isAvail = slot.available !== false;
             
             const btn = document.createElement('button');
             btn.textContent = slot.time;
             btn.className = 'slot-btn';
             btn.style.width = '100%';
             btn.style.textAlign = 'center';
             btn.style.padding = '10px 4px';
             btn.style.fontSize = '13px';
             
             if (!isAvail) {
                 btn.disabled = true;
                 btn.style.opacity = '0.3';
                 btn.style.cursor = 'not-allowed';
                 btn.style.textDecoration = 'line-through';
             } else {
                 btn.addEventListener('click', () => {
                     if (selectedIndex !== null && timeButtons[selectedIndex]) {
                         timeButtons[selectedIndex].style.backgroundColor = 'transparent';
                         timeButtons[selectedIndex].style.color = 'var(--text-color)';
                     }
                     selectedIndex = i;
                     btn.style.backgroundColor = 'var(--text-color)';
                     btn.style.color = 'var(--bg-color)';
                     
                     confirmBtn.disabled = false;
                     confirmBtn.style.opacity = '1';
                     confirmBtn.style.cursor = 'pointer';
                 });
                 
                 if (selectedIndex === null) {
                     selectedIndex = i;
                     btn.style.backgroundColor = 'var(--text-color)';
                     btn.style.color = 'var(--bg-color)';
                 }
             }
             timeButtons.push(btn);
             timeGrid.appendChild(btn);
          }

          const confirmBtn = document.createElement('button');
          confirmBtn.className = 'slot-btn';
          confirmBtn.style.width = '100%';
          confirmBtn.style.padding = '12px';
          confirmBtn.style.fontSize = '16px';
          confirmBtn.style.fontWeight = 'bold';
          confirmBtn.style.marginTop = '4px';
          confirmBtn.textContent = 'Confirm Time';
          
          if (selectedIndex === null) {
              confirmBtn.disabled = true;
              confirmBtn.style.opacity = '0.5';
              confirmBtn.style.cursor = 'not-allowed';
          }

          confirmBtn.addEventListener('click', () => {
             if (selectedIndex === null) return;
             
             let availableIndex = 0;
             for (let i = 0; i <= selectedIndex; i++) {
                if (data.ui.slots[i].available !== false) availableIndex++;
             }
             
             const selectedTime = data.ui.slots[selectedIndex].time;
             container.style.opacity = '0.5';
             container.style.pointerEvents = 'none';
             sendChatRequest(`${data.ui.date} at ${selectedTime}`, `${data.ui.date} at ${selectedTime}`);
          });

          container.appendChild(timeGrid);
          container.appendChild(confirmBtn);

          showPickerSheet(container);
        } else if (data.ui && data.ui.type === 'qr_code' && data.ui.qrCodeUrl) {
          const container = document.createElement('div');
          container.style.textAlign = 'center';
          container.style.marginTop = '8px';
          container.style.alignSelf = 'center';
          
          const img = document.createElement('img');
          img.src = data.ui.qrCodeUrl;
          img.style.width = '150px';
          img.style.height = '150px';
          img.style.borderRadius = '8px';
          img.style.backgroundColor = 'white';
          img.style.padding = '8px';
          img.style.border = '2px solid var(--border-color)';
          
          const caption = document.createElement('div');
          caption.textContent = 'Save this QR code for fast check-in!';
          caption.style.fontSize = '12px';
          caption.style.color = 'var(--text-color)';
          caption.style.marginTop = '6px';
          caption.style.fontWeight = 'bold';
          
          container.appendChild(img);
          container.appendChild(caption);
          messagesEl.appendChild(container);
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }
      }
    } catch (err) {
      console.error(err);
      hideTyping();
      addMessageToUI('Sorry, there was a network error. Please try again.', false);
    } finally {
      input.disabled = false;
      sendBtn.disabled = false;
      setTimeout(() => input.focus(), 100);
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    if (input.type === 'date') {
      input.type = 'text';
    }

    input.value = '';
    sendChatRequest(text, text);
  });

  // ── Restore session ──
  restoreSession();

  // ── Welcome bubble logic ──
  const bubbleDismissed = sessionStorage.getItem('kutzapp-bubble-dismissed');
  if (!bubbleDismissed && welcomeBubble) {
    setTimeout(() => {
      if (!isOpen) welcomeBubble.classList.add('show');
    }, 3000);
    setTimeout(() => {
      welcomeBubble.classList.remove('show');
    }, 11000);
  }
  if (welcomeBubble) {
    welcomeBubble.addEventListener('click', () => {
      welcomeBubble.classList.remove('show');
      sessionStorage.setItem('kutzapp-bubble-dismissed', '1');
      toggleChat(true);
    });
  }
})();