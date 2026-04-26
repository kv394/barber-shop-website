(function() {
  const containerId = 'barbersaas-booking-widget-container';
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

  if (!scriptTag) {
    console.error('Booking widget script tag not found');
    return;
  }
  const shopId = scriptTag.getAttribute('data-shop-id') || (window.BarberSaaS && window.BarberSaaS.shopId);
  const apiUrl = scriptTag.getAttribute('data-api-url') || (window.BarberSaaS && window.BarberSaaS.apiUrl) + '/api/chat/booking' || 'https://barbersaas-henna.vercel.app/api/chat/booking';
  const themeColor = (window.BarberSaaS && window.BarberSaaS.primaryColor) || scriptTag.getAttribute('data-theme-color') || '#d4af37';
  const secondaryColor = (window.BarberSaaS && window.BarberSaaS.secondaryColor) || scriptTag.getAttribute('data-secondary-color') || themeColor;
  const position = (window.BarberSaaS && window.BarberSaaS.chatbotPosition) || scriptTag.getAttribute('data-position') || 'bottom-right';
  const isLeft = position === 'bottom-left';
  const sideCSS = isLeft ? 'left: 24px;' : 'right: 24px;';
  const transformOrigin = isLeft ? 'bottom left' : 'bottom right';

  if (!shopId) {
    console.error('Booking widget requires data-shop-id attribute');
    return;
  }

  // Create a container for the shadow DOM
  const container = document.createElement('div');
  container.id = containerId;

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
      --bg-color: #121412;
      --text-color: #e3e2e0;
      --border-color: #333;
      --msg-user-bg: ${themeColor};
      --msg-user-text: #ffffff;
      --msg-bot-bg: #2a2a2a;
      --msg-bot-text: #e3e2e0;
      font-family: system-ui, -apple-system, sans-serif;
    }
    
    #widget-button {
      position: fixed;
      bottom: 24px;
      ${sideCSS}
      width: 60px;
      height: 60px;
      border-radius: 30px;
      background-color: var(--primary-color);
      color: var(--msg-user-text);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999999;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    #widget-button:hover {
      transform: scale(1.08) translateY(-2px);
    }

    #widget-button:active {
      transform: scale(0.95);
    }
    
    #widget-button svg {
      width: 32px;
      height: 32px;
      transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    #widget-button.open svg {
      transform: rotate(180deg) scale(1.1);
    }
    
    #chat-window {
      position: fixed;
      bottom: 140px;
      ${sideCSS}
      width: 360px;
      height: 500px;
      max-height: calc(100vh - 160px);
      background-color: var(--bg-color);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
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
    
    #chat-header {
      background-color: var(--primary-color);
      color: var(--msg-user-text);
      padding: 16px;
      font-weight: bold;
      font-size: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    #close-button {
      cursor: pointer;
      background: none;
      border: none;
      color: var(--msg-user-text);
      font-size: 24px;
      line-height: 1;
    }
    
    #chat-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .message {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.4;
      white-space: pre-wrap;
      animation: fadeIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards;
    }
    
    .message.user {
      align-self: flex-end;
      background-color: var(--msg-user-bg);
      color: var(--msg-user-text);
      border-bottom-right-radius: 4px;
    }
    
    .message.bot {
      align-self: flex-start;
      background-color: var(--msg-bot-bg);
      color: var(--msg-bot-text);
      border-bottom-left-radius: 4px;
    }
    
    #chat-input-area {
      padding: 12px;
      border-top: 1px solid var(--border-color);
      display: flex;
      gap: 8px;
      align-items: center;
      background-color: var(--bg-color);
      z-index: 10;
    }
    
    #chat-input {
      flex: 1;
      background-color: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-color);
      padding: 10px 14px;
      border-radius: 20px;
      outline: none;
      font-size: 14px;
      color-scheme: dark; /* Helps date picker match dark theme */
    }
    
    #chat-input:focus {
      border-color: var(--primary-color);
    }
    
    #date-toggle-btn {
      background: none;
      border: none;
      color: var(--text-color);
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
      color: var(--primary-color);
    }
    
    #send-button {
      background-color: var(--primary-color);
      color: var(--msg-user-text);
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    #send-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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
      box-shadow: 0 -8px 24px rgba(0,0,0,0.4);
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
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 12px 16px;
      background-color: var(--msg-bot-bg);
      border-radius: 16px;
      border-bottom-left-radius: 4px;
      align-self: flex-start;
      margin-bottom: 12px;
      animation: fadeIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards;
    }
    
    .typing-indicator span {
      width: 6px;
      height: 6px;
      background-color: var(--text-color);
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;
      opacity: 0.6;
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

    .slot-btn {
      background-color: transparent;
      border: 1px solid var(--primary-color);
      color: var(--primary-color);
      padding: 6px 12px;
      border-radius: 14px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .slot-btn:hover {
      background-color: var(--primary-color);
      color: var(--msg-user-text);
      transform: translateY(-1px);
    }

    .slot-btn:active {
      transform: scale(0.97);
    }  `;
  shadow.appendChild(style);

  // HTML Structure
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div id="widget-button">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
      </svg>
    </div>
    
    <div id="chat-window">
      <div id="chat-header">
        <span>Book Appointment</span>
        <button id="close-button">&times;</button>
      </div>
      <div id="chat-messages">
        <div class="message bot">Hi! I'm the AI assistant. What service would you like to book today?</div>
      </div>
      <form id="chat-input-area">
        <input type="text" id="chat-input" placeholder="Type a message..." autocomplete="off" />
        <button type="submit" id="send-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
      <div id="picker-sheet"></div>
    </div>
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

  let isOpen = false;
  let messages = [
    { role: 'assistant', content: "Hi! I'm the AI assistant. What service would you like to book today?" }
  ];

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
    } else {
      windowEl.classList.remove('open');
      button.classList.remove('open');
    }
  }
  button.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);

  // Expose a global function to open the chat from outside
  window.openBarberSaasChat = function(serviceName) {
    toggleChat(true);
  };

  function addMessageToUI(text, isUser) {
    const el = document.createElement('div');
    el.className = `message ${isUser ? 'user' : 'bot'}`;
    el.textContent = text;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'typing-indicator';
    el.id = 'typing-indicator';
    el.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    const el = shadow.getElementById('typing-indicator');
    if (el) el.remove();
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

    try {
      const fetchUrl = (apiUrl.startsWith('http') || apiUrl.startsWith('/')) 
          ? apiUrl 
          : `/api/chat/booking`;

      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, messages })
      });

      const data = await response.json();
      hideTyping();
      
      if (data.error) {
        addMessageToUI('Sorry, I encountered an error: ' + data.error, false);
      } else if (data.text) {
        let displayText = data.text;
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
        }
        
        messages.push({ role: 'assistant', content: data.text });
        
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
              sendChatRequest(opt.value, opt.label);
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
              btn.style.border = isSelected ? '1px solid var(--primary-color)' : '1px solid var(--border-color)';
              btn.style.backgroundColor = isSelected ? 'rgba(212, 175, 55, 0.15)' : 'transparent';
              btn.style.color = isSelected ? 'var(--primary-color)' : 'var(--text-color)';
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
                  btn.addEventListener('mouseover', () => btn.style.backgroundColor = 'rgba(255,255,255,0.05)');
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
          header.style.borderBottom = '1px solid var(--border-color)';
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
              width: 6px;
            }
            .time-grid-container::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.05);
              border-radius: 3px;
            }
            .time-grid-container::-webkit-scrollbar-thumb {
              background: var(--primary-color);
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
                         timeButtons[selectedIndex].style.color = 'var(--primary-color)';
                     }
                     selectedIndex = i;
                     btn.style.backgroundColor = 'var(--primary-color)';
                     btn.style.color = 'var(--msg-user-text)';
                     
                     confirmBtn.disabled = false;
                     confirmBtn.style.opacity = '1';
                     confirmBtn.style.cursor = 'pointer';
                 });
                 
                 if (selectedIndex === null) {
                     selectedIndex = i;
                     btn.style.backgroundColor = 'var(--primary-color)';
                     btn.style.color = 'var(--msg-user-text)';
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
             const timeText = availableIndex.toString();
             
             const selectedTime = data.ui.slots[selectedIndex].time;
             container.style.opacity = '0.5';
             container.style.pointerEvents = 'none';
             sendChatRequest(timeText, `${data.ui.date} at ${selectedTime}`);
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
          img.style.border = '1px solid var(--border-color)';
          
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
      hideTyping();
      addMessageToUI('Sorry, there was a network error. Please try again.', false);
      console.error(err);
    } finally {
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
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
})();