'use client';;
import Image from 'next/image';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import UserQRCode from '@/components/clients/UserQRCode';
import { fmtPrice } from '@/lib/formatters';
import { ClientOverviewTab } from './tabs/ClientOverviewTab';
import { ClientHistoryTab } from './tabs/ClientHistoryTab';
import { ClientFormulasTab } from './tabs/ClientFormulasTab';
import { ClientGalleryTab } from './tabs/ClientGalleryTab';

interface ClientDetailProps {
 shopId: string;
 clientId: string;
 clientName: string;
 onClose: () => void;
 currency: string;
}

export default function ClientDetailModal({ shopId, clientId, clientName, onClose, currency }: ClientDetailProps): React.ReactNode {
 const [client, setClient] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [loyaltyData, setLoyaltyData] = useState<any>(null);

 const [activeTab, setActiveTab] = useState<'crm' | 'history' | 'formulas' | 'gallery'>('crm');
 
 // Animation state
 const [isOpen, setIsOpen] = useState(false);
 const [isRendered, setIsRendered] = useState(false);
 const [mounted, setMounted] = useState(false);

 useEffect(() => {
 setMounted(true);
 setIsRendered(true);
 const t = setTimeout(() => setIsOpen(true), 10);
 return () => clearTimeout(t);
 }, []);

 const handleClose = () => {
 setIsOpen(false);
 setTimeout(onClose, 200);
 };
 
 // CRM Form fields
 const [formData, setFormData] = useState({
 clientNotes: '',
 preferences: '',
 allergies: '',
 marketingConsent: false,
 smsConsent: false
 });
 
 const [savingNotes, setSavingNotes] = useState(false);
 const [savedNotes, setSavedNotes] = useState(false);

 // Formulas & Images
 const [newFormula, setNewFormula] = useState('');
 const [newNotes, setNewNotes] = useState('');
 const [newImageUrl, setNewImageUrl] = useState('');
 const [savingFormula, setSavingFormula] = useState(false);
 const [savingImage, setSavingImage] = useState(false);

 // Email compose state
 const [showEmailCompose, setShowEmailCompose] = useState(false);
 const [emailSubject, setEmailSubject] = useState('');
 const [emailMessage, setEmailMessage] = useState('');
 const [sendingEmail, setSendingEmail] = useState(false);
 const [emailSent, setEmailSent] = useState(false);
 const [emailError, setEmailError] = useState('');

 // Voice recording state
 const [isRecording, setIsRecording] = useState(false);
 const [isProcessingVoice, setIsProcessingVoice] = useState(false);
 const mediaRecorderRef = useRef<MediaRecorder | null>(null);
 const audioChunksRef = useRef<Blob[]>([]);

 const startRecording = async () => {
 try {
 const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
 const mediaRecorder = new MediaRecorder(stream);
 mediaRecorderRef.current = mediaRecorder;
 audioChunksRef.current = [];

 mediaRecorder.ondataavailable = (event) => {
 if (event.data.size > 0) {
 audioChunksRef.current.push(event.data);
 }
 };

 mediaRecorder.onstop = async () => {
 const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
 await processVoiceNote(audioBlob);
 stream.getTracks().forEach(track => track.stop());
 };

 mediaRecorder.start();
 setIsRecording(true);
 } catch (err) {
 alert("Failed to access microphone. Please ensure microphone permissions are granted.");
 console.error(err);
 }
 };

 const stopRecording = () => {
 if (mediaRecorderRef.current && isRecording) {
 mediaRecorderRef.current.stop();
 setIsRecording(false);
 }
 };

 const processVoiceNote = async (audioBlob: Blob) => {
 setIsProcessingVoice(true);
 try {
 const fd = new FormData();
 fd.append('audio', audioBlob, 'voice-note.webm');

 const res = await fetch(`/api/shops/${shopId}/clients/${clientId}/voice-notes`, {
 method: 'POST',
 body: fd
 });

 const data = await res.json();
 if (!res.ok) throw new Error(data.error || 'Failed to process voice note');

 setFormData(prev => ({
 ...prev,
 clientNotes: data.newNoteBlock + prev.clientNotes,
 preferences: data.parsed.preferences && !prev.preferences ? data.parsed.preferences : prev.preferences
 }));
 } catch (err: any) {
 alert(err.message);
 } finally {
 setIsProcessingVoice(false);
 }
 };

 useEffect(() => {
 Promise.all([
 fetch(`/api/shops/${shopId}/clients/${clientId}`).then(r => r.json()),
 fetch(`/api/shops/${shopId}/loyalty`).then(r => r.json()).catch(() => null),
 ]).then(([clientData, loyaltyRes]) => {
 setClient(clientData);
 setFormData({
 clientNotes: clientData.shopClients?.[0]?.clientNotes || '',
 preferences: clientData.shopClients?.[0]?.preferences || '',
 allergies: clientData.shopClients?.[0]?.allergies || '',
 marketingConsent: clientData.marketingConsent || false,
 smsConsent: clientData.smsConsent || false,
 });
 if (loyaltyRes?.program) {
 // Fetch this client's loyalty account from the accounts list
 fetch(`/api/shops/${shopId}/loyalty/accounts`)
 .then(r => r.json())
 .then((accounts: any[]) => {
 if (Array.isArray(accounts)) {
 const acct = accounts.find((a: any) => a.userId === clientId);
 setLoyaltyData(acct || null);
 }
 })
 .catch(() => {});
 }
 setLoading(false);
 }).catch(() => setLoading(false));
 }, [shopId, clientId]);

 const saveCrmData = async () => {
 setSavingNotes(true);
 try {
 const res = await fetch(`/api/shops/${shopId}/clients/${clientId}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(formData),
 });
 if (res.ok) {
 setSavedNotes(true);
 setTimeout(() => setSavedNotes(false), 2000);
 }
 } catch {
 alert('Failed to save profile');
 } finally {
 setSavingNotes(false);
 }
 };

 const saveFormula = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!newFormula.trim()) return;
 setSavingFormula(true);
 try {
 const res = await fetch(`/api/shops/${shopId}/clients/${clientId}/formulas`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ formula: newFormula, notes: newNotes }),
 });
 if (res.ok) {
 const added = await res.json();
 setClient((prev: any) => ({ ...prev, clientFormulas: [added, ...(prev.clientFormulas || [])] }));
 setNewFormula('');
 setNewNotes('');
 }
 } finally {
 setSavingFormula(false);
 }
 };

 const saveImage = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!newImageUrl.trim()) return;
 setSavingImage(true);
 try {
 const res = await fetch(`/api/shops/${shopId}/clients/${clientId}/images`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ imageUrl: newImageUrl, imageType: 'AFTER' }),
 });
 if (res.ok) {
 const added = await res.json();
 setClient((prev: any) => ({ ...prev, clientHistoryImages: [added, ...(prev.clientHistoryImages || [])] }));
 setNewImageUrl('');
 }
 } finally {
 setSavingImage(false);
 }
 };

 const getStatusBadge = (status: string) => {
 switch (status) {
 case 'COMPLETED': return <span className="bg-status-confirmed/20 text-status-confirmed px-2 py-0.5 rounded text-[13px] font-bold border border-status-confirmed/30">COMPLETED</span>;
 case 'NO_SHOW': return <span className="bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded text-[13px] font-bold border border-status-pending/30">NO-SHOW</span>;
 case 'CANCELLED': return <span className="bg-status-cancelled/20 text-status-cancelled px-2 py-0.5 rounded text-[13px] font-bold border border-status-cancelled/30">CANCELLED</span>;
 default: return <span className="bg-status-info/20 text-status-info px-2 py-0.5 rounded text-[13px] font-bold border border-status-info/30">SCHEDULED</span>;
 }
 };

 const handleChange = (e: any) => {
 const { name, value, type, checked } = e.target;
 setFormData(prev => ({
 ...prev,
 [name]: type === 'checkbox' ? checked : value
 }));
 };

 const sendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) return;
    setSendingEmail(true);
    setEmailError('');
    try {
      const res = await fetch(`/api/shops/${shopId}/clients/${clientId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: emailSubject, message: emailMessage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send email');
      setEmailSent(true);
      setEmailSubject('');
      setEmailMessage('');
      setTimeout(() => { setEmailSent(false); setShowEmailCompose(false); }, 2500);
    } catch (err: any) {
      setEmailError(err.message);
    } finally {
      setSendingEmail(false);
    }
  };

 const modalContent = (
 <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={handleClose}>
 <div className={`bg-crm-surface rounded-xl p-6 w-full max-w-2xl border border-crm-border shadow-2xl h-[85vh] flex flex-col transition-all duration-300 transform ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
 <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-start mb-6 border-b border-crm-border pb-4 shrink-0">
 <div className="flex gap-4">
 <div>
 <h3 className="font-bold text-crm-primary text-lg">{clientName}</h3>
 {client && (
 <div className="text-[11px] text-crm-muted mt-1 space-y-1">
 <p className="text-[13px]">{client.email?.startsWith('walkin-') ? 'Walk-in Client' : client.email}</p>
 {client.phone && <p className="text-[13px]">📱 {client.phone}</p>}
 {client.referralCode && <p className="text-crm-accent/60 text-[13px]">🔗 Referral: {client.referralCode}</p>}
 </div>
 )}
 </div>
        <div className="shrink-0 flex items-start gap-3 border-l border-crm-border pl-4 ml-2">
          {client && !client.email?.startsWith('walkin-') && (
            <button
              onClick={() => setShowEmailCompose(!showEmailCompose)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-crm-primary/10 text-crm-primary hover:bg-crm-primary/20 border border-crm-primary/20 transition-colors"
              title="Send email to client"
            >
              📧 Email
            </button>
          )}
          <UserQRCode barcode={client?.barcode || clientId} userName={client?.name || clientName} showText={false} size={64} />
        </div>
 </div>
 <button onClick={handleClose} className="absolute top-6 right-6 text-crm-primary bg-crm-surface hover:bg-gray-100 shadow-sm z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors font-bold text-[13px]">✕</button>
 </div>

        {/* Email Compose Panel */}
        {showEmailCompose && (
          <div className="mb-4 bg-crm-bg/80 rounded-xl border border-crm-border p-4 shrink-0 animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[13px] font-bold text-crm-text flex items-center gap-2">📧 Compose Email</h4>
              <button onClick={() => setShowEmailCompose(false)} className="text-crm-muted hover:text-crm-text text-[13px]">✕</button>
            </div>
            {emailSent ? (
              <div className="text-center py-4">
                <span className="text-2xl">✅</span>
                <p className="text-status-confirmed text-[13px] font-bold mt-2">Email sent successfully!</p>
              </div>
            ) : (
              <>
                {emailError && (
                  <div className="mb-3 p-2 bg-status-cancelled/20 text-status-cancelled rounded-lg text-[12px]">{emailError}</div>
                )}
                <input
                  type="text"
                  placeholder="Subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-crm-surface border border-crm-border rounded-lg px-3 py-2 text-crm-text text-[13px] placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-crm-primary/50 mb-2"
                />
                <textarea
                  rows={4}
                  placeholder="Type your message..."
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full bg-crm-surface border border-crm-border rounded-lg px-3 py-2 text-crm-text text-[13px] placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-crm-primary/50 resize-none mb-3"
                />
                <div className="flex items-center justify-between">
                  <p className="text-crm-muted text-[11px]">To: {client?.email}</p>
                  <button
                    onClick={sendEmail}
                    disabled={sendingEmail || !emailSubject.trim() || !emailMessage.trim()}
                    className={`px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                      sendingEmail || !emailSubject.trim() || !emailMessage.trim()
                        ? 'bg-crm-surface text-crm-muted cursor-not-allowed'
                        : 'bg-crm-primary text-white hover:bg-crm-primary/80 shadow-sm'
                    }`}
                  >
                    {sendingEmail ? '⏳ Sending...' : '📤 Send Email'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

 {/* Content Area */}
 {loading ? (
 <p className="text-crm-muted text-center py-8 text-[13px]">Loading...</p>
 ) : client ? (
 <div className="flex flex-col h-full min-h-0">
 {/* Tabs */}
 <div className="flex gap-4 border-b border-crm-border mb-6 pb-2 shrink-0">
 {[
 { id: 'crm', label: '📝 Profile & CRM' },
 { id: 'history', label: '📅 History & Stats' },
 { id: 'formulas', label: '🧪 Color Formulas' },
 { id: 'gallery', label: '📸 Photo Gallery' },
 ].map(t => (
 <button
 key={t.id}
 onClick={() => setActiveTab(t.id as any)}
 className={`pb-2 text-[13px] font-bold transition-colors ${activeTab === t.id ? 'text-crm-accent border-b-2 border-brand-indigo' : 'text-crm-muted hover:text-crm-text'}`}
 >
 {t.label}
 </button>
 ))}
 </div>

 {/* Tab Contents */}
 <div className="flex-1 overflow-y-auto scrollbar-hide pr-2 pb-4">
                {activeTab === 'crm' && (
                  <ClientOverviewTab
                    formData={formData}
                    handleChange={handleChange}
                    isRecording={isRecording}
                    isProcessingVoice={isProcessingVoice}
                    startRecording={startRecording}
                    stopRecording={stopRecording}
                    saveCrmData={saveCrmData}
                    savingNotes={savingNotes}
                    savedNotes={savedNotes}
                    createdAt={client.createdAt}
                  />
                )}

                {activeTab === 'history' && (
                  <ClientHistoryTab
                    client={client}
                    loyaltyData={loyaltyData}
                    currency={currency}
                    getStatusBadge={getStatusBadge}
                  />
                )}

                {activeTab === 'formulas' && (
                  <ClientFormulasTab
                    client={client}
                    newFormula={newFormula}
                    setNewFormula={setNewFormula}
                    newNotes={newNotes}
                    setNewNotes={setNewNotes}
                    savingFormula={savingFormula}
                    saveFormula={saveFormula}
                  />
                )}

                {activeTab === 'gallery' && (
                  <ClientGalleryTab
                    client={client}
                    newImageUrl={newImageUrl}
                    setNewImageUrl={setNewImageUrl}
                    savingImage={savingImage}
                    setSavingImage={setSavingImage}
                    saveImage={saveImage}
                    shopId={shopId}
                  />
                )}
 </div>
 </div>
 ) : (
 <p className="text-status-cancelled text-center py-8 text-[13px]">Failed to load client details.</p>
 )}
 </div>
 </div>
 );

 return isRendered && mounted ? createPortal(modalContent, document.body) : null;
}
