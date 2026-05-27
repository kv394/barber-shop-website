'use client';

import { useState, useEffect } from 'react';

interface MediaPickerProps {
 shopId: string;
 onSelect: (url: string) => void;
 currentUrl?: string | null;
 label?: string;
 className?: string;
}

export default function MediaPicker({ shopId, onSelect, currentUrl, label = 'Select Image', className = '' }: MediaPickerProps) {
 const [isOpen, setIsOpen] = useState(false);
 const [isUploading, setIsUploading] = useState(false);
 const [existingImages, setExistingImages] = useState<{ id: string, name: string, url: string }[]>([]);
 const [isLoadingExisting, setIsLoadingExisting] = useState(false);
 const [activeTab, setActiveTab] = useState<'upload' | 'existing'>('upload');

 useEffect(() => {
 if (isOpen && activeTab === 'existing') {
 setIsLoadingExisting(true);
 fetch(`/api/shops/${shopId}/pictures`)
 .then(async r => {
 if (!r.ok) return { files: [] };
 try {
 return await r.json();
 } catch (e) {
 return { files: [] };
 }
 })
 .then(data => {
 setExistingImages(data && Array.isArray(data.files) ? data.files : []);
 })
 .catch(err => {
 console.error("Error fetching existing images:", err);
 setExistingImages([]);
 })
 .finally(() => setIsLoadingExisting(false));
 }
 }, [isOpen, activeTab, shopId]);

 const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 setIsUploading(true);
 try {
 const fd = new FormData();
 fd.append('file', file);
 fd.append('type', 'pictures');
 const res = await fetch(`/api/shops/${shopId}/upload`, { method: 'POST', body: fd });
 const data = await res.json();
 if (data.error) throw new Error(data.error);
 onSelect(data.url);
 setIsOpen(false);
 } catch (err: any) {
 alert('Upload failed: ' + err.message);
 } finally {
 setIsUploading(false);
 }
 };

 const handleSelectExisting = (url: string) => {
 onSelect(url);
 setIsOpen(false);
 };

 return (
 <div className={className}>
 <div className="flex items-center gap-4">
 {currentUrl && (
 <img src={currentUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-crm-border shadow-sm" />
 )}
 <button
 type="button"
 onClick={() => setIsOpen(true)}
 className="bg-crm-surface border border-crm-border hover:border-crm-primary transition-colors px-4 py-2 rounded-lg text-[13px] font-medium text-crm-text"
 >
 {label}
 </button>
 {currentUrl && (
 <button
 type="button"
 onClick={() => onSelect('')}
 className="text-status-cancelled text-[13px] hover:underline"
 >
 Remove
 </button>
 )}
 </div>

 {isOpen && (
 <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
 <div className="bg-crm-surface rounded-2xl border border-crm-border shadow-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[80vh] flex flex-col relative overflow-hidden">
 <button
 type="button"
 onClick={() => setIsOpen(false)}
 className="absolute top-4 right-4 text-crm-muted hover:text-crm-text bg-crm-bg w-8 h-8 rounded-full flex items-center justify-center"
 >
 ✕
 </button>
 <h2 className="text-xl font-bold mb-6 text-crm-text">Media Library</h2>

 <div className="flex border-b border-crm-border mb-6">
 <button
 type="button"
 className={`pb-2 px-4 text-[13px] font-bold border-b-2 transition-colors ${activeTab === 'upload' ? 'border-crm-primary text-crm-text' : 'border-transparent text-crm-muted'}`}
 onClick={() => setActiveTab('upload')}
 >
 Upload New
 </button>
 <button
 type="button"
 className={`pb-2 px-4 text-[13px] font-bold border-b-2 transition-colors ${activeTab === 'existing' ? 'border-crm-primary text-crm-text' : 'border-transparent text-crm-muted'}`}
 onClick={() => setActiveTab('existing')}
 >
 Select Existing
 </button>
 </div>

 {activeTab === 'upload' && (
 <div className="flex-1 flex flex-col items-center justify-center py-8 sm:py-12 border-2 border-dashed border-crm-border rounded-xl px-2 sm:px-4 text-center mx-2 sm:mx-0">
 <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📸</div>
 <p className="text-crm-muted mb-4 text-[12px] sm:text-[13px] px-2">Select an image from your computer</p>
 <label className="cursor-pointer bg-crm-primary text-white font-bold px-3 sm:px-6 py-2 rounded-lg hover:opacity-90 transition-opacity text-[12px] sm:text-[13px] max-w-full overflow-hidden text-ellipsis whitespace-nowrap block">
 {isUploading ? 'Uploading...' : 'Choose File'}
 <input type="file" accept="image/*" onChange={handleUpload} disabled={isUploading} className="hidden" />
 </label>
 </div> )}

 {activeTab === 'existing' && (
 <div className="flex-1 overflow-y-auto min-h-[300px] hide-scrollbar">
 {isLoadingExisting ? (
 <div className="flex justify-center items-center h-full text-crm-muted text-[13px]">Loading images...</div>
 ) : (!Array.isArray(existingImages) || existingImages.length === 0) ? (
 <div className="flex justify-center items-center h-full text-crm-muted text-[13px]">No images found in your library.</div>
 ) : (
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
 {existingImages.map((img, index) => {
 if (!img) return null;
 const id = typeof img === 'object' && img.id ? img.id : String(index);
 const url = typeof img === 'string' ? img : (img.url || '');
 const name = typeof img === 'object' && img.name ? img.name : 'Image';
 
 return (
 <div
 key={id}
 className="cursor-pointer group relative aspect-square rounded-xl overflow-hidden border border-crm-border hover:border-crm-primary"
 onClick={() => handleSelectExisting(url)}
 >
 <img src={url} alt={name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
 <span className="text-white font-bold text-[13px]">Select</span>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 );
}
