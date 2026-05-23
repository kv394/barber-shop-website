import React, { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/ssr';
import ReactMarkdown from 'react-markdown';

// Simple message interface
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatBox({ shopId }: { shopId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const supabase = createClientComponentClient();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const messageText = input;
    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          shopId,
          role: session?.user?.app_metadata?.role || 'SHOP_STAFF',
        }),
      });
      const result = await response.json();
      if (!result || typeof result.reply !== 'string') {
        console.error('Invalid API response:', result);
        const errMsg: Message = { role: 'assistant', content: '⚠️ Unexpected response from AI. Please try again.' };
        setMessages(prev => [...prev, errMsg]);
        return;
      }
      console.log('Chat API response:', result);
      const assistantMessage: Message = { role: 'assistant', content: result.reply };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (e) {
      console.error('Error sending chat request', e);
      const errMsg: Message = { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' };
      setMessages(prev => [...prev, errMsg]);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container" style={containerStyle}>
      <div className="chat-messages" style={messagesStyle}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-bubble ${msg.role}`}
            style={msg.role === 'user' ? userBubbleStyle : assistantBubbleStyle}
          >
            {msg.role === 'assistant' ? (
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            ) : (
              msg.content
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Ask me anything about your shop..."
        rows={2}
        style={inputStyle}
      />
      <button onClick={sendMessage} style={buttonStyle}>Send</button>
    </div>
  );
}

// Premium styling – glassmorphism with subtle animation
const containerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '24px',
  right: '24px',
  width: '360px',
  maxHeight: '560px',
  background: 'rgba(255,255,255,0.85)',
  backdropFilter: 'blur(12px)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  display: 'flex',
  flexDirection: 'column',
  padding: '16px',
  zIndex: 1000,
  animation: 'fadeIn 0.3s ease-out',
};

const messagesStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  marginBottom: '8px',
};

const userBubbleStyle: React.CSSProperties = {
  alignSelf: 'flex-end',
  background: '#ffedd5',
  color: '#7c2d12',
  borderRadius: '12px',
  padding: '10px 14px',
  margin: '4px 0',
  maxWidth: '92%',
  fontSize: '14px',
  lineHeight: '1.4',
  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
};

const assistantBubbleStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  background: '#f3f4f6',
  color: '#111827',
  borderRadius: '12px',
  padding: '10px 14px',
  margin: '4px 0',
  maxWidth: '92%',
  fontSize: '14px',
  lineHeight: '1.4',
  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  padding: '8px',
  resize: 'none',
  fontSize: '14px',
  marginBottom: '6px',
  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.07)',
};

const buttonStyle: React.CSSProperties = {
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '10px 14px',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'background 0.2s',
};

// Inject keyframes for fade‑in effect
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`;
  document.head.appendChild(style);
}
