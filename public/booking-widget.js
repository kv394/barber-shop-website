(function() {
  const containerId = 'barbersaas-booking-widget-container';
  if (document.getElementById(containerId)) {
    // Already initialized
    return;
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
  document.body.appendChild(container);

  // Attach shadow DOM
  const shadow = container.attachShadow({ mode: 'closed' });

  // Styles
  const style = document.createElement('style');
  style.textContent = \`
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
      bottom: 100px;
      right: 24px;
      width: 360px;
      height: 500px;
      max-height: calc(100vh - 120px);
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
    }
    
    #chat-input:focus {
      border-color: var(--primary-color);
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
  \`;
  shadow.appendChild(style);

  // HTML Structure
  const wrapper = document.createElement('div');
  wrapper.innerHTML = \`
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
        <div class="message bot">Hi! I'm the AI assistant. How can I help you book your appointment today?</div>
      </div>
      <form id="chat-input-area">
        <input type="text" id="chat-input" placeholder="Type a message..." autocomplete="off" />
        <button type="submit" id="send-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
    </div>
  \`;
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
    { role: 'assistant', content: "Hi! I'm the AI assistant. How can I help you book your appointment today?" }
  ];

  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen) {
      windowEl.classList.add('open');
      input.focus();
    } else {
      windowEl.classList.remove('open');
    }
  }

  button.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);

  function addMessageToUI(text, isUser) {
    const el = document.createElement('div');
    el.className = \`message \${isUser ? 'user' : 'bot'}\`;
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    // Add user message
    addMessageToUI(text, true);
    messages.push({ role: 'user', content: text });
    input.value = '';
    
    // Disable input while waiting
    input.disabled = true;
    sendBtn.disabled = true;
    showTyping();

    try {
      // Determine the API URL based on where the script is running. 
      // If we are on the same origin (e.g. testing locally), we can use a relative path or local URL.
      // In production, data-api-url will be used.
      const fetchUrl = (apiUrl.startsWith('http') || apiUrl.startsWith('/')) 
          ? apiUrl 
          : \`/api/chat/booking\`;

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
        addMessageToUI(data.text, false);
        messages.push({ role: 'assistant', content: data.text });
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
  });
})();