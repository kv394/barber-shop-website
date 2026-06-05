'use client';;
import Image from 'next/image';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CustomPagesForm({ shopId, customization }: { shopId: string; customization: any }) {
 const [pages, setPages] = useState<any[]>(customization?.pages || []);
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [success, setSuccess] = useState(false);
 const router = useRouter();

 const handleSave = async () => {
 setIsLoading(true);
 setError(null);

 try {
 const response = await fetch(`/api/shops/${shopId}/customization`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ customization: { ...customization, pages } }),
 });

 if (!response.ok) {
 const errorData = await response.json().catch(() => ({}));
 throw new Error(errorData.error || `Failed to save pages (${response.status})`);
 }

 setSuccess(true);
 router.refresh();
 setTimeout(() => setSuccess(false), 3000);
 } catch (err: any) {
 setError(err.message || 'An unexpected error occurred');
 } finally {
 setIsLoading(false);
 }
 };

 const addPage = () => {
 const newId = `page-${Date.now()}`;
 setPages([...pages, { id: newId, title: 'New Page', content: '', isVisible: true }]);
 };

 
 const applyFormat = (index: number, pageId: string, openTag: string, closeTag: string) => {
 const textarea = document.getElementById(`textarea-${pageId}`) as HTMLTextAreaElement;
 if (!textarea) return;
 const start = textarea.selectionStart;
 const end = textarea.selectionEnd;
 const currentContent = pages[index].content || '';
 const selectedText = currentContent.substring(start, end);
 const newContent = currentContent.substring(0, start) + openTag + selectedText + closeTag + currentContent.substring(end);
 updatePage(index, 'content', newContent);
 setTimeout(() => {
 textarea.focus();
 textarea.setSelectionRange(start + openTag.length, start + openTag.length + selectedText.length);
 }, 0);
 };

 const updatePage = (index: number, field: string, value: any) => {
 const updated = [...pages];
 updated[index][field] = value;
 setPages(updated);
 setSuccess(false);
 };


 const moveUp = (index: number) => {
 if (index === 0) return;
 const updated = [...pages];
 const temp = updated[index - 1];
 updated[index - 1] = updated[index];
 updated[index] = temp;
 setPages(updated);
 setSuccess(false);
 };

 const moveDown = (index: number) => {
 if (index === pages.length - 1) return;
 const updated = [...pages];
 const temp = updated[index + 1];
 updated[index + 1] = updated[index];
 updated[index] = temp;
 setPages(updated);
 setSuccess(false);
 };

 const removePage = (index: number) => {
 const updated = [...pages];
 updated.splice(index, 1);
 setPages(updated);
 setSuccess(false);
 };

 return (
  <div className="w-full mt-8">
   <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-6">
   <h2 className="font-bold text-crm-text text-xl font-bold">Custom Pages (Menus)</h2>
   <button
   onClick={addPage}
   className="bg-crm-primary text-white px-4 py-2 rounded font-bold hover:bg-crm-primary transition-colors"
   >
   + Add Page
   </button>
   </div>
   <div className="bg-crm-surface border border-crm-border p-4 rounded-xl shadow-sm mb-6 text-[13px] text-crm-muted">
   <h4 className="font-bold text-crm-text mb-2">💡 Dynamic Smart Tags</h4>
   <p className="mb-2">Type these tags exactly as shown anywhere in your page content to automatically generate stunning, theme-aware widgets:</p>
   <ul className="list-disc pl-5 space-y-1">
   <li><code className="text-crm-primary font-bold">{"${services}"}</code> - Renders your service menu and "Book" buttons.</li>
   <li><code className="text-crm-primary font-bold">{"${products}"}</code> - Renders your sellable retail products.</li>
   <li><code className="text-crm-primary font-bold">{"${team}"}</code> - Renders a grid of your staff members with their bios.</li>
   <li><code className="text-crm-primary font-bold">{"${gallery}"}</code> - Displays a masonry gallery of your portfolio images.</li>
   <li><code className="text-crm-primary font-bold">{"${reviews}"}</code> - Shows all shop reviews and an interactive "Leave a Review" form.</li>
   <li><code className="text-crm-primary font-bold">{"${contact}"}</code> - Displays a beautiful map, hours, and contact details.</li>
   </ul>
   </div>
   {error && (
   <div className="bg-status-cancelled/10 border border-status-cancelled text-status-cancelled p-4 rounded-lg mb-6 text-[13px]">
   {error}
   </div>
   )}
   {success && (
   <div className="bg-status-confirmed/10 border border-status-confirmed text-status-confirmed p-4 rounded-lg mb-6 text-[13px]">
   Pages saved successfully!
   </div>
   )}
   {pages.length === 0 ? (
   <div className="text-crm-muted bg-crm-surface p-6 rounded-lg text-center">
   No custom pages found. Create one to add to your shop portal menu.
   </div>
   ) : (
   <div className="space-y-6">
   {pages.map((page, index) => (
   <div key={page.id} className="bg-crm-surface p-6 rounded-lg border border-crm-border shadow-sm">
   <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-start mb-4">
   <h3 className="font-bold text-crm-text text-lg font-bold">Page {index + 1}</h3>
   
   <div className="flex gap-4">
   <button
   onClick={() => moveUp(index)}
   disabled={index === 0}
   className="text-crm-muted hover:text-crm-text disabled:opacity-30 transition-colors text-[13px]"
   title="Move Up"
   >
   ⬆️ Move Up
   </button>
   <button
   onClick={() => moveDown(index)}
   disabled={index === pages.length - 1}
   className="text-crm-muted hover:text-crm-text disabled:opacity-30 transition-colors text-[13px]"
   title="Move Down"
   >
   ⬇️ Move Down
   </button>
   <button
   onClick={() => removePage(index)}
   className="text-status-cancelled hover:opacity-80 text-[13px] font-bold"
   >
   🗑️ Remove
   </button>
   </div>

   </div>
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
   <div>
   <label className="block font-medium text-crm-muted mb-1 text-[13px]">Title (Menu Label)</label>
   <input
   type="text"
   value={page.title}
   onChange={(e) => updatePage(index, 'title', e.target.value)}
   className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text"
   />
   </div>
   <div>
   <label className="block font-medium text-crm-muted mb-1 text-[13px]">URL Slug / ID</label>
   <input
   type="text"
   value={page.id}
   onChange={(e) => updatePage(index, 'id', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
   className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text"
   />
   </div>
   </div>
   
   <div className="mb-4">
   <label className="block font-medium text-crm-muted mb-1 text-[13px]">Content</label>
   <div className="border border-crm-border rounded-t-lg bg-crm-surface px-3 py-2 flex flex-wrap gap-2 items-center">
   <button type="button" onClick={() => applyFormat(index, page.id, '<strong>', '</strong>')} className="px-2 py-1 bg-crm-bg border border-crm-border rounded hover:bg-crm-border text-[12px] font-bold" title="Bold">B</button>
   <button type="button" onClick={() => applyFormat(index, page.id, '<em>', '</em>')} className="px-2 py-1 bg-crm-bg border border-crm-border rounded hover:bg-crm-border text-[12px] italic" title="Italic">I</button>
   <button type="button" onClick={() => applyFormat(index, page.id, '<u>', '</u>')} className="px-2 py-1 bg-crm-bg border border-crm-border rounded hover:bg-crm-border text-[12px] underline" title="Underline">U</button>
   <span className="w-px h-4 bg-crm-border mx-1"></span>
   <button type="button" onClick={() => applyFormat(index, page.id, '<h2>', '</h2>')} className="px-2 py-1 bg-crm-bg border border-crm-border rounded hover:bg-crm-border text-[12px] font-bold" title="Heading 2">H2</button>
   <button type="button" onClick={() => applyFormat(index, page.id, '<h3>', '</h3>')} className="px-2 py-1 bg-crm-bg border border-crm-border rounded hover:bg-crm-border text-[12px] font-bold" title="Heading 3">H3</button>
   <button type="button" onClick={() => applyFormat(index, page.id, '<p>', '</p>')} className="px-2 py-1 bg-crm-bg border border-crm-border rounded hover:bg-crm-border text-[12px]" title="Paragraph">P</button>
   <span className="w-px h-4 bg-crm-border mx-1"></span>
   <button type="button" onClick={() => applyFormat(index, page.id, '<ul>\n <li>', '</li>\n</ul>')} className="px-2 py-1 bg-crm-bg border border-crm-border rounded hover:bg-crm-border text-[12px]" title="Bulleted List">• List</button>
   <button type="button" onClick={() => applyFormat(index, page.id, '<br />', '')} className="px-2 py-1 bg-crm-bg border border-crm-border rounded hover:bg-crm-border text-[12px]" title="Line Break">↵ Br</button>
   <button type="button" onClick={() => {
   const url = prompt('Enter link URL:', 'https://');
   if (url) applyFormat(index, page.id, `<a href="${url}" target="_blank" className="text-crm-primary underline">`, '</a>');
   }} className="px-2 py-1 bg-crm-bg border border-crm-border rounded hover:bg-crm-border text-[12px]" title="Link">🔗 Link</button>
   </div>
   <textarea
   id={`textarea-${page.id}`}
   value={page.content}
   onChange={(e) => updatePage(index, 'content', e.target.value)}
   rows={8}
   className="w-full bg-crm-bg border-x border-b border-t-0 border-crm-border shadow-sm rounded-b-lg px-4 py-3 text-crm-text text-[13px] leading-relaxed font-mono"
   placeholder="Enter HTML or plain text here. Use the buttons above to format..."
   />
   </div>

   <div className="flex items-center gap-2">
   <input
   type="checkbox"
   id={`visible-${page.id}`}
   checked={page.isVisible}
   onChange={(e) => updatePage(index, 'isVisible', e.target.checked)}
   className="w-4 h-4 rounded border-crm-border text-crm-accent focus:ring-crm-primary bg-crm-bg"
   />
   <label htmlFor={`visible-${page.id}`} className="text-crm-muted text-[13px]">
   Visible in public menu
   </label>
   </div>
   </div>
   ))}
   
   <button
   onClick={handleSave}
   disabled={isLoading}
   className="w-full bg-crm-primary text-white hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 disabled:opacity-50 font-bold py-3 rounded-lg transition-colors"
   >
   {isLoading ? 'Saving...' : 'Save Pages'}
   </button>
   </div>
   )}
  </div>
 );
}
