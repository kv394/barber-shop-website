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
  imageUrl?: string | null;
  createdAt: string;
  sender: Sender;
}

export default function TeamChat({ shopId, currentUserId }: { shopId: string, currentUserId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [shopUsers, setShopUsers] = useState<any[]>([]);
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    
    // Fetch users for mentions
    fetch(`/api/shops/${shopId}/staff`)
      .then(res => res.json())
      .then(data => {
        if (data.staff && Array.isArray(data.staff)) {
          setShopUsers(data.staff);
        }
      })
      .catch(console.error);
      
    return () => clearInterval(intervalId);
  }, [shopId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imageUrl.trim()) || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage, imageUrl: imageUrl.trim() || null })
      });

      if (res.ok) {
        const sentMessage = await res.json();
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
        setImageUrl('');
        setShowImageInput(false);
        setMentionSearch(null);
      } else {
        alert('Failed to send message');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewMessage(val);
    
    // Check if the user is typing a mention
    const lastWord = val.split(' ').pop();
    if (lastWord && lastWord.startsWith('@')) {
      setMentionSearch(lastWord.slice(1).toLowerCase());
    } else {
      setMentionSearch(null);
    }
  };

  const insertMention = (name: string) => {
    const words = newMessage.split(' ');
    words.pop(); // remove the partial @mention
    const newText = [...words, `@${name} `].join(' ');
    setNewMessage(newText);
    setMentionSearch(null);
    inputRef.current?.focus();
  };

  const filteredUsers = mentionSearch !== null 
    ? shopUsers.filter(u => u.name && u.name.split(' ')[0].toLowerCase().startsWith(mentionSearch))
    : [];

  const renderContent = (content: string, isMe: boolean) => {
    if (!content) return null;
    const parts = content.split(/(@\w+)/g);
    return (
      <p className="whitespace-pre-wrap break-words px-2 pb-1 text-base md:text-lg">
        {parts.map((part, i) => {
          if (part.startsWith('@')) {
            return (
              <span key={i} className={`font-bold ${isMe ? 'text-botanical-text underline decoration-white/50 underline-offset-2' : 'text-botanical-accent bg-botanical-primary/10 px-1 rounded'} hover:opacity-90`}>
                {part}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </p>
    );
  };

  if (loading) {
    return <div className="p-4 text-center text-botanical-muted">Loading chat...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-180px)] sm:h-[600px] bg-botanical-surface rounded-t-3xl sm:rounded-2xl border border-botanical-border shadow-sm overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-botanical-primary z-10 shadow-sm relative hover:opacity-90 text-white">
        <h3 className="font-bold text-white flex items-center gap-2 text-2xl md:text-3xl">
          <span>💬</span> Team Chat
        </h3>
        <p className="text-white/80 mt-0.5 text-base md:text-lg">Moderated by Shop Admin</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-botanical-bg relative">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-botanical-muted italic text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender.id === currentUserId;
            const isAdmin = msg.sender.role === 'SHOP_ADMIN' || msg.sender.role === 'SITE_ADMIN';

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && (
                  <span className="text-xs text-botanical-muted mb-1 ml-1 flex items-center gap-1 font-medium">
                    {msg.sender.name || 'User'} 
                    {isAdmin && <span className="bg-botanical-primary text-white text-xs font-bold px-1.5 py-0.5 rounded uppercase hover:opacity-90">Admin</span>}
                  </span>
                )}
                
                <div className={`max-w-[85%] sm:max-w-[80%] p-2 rounded-2xl ${isMe ? 'bg-botanical-primary text-white rounded-br-sm' : 'bg-botanical-surface border border-botanical-border shadow-sm text-botanical-text rounded-bl-sm'} shadow-sm flex flex-col gap-2 overflow-hidden hover:opacity-90`}>
                  {msg.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={msg.imageUrl} alt="Shared image" className="max-w-full rounded-xl object-contain max-h-60" loading="lazy" />
                  )}
                  {msg.content && renderContent(msg.content, isMe)}
                </div>
                
                <span className={`text-sm text-botanical-muted mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mention Dropdown */}
      {mentionSearch !== null && filteredUsers.length > 0 && (
        <div className="absolute bottom-[72px] sm:bottom-[80px] left-4 right-4 bg-botanical-surface border border-botanical-border shadow-sm shadow-xl rounded-xl z-20 overflow-hidden max-h-48 overflow-y-auto">
          <div className="px-3 py-2 bg-botanical-bg text-xs font-bold text-botanical-muted border-b border-gray-100 uppercase tracking-wider">
            Mention a Team Member
          </div>
          {filteredUsers.map(u => (
            <button
              key={u.id}
              type="button"
              onClick={() => insertMention(u.name.split(' ')[0])}
              className="w-full text-left px-4 py-3 hover:bg-botanical-bg border-b border-gray-50 last:border-0 flex items-center gap-3 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-botanical-primary/20 text-botanical-accent font-bold flex items-center justify-center shrink-0 hover:opacity-90">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-botanical-text text-sm">{u.name}</div>
                <div className="text-xs text-botanical-muted">{u.role.replace('_', ' ')}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 sm:p-4 bg-botanical-surface border-t border-botanical-border z-10 pb-safe flex flex-col gap-2">
        {showImageInput && (
          <div className="flex gap-2 items-center bg-botanical-bg p-2 rounded-lg border border-botanical-border shadow-sm mb-1">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Paste image URL here..."
              className="flex-1 bg-transparent text-sm text-botanical-text placeholder-gray-500 focus:outline-none px-2"
            />
            <span className="text-botanical-muted text-xs mx-1">OR</span>
            <input 
              type="file" 
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setSending(true);
                try {
                  const fd = new FormData();
                  fd.append('file', file);
                  fd.append('type', 'chat');
                  const res = await fetch(`/api/shops/${shopId}/upload`, { method: 'POST', body: fd });
                  const data = await res.json();
                  if (data.error) throw new Error(data.error);
                  setImageUrl(data.url);
                } catch (err: any) {
                  alert('Upload failed: ' + err.message);
                } finally {
                  setSending(false);
                }
              }} 
              className="w-48 bg-botanical-surface border border-botanical-border shadow-sm rounded px-2 py-1 text-botanical-text text-xs focus:outline-none focus:border-brand-gold file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-botanical-primary/20 file:text-botanical-primary hover:file:bg-botanical-primary/30 hover:opacity-90" 
            />
            <button
              type="button"
              onClick={() => { setImageUrl(''); setShowImageInput(false); }}
              className="text-botanical-muted hover:text-status-cancelled font-bold px-2"
            >
              ✕
            </button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => setShowImageInput(!showImageInput)}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${showImageInput || imageUrl ? 'bg-botanical-primary/20 text-botanical-primary' : 'bg-botanical-border/30 text-botanical-muted hover:bg-botanical-border'}`}
            title="Attach Image URL"
          >
            📸
          </button>
          <input 
            ref={inputRef}
            type="text" 
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 bg-botanical-border/30 border border-botanical-border shadow-sm rounded-full px-4 py-2.5 text-sm text-botanical-text placeholder-gray-500 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-botanical-primary transition-shadow"
          />
          <button 
            type="submit" 
            disabled={sending || (!newMessage.trim() && !imageUrl.trim())}
            className="bg-botanical-primary text-white rounded-full w-11 h-11 flex items-center justify-center flex-shrink-0 disabled:opacity-50 transition-opacity hover:opacity-90 shadow-sm"
          >
            {sending ? '...' : '➤'}
          </button>
        </form>
      </div>
    </div>
  );
}
