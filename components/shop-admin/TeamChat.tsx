'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

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
  parent?: {
    id: string;
    content: string;
    sender: { name: string | null };
  } | null;
  receipts?: {
    user: { id: string; name: string | null };
  }[];
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
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isInitialLoad = useRef(true);

  const fetchMessages = async (cursor?: string) => {
    try {
      const url = cursor
        ? `/api/shops/${shopId}/chat?cursor=${cursor}&limit=50`
        : `/api/shops/${shopId}/chat?limit=50`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (cursor) {
          // Prepending older messages – preserve scroll position
          const container = messagesContainerRef.current;
          const prevScrollHeight = container?.scrollHeight || 0;
          
          setMessages(prev => [...data.messages, ...prev]);
          setNextCursor(data.nextCursor);
          
          // After DOM update, adjust scroll so the user stays in place
          requestAnimationFrame(() => {
            if (container) {
              const newScrollHeight = container.scrollHeight;
              container.scrollTop = newScrollHeight - prevScrollHeight;
            }
          });
        } else {
          setMessages(data.messages);
          setNextCursor(data.nextCursor);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingOlder(false);
    }
  };

  const handleLoadOlder = useCallback(async () => {
    if (!nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    await fetchMessages(nextCursor);
  }, [nextCursor, loadingOlder, shopId]);

  useEffect(() => {
    isInitialLoad.current = true;
    fetchMessages();
    
    // Fetch users for mentions
    fetch(`/api/shops/${shopId}/staff`)
      .then(res => res.json())
      .then(data => {
        if (data.staff && Array.isArray(data.staff)) {
          setShopUsers(data.staff);
        }
      })
      .catch(console.error);
      
    // Setup IntersectionObserver for Read Receipts
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const messageId = entry.target.getAttribute('data-message-id');
          const isSender = entry.target.getAttribute('data-is-sender') === 'true';
          const hasRead = entry.target.getAttribute('data-has-read') === 'true';
          
          if (messageId && !isSender && !hasRead) {
             // Optimistically mark as read so we don't spam the API
             entry.target.setAttribute('data-has-read', 'true');
             fetch(`/api/shops/${shopId}/chat/${messageId}/read`, { method: 'POST' }).catch(console.error);
          }
        }
      });
    }, { threshold: 0.5 });
      
    const supabase = createClient();
    const channel = supabase.channel('chat_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Message', filter: `shopId=eq.${shopId}` },
        () => { fetchMessages(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'MessageReceipt' },
        () => { fetchMessages(); }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
      observerRef.current?.disconnect();
    };
  }, [shopId]);

  useEffect(() => {
    // Scroll to bottom only on initial load and new messages (not when loading older)
    if (isInitialLoad.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      isInitialLoad.current = false;
    } else if (!loadingOlder) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const messageNodeRef = (node: HTMLDivElement | null) => {
    if (node && observerRef.current) observerRef.current.observe(node);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imageUrl.trim()) || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: newMessage, 
          imageUrl: imageUrl.trim() || null,
          parentId: replyingTo?.id || null 
        })
      });

      if (res.ok) {
        const sentMessage = await res.json();
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
        setImageUrl('');
        setShowImageInput(false);
        setMentionSearch(null);
        setReplyingTo(null);
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
      <p className="whitespace-pre-wrap break-words px-2 pb-1 text-[13px]">
        {parts.map((part, i) => {
          if (part.startsWith('@')) {
            return (
              <span key={i} className={`font-bold ${isMe ? 'text-crm-text underline decoration-white/50 underline-offset-2' : 'text-crm-accent bg-crm-primary/10 px-1 rounded'} hover:opacity-90`}>
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
    return <div className="p-4 text-center text-crm-muted">Loading chat...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-180px)] sm:h-[600px] bg-crm-surface rounded-t-3xl sm:rounded-2xl border border-crm-border shadow-sm overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="py-2 px-4 sm:px-5 bg-crm-primary z-10 shadow-sm relative hover:opacity-90 text-white">
        <h3 className="font-bold text-white flex items-center gap-2 text-lg font-bold">
          <span>💬</span> Team Chat
        </h3>
        <p className="text-white/80 mt-0.5 text-[13px]">Moderated by Shop Admin</p>
      </div>

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-crm-bg relative">
        {/* Load Older Messages Button */}
        {nextCursor && (
          <div className="flex justify-center pb-2">
            <button
              onClick={handleLoadOlder}
              disabled={loadingOlder}
              className="px-4 py-2 text-[12px] font-semibold bg-crm-surface border border-crm-border text-crm-muted rounded-full hover:bg-crm-border/50 hover:text-crm-text transition-all disabled:opacity-50 disabled:cursor-wait flex items-center gap-2 shadow-sm"
            >
              {loadingOlder ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-crm-muted border-t-transparent rounded-full animate-spin"></span>
                  Loading...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 11 12 6 7 11"></polyline><polyline points="17 18 12 13 7 18"></polyline></svg>
                  Load Older Messages
                </>
              )}
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-crm-muted italic text-[13px]">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender.id === currentUserId;
            const isAdmin = msg.sender.role === 'SHOP_ADMIN' || msg.sender.role === 'SITE_ADMIN';
            const hasRead = msg.receipts?.some(r => r.user.id === currentUserId) || false;
            
            // For receipts displayed to sender
            const otherReceipts = (msg.receipts || []).filter(r => r.user.id !== currentUserId);

            return (
              <div 
                key={msg.id} 
                className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
                ref={messageNodeRef}
                data-message-id={msg.id}
                data-is-sender={isMe}
                data-has-read={hasRead}
              >
                {!isMe && (
                  <span className="text-[11px] text-crm-muted mb-1 ml-1 flex items-center gap-1 font-medium">
                    {msg.sender.name || 'User'} 
                    {isAdmin && <span className="bg-crm-primary text-white text-[11px] font-bold px-1.5 py-0.5 rounded uppercase hover:opacity-90">Admin</span>}
                  </span>
                )}
                
                <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`max-w-[85%] sm:max-w-[80%] p-2 rounded-2xl ${isMe ? 'bg-crm-primary text-white rounded-br-sm' : 'bg-crm-surface border border-crm-border shadow-sm text-crm-text rounded-bl-sm'} shadow-sm flex flex-col gap-2 overflow-hidden relative`}>
                    
                    {/* Parent Thread Quote */}
                    {msg.parent && (
                      <div className={`p-2 mb-1 rounded text-[11px] border-l-2 ${isMe ? 'bg-white/10 border-white/50 text-white/90' : 'bg-crm-bg border-crm-primary/50 text-crm-muted'} truncate`}>
                        <span className="font-bold">{msg.parent.sender.name}:</span> {msg.parent.content}
                      </div>
                    )}
                    
                    {msg.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={msg.imageUrl} alt="Shared image" className="max-w-full rounded-xl object-contain max-h-60" loading="lazy" />
                    )}
                    {msg.content && renderContent(msg.content, isMe)}
                  </div>
                  
                  {/* Reply Button (visible on hover) */}
                  <button
                    onClick={() => {
                      setReplyingTo(msg);
                      inputRef.current?.focus();
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-crm-muted hover:text-crm-primary bg-crm-surface rounded-full shadow-sm border border-crm-border flex-shrink-0"
                    title="Reply in thread"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>
                  </button>
                </div>
                
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mt-1`}>
                  <span className={`text-[11px] text-crm-muted ${isMe ? 'mr-1' : 'ml-1'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  {/* Read Receipts */}
                  {isMe && otherReceipts.length > 0 && (
                    <span className="text-[10px] text-crm-muted/80 mr-1 mt-0.5 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-status-confirmed"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Read by {otherReceipts.map(r => r.user.name?.split(' ')[0]).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mention Dropdown */}
      {mentionSearch !== null && filteredUsers.length > 0 && (
        <div className="absolute bottom-[72px] sm:bottom-[80px] left-4 right-4 bg-crm-surface border border-crm-border shadow-xl rounded-xl z-20 overflow-hidden max-h-48 overflow-y-auto">
          <div className="px-3 py-2 bg-crm-bg text-[11px] font-bold text-crm-muted border-b border-crm-border uppercase tracking-wider">
            Mention a Team Member
          </div>
          {filteredUsers.map(u => (
            <button
              key={u.id}
              type="button"
              onClick={() => insertMention(u.name.split(' ')[0])}
              className="w-full text-left px-4 py-3 hover:bg-crm-bg border-b border-gray-50 last:border-0 flex items-center gap-3 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-crm-primary/20 text-crm-accent font-bold flex items-center justify-center shrink-0 hover:opacity-90">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-crm-text text-[13px]">{u.name}</div>
                <div className="text-[11px] text-crm-muted">{u.role.replace('_', ' ')}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 sm:p-4 bg-crm-surface border-t border-crm-border z-10 pb-safe flex flex-col gap-2">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="flex items-center justify-between bg-crm-bg border-l-4 border-crm-primary p-2 rounded-r-lg mb-1 shadow-sm">
            <div className="flex flex-col overflow-hidden">
              <span className="text-[11px] font-bold text-crm-primary">Replying to {replyingTo.sender.name}</span>
              <span className="text-[12px] text-crm-muted truncate">{replyingTo.content}</span>
            </div>
            <button type="button" onClick={() => setReplyingTo(null)} className="text-crm-muted hover:text-status-cancelled p-1 px-2 font-bold">✕</button>
          </div>
        )}

        {showImageInput && (
          <div className="flex gap-2 items-center bg-crm-bg p-2 rounded-lg border border-crm-border shadow-sm mb-1">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Paste image URL here..."
              className="flex-1 bg-transparent text-[13px] text-crm-text placeholder-gray-500 focus:outline-none px-2"
            />
            <span className="text-crm-muted text-[11px] mx-1">OR</span>
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
              className="w-48 bg-crm-surface border border-crm-border shadow-sm rounded px-2 py-1 text-crm-text text-[11px] focus:outline-none focus:border-brand-indigo file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:bg-crm-primary/20 file:text-crm-primary hover:file:bg-crm-primary/30 hover:opacity-90" 
            />
            <button
              type="button"
              onClick={() => { setImageUrl(''); setShowImageInput(false); }}
              className="text-crm-muted hover:text-status-cancelled font-bold px-2"
            >
              ✕
            </button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => setShowImageInput(!showImageInput)}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${showImageInput || imageUrl ? 'bg-crm-primary/20 text-crm-primary' : 'bg-crm-border/30 text-crm-muted hover:bg-crm-border'}`}
            title="Attach Image URL"
          >
            📸
          </button>
          <input 
            ref={inputRef}
            type="text" 
            value={newMessage}
            onChange={handleInputChange}
            placeholder='Message... (use @help for AI assistant)'
            className="flex-1 bg-crm-border/30 border border-crm-border shadow-sm rounded-full px-4 py-2.5 text-[13px] text-crm-text placeholder-gray-500 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-crm-primary transition-shadow"
          />
          <button 
            type="submit" 
            disabled={sending || (!newMessage.trim() && !imageUrl.trim())}
            className="bg-crm-primary text-white rounded-full w-11 h-11 flex items-center justify-center flex-shrink-0 disabled:opacity-50 transition-opacity hover:opacity-90 shadow-sm"
          >
            {sending ? '...' : '➤'}
          </button>
        </form>
      </div>
    </div>
  );
}
