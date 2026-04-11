'use client';

import { useState, useEffect, useRef } from 'react';

interface Sender {
  id: string;
  name: string | null;
  role: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: Sender;
}

export default function TeamChat({ shopId, currentUserId }: { shopId: string, currentUserId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/shops/${shopId}/chat`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 5 seconds
    const intervalId = setInterval(fetchMessages, 5000);
    return () => clearInterval(intervalId);
  }, [shopId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage })
      });

      if (res.ok) {
        const sentMessage = await res.json();
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
      } else {
        alert('Failed to send message');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-400">Loading chat...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-180px)] sm:h-[600px] bg-white rounded-t-3xl sm:rounded-2xl border border-gray-200 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-gray-200 bg-white z-10 shadow-sm relative">
        <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
          <span>💬</span> Team Chat
        </h3>
        <p className="text-xs text-gray-500">Moderated by Shop Admin</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-slate-50">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 italic text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender.id === currentUserId;
            const isAdmin = msg.sender.role === 'SHOP_ADMIN' || msg.sender.role === 'SUPER_ADMIN';

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && (
                  <span className="text-xs text-gray-500 mb-1 ml-1 flex items-center gap-1 font-medium">
                    {msg.sender.name || 'User'} 
                    {isAdmin && <span className="bg-brand-gold text-brand-dark text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Admin</span>}
                  </span>
                )}
                
                <div className={`max-w-[85%] sm:max-w-[80%] px-4 py-2.5 rounded-2xl ${isMe ? 'bg-brand-gold text-brand-dark rounded-br-sm' : 'bg-white border border-gray-200 text-slate-800 rounded-bl-sm'} shadow-sm`}>
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                
                <span className={`text-[10px] text-gray-400 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 bg-white border-t border-gray-200 z-10 pb-safe">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 border border-gray-200 rounded-full px-4 py-2.5 text-sm text-slate-900 placeholder-gray-500 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-shadow"
          />
          <button 
            type="submit" 
            disabled={sending || !newMessage.trim()}
            className="bg-brand-gold text-brand-dark rounded-full w-11 h-11 flex items-center justify-center flex-shrink-0 disabled:opacity-50 transition-opacity hover:bg-yellow-400 shadow-sm"
          >
            {sending ? '...' : '➤'}
          </button>
        </form>
      </div>
    </div>
  );
}
