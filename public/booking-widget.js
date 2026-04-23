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
  const shopId = scriptTag.getAttribute('data-shop-id');
  const apiUrl = scriptTag.getAttribute('data-api-url') || 'https://barbersaas.com/api/chat/booking';

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
      --primary-color: #d4af37;
      --bg-color: #121412;
      --text-color: #e3e2e0;
      --border-color: #333;
      --msg-user-bg: #d4af37;
      --msg-user-text: #121412;
      --msg-bot-bg: #2a2a2a;
      --msg-bot-text: #e3e2e0;
      font-family: system-ui, -apple-system, sans-serif;
    }
    
    #widget-button {
      position: fixed;
      bottom: 24px;
      right: 24px;
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
      transition: transform 0.2s;
    }
    
    #widget-button:hover {
      transform: scale(1.05);
    }
    
    #widget-button svg {
      width: 32px;
      height: 32px;
    }
    
    #chat-window {
      position: fixed;
      bottom: 140px;
      right: 24px;
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
      transform: translateY(20px);
      transition: opacity 0.3s, transform 0.3s;
    }
    
    #chat-window.open {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
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
      align-self: flex-start;
      max-width: 90%;
    }
    
    .slot-btn {
      background-color: transparent;
      border: 1px solid var(--primary-color);
      color: var(--primary-color);
      padding: 6px 12px;
      border-radius: 14px;
      cursor: pointer;
      font-size: 13px;
      transition: background-color 0.2s, color 0.2s;
    }
    
    .slot-btn:hover {
      background-color: var(--primary-color);
      color: var(--msg-user-text);
    }
  `;
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
      input.focus();
    } else {
      windowEl.classList.remove('open');
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

  async function sendChatRequest(messageText, displayUserText) {
    addMessageToUI(displayUserText, true);
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
        
        if (options.length > 0 && (!data.ui || data.ui.type !== 'time_picker')) {
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

        if (data.ui && data.ui.type === 'date_picker') {
          const container = document.createElement('div');
          container.className = 'slots-container';
          container.style.flexDirection = 'column';
          container.style.alignItems = 'stretch';
          container.style.width = '90%';
          container.style.backgroundColor = 'var(--msg-bot-bg)';
          container.style.padding = '12px';
          container.style.borderRadius = '12px';
          
          const dateLabel = document.createElement('div');
          dateLabel.textContent = 'Select Date:';
          dateLabel.style.fontWeight = 'bold';
          dateLabel.style.marginBottom = '8px';
          dateLabel.style.color = 'var(--text-color)';
          
          const dateInput = document.createElement('input');
          dateInput.type = 'date';
          dateInput.min = new Date().toISOString().split('T')[0];
          dateInput.style.width = '100%';
          dateInput.style.padding = '10px';
          dateInput.style.borderRadius = '8px';
          dateInput.style.border = '1px solid var(--primary-color)';
          dateInput.style.backgroundColor = 'var(--bg-color)';
          dateInput.style.color = 'var(--text-color)';
          dateInput.style.colorScheme = 'dark';
          dateInput.style.marginBottom = '12px';
          dateInput.style.boxSizing = 'border-box';

          const timePlaceholder = document.createElement('div');
          timePlaceholder.textContent = 'Time slider will appear here...';
          timePlaceholder.style.fontSize = '13px';
          timePlaceholder.style.color = 'var(--text-color)';
          timePlaceholder.style.opacity = '0.5';
          timePlaceholder.style.textAlign = 'center';
          timePlaceholder.style.padding = '10px 0';

          dateInput.addEventListener('change', (e) => {
            if (!e.target.value) return;
            container.style.opacity = '0.5';
            container.style.pointerEvents = 'none';
            sendChatRequest(e.target.value, e.target.value);
          });
          
          container.appendChild(dateLabel);
          container.appendChild(dateInput);
          container.appendChild(timePlaceholder);
          
          messagesEl.appendChild(container);
          messagesEl.scrollTop = messagesEl.scrollHeight;
        } else if (data.ui && data.ui.type === 'time_picker' && data.ui.slots && data.ui.slots.length > 0) {
          const container = document.createElement('div');
          container.className = 'slots-container';
          container.style.flexDirection = 'column';
          container.style.alignItems = 'stretch';
          container.style.width = '90%';
          container.style.backgroundColor = 'var(--msg-bot-bg)';
          container.style.padding = '12px';
          container.style.borderRadius = '12px';
          container.style.boxSizing = 'border-box';

          const dateLabel = document.createElement('div');
          dateLabel.textContent = 'Date:';
          dateLabel.style.fontWeight = 'bold';
          dateLabel.style.marginBottom = '8px';
          dateLabel.style.color = 'var(--text-color)';
          
          const dateInput = document.createElement('input');
          dateInput.type = 'date';
          dateInput.min = new Date().toISOString().split('T')[0];
          dateInput.value = data.ui.date;
          dateInput.style.width = '100%';
          dateInput.style.padding = '10px';
          dateInput.style.borderRadius = '8px';
          dateInput.style.border = '1px solid var(--primary-color)';
          dateInput.style.backgroundColor = 'var(--bg-color)';
          dateInput.style.color = 'var(--text-color)';
          dateInput.style.colorScheme = 'dark';
          dateInput.style.marginBottom = '16px';
          dateInput.style.boxSizing = 'border-box';

          dateInput.addEventListener('change', (e) => {
            if (!e.target.value) return;
            container.style.opacity = '0.5';
            container.style.pointerEvents = 'none';
            sendChatRequest(e.target.value, e.target.value);
          });
          
          container.appendChild(dateLabel);
          container.appendChild(dateInput);

          const styleEl = document.createElement('style');
          styleEl.textContent = `
            .slider-with-availability {
              -webkit-appearance: none;
              appearance: none;
              height: 6px;
              border-radius: 3px;
              outline: none;
            }
            .slider-with-availability::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: var(--primary-color);
              cursor: pointer;
            }
          `;
          container.appendChild(styleEl);
          
          const label = document.createElement('div');
          label.style.fontWeight = 'bold';
          label.style.color = 'var(--text-color)';
          label.style.textAlign = 'center';
          label.style.marginBottom = '8px';
          label.style.fontSize = '18px';

          let firstAvailableIndex = 0;
          for (let i = 0; i < data.ui.slots.length; i++) {
             if (data.ui.slots[i].available !== false) {
                 firstAvailableIndex = i;
                 break;
             }
          }

          const slider = document.createElement('input');
          slider.type = 'range';
          slider.className = 'slider-with-availability';
          slider.min = '0';
          slider.max = (data.ui.slots.length - 1).toString();
          slider.value = firstAvailableIndex.toString();
          slider.style.width = '100%';
          slider.style.marginBottom = '16px';

          const numSlots = data.ui.slots.length;
          const step = 100 / (numSlots - 1 || 1);
          const gradientStops = [];
          for (let i = 0; i < numSlots; i++) {
             const isAvail = data.ui.slots[i].available !== false;
             const color = isAvail ? 'var(--primary-color)' : '#555555';
             const start = Math.max(0, (i - 0.5) * step);
             const end = Math.min(100, (i + 0.5) * step);
             gradientStops.push(`${color} ${start}%, ${color} ${end}%`);
          }
          slider.style.background = `linear-gradient(to right, ${gradientStops.join(', ')})`;

          const confirmBtn = document.createElement('button');
          confirmBtn.className = 'slot-btn';
          confirmBtn.style.width = '100%';
          confirmBtn.style.padding = '10px';
          confirmBtn.style.fontWeight = 'bold';
          confirmBtn.textContent = 'Confirm Time';

          const updateUI = (index) => {
             const slot = data.ui.slots[index];
             const isAvail = slot.available !== false;
             label.textContent = slot.time + (isAvail ? '' : ' (Unavailable)');
             label.style.opacity = isAvail ? '1' : '0.5';
             confirmBtn.disabled = !isAvail;
             confirmBtn.style.opacity = isAvail ? '1' : '0.5';
             confirmBtn.style.cursor = isAvail ? 'pointer' : 'not-allowed';
          };
          
          updateUI(firstAvailableIndex);

          slider.addEventListener('input', (e) => {
            updateUI(parseInt(e.target.value, 10));
          });

          confirmBtn.addEventListener('click', () => {
             const index = parseInt(slider.value, 10);
             if (data.ui.slots[index].available === false) return;
             
             let availableIndex = 0;
             for (let i = 0; i <= index; i++) {
                if (data.ui.slots[i].available !== false) availableIndex++;
             }
             const timeText = availableIndex.toString();
             
             const selectedTime = data.ui.slots[index].time;
             container.style.opacity = '0.5';
             container.style.pointerEvents = 'none';
             sendChatRequest(timeText, `${data.ui.date} at ${selectedTime}`);
          });

          container.appendChild(label);
          container.appendChild(slider);
          container.appendChild(confirmBtn);

          messagesEl.appendChild(container);
          messagesEl.scrollTop = messagesEl.scrollHeight;
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