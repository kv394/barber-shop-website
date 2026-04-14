import { useState } from 'react';
import { Customization } from '@/lib/templates';

interface EditorialCustomizationFormProps {
  shopId: string;
  customization: Customization;
  onUpdate: (field: string, value: any) => void;
}

export function EditorialCustomizationForm({ shopId, customization, onUpdate }: EditorialCustomizationFormProps) {
  const editorial = customization.editorialCustomization || {} as any;

  const handleChange = (key: string, value: any) => {
    onUpdate('editorialCustomization', {
      ...editorial,
      [key]: value
    });
  };

  return (
    <div className="space-y-6 mt-8 border-t border-botanical-border pt-8">
      <h3 className="text-xl font-bold text-botanical-text mb-4">Editorial Template Settings</h3>
      
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-botanical-muted mb-2">Hero Tagline</label>
          <input
            type="text"
            value={editorial.heroTagline || ''}
            onChange={(e) => handleChange('heroTagline', e.target.value)}
            className="w-full bg-botanical-bg border border-botanical-border shadow-sm rounded px-4 py-2 text-botanical-text"
            placeholder="Editorial Excellence"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-botanical-muted mb-2">Hero Title (Use &lt;br/&gt; for newlines, &lt;span class="italic text-primary"&gt; for italics)</label>
          <input
            type="text"
            value={editorial.heroTitle || ''}
            onChange={(e) => handleChange('heroTitle', e.target.value)}
            className="w-full bg-botanical-bg border border-botanical-border shadow-sm rounded px-4 py-2 text-botanical-text"
            placeholder="Your Sanctuary of Sophisticated Care"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-botanical-muted mb-2">Hero Subtitle</label>
          <textarea
            value={editorial.heroSubtitle || ''}
            onChange={(e) => handleChange('heroSubtitle', e.target.value)}
            className="w-full bg-botanical-bg border border-botanical-border shadow-sm rounded px-4 py-2 text-botanical-text h-24"
            placeholder="Experience beauty as an art form..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-botanical-muted mb-2">Hero Image URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={editorial.heroImage || ''}
              onChange={(e) => handleChange('heroImage', e.target.value)}
              className="flex-1 w-full bg-botanical-bg border border-botanical-border shadow-sm rounded px-4 py-2 text-botanical-text"
            />
            <input 
              type="file" 
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const fd = new FormData();
                  fd.append('file', file);
                  fd.append('type', 'editorial');
                  const res = await fetch(`/api/shops/${shopId}/upload`, { method: 'POST', body: fd });
                  const data = await res.json();
                  if (data.error) throw new Error(data.error);
                  handleChange('heroImage', data.url);
                } catch (err: any) {
                  alert('Upload failed: ' + err.message);
                }
              }} 
              className="flex-1 bg-botanical-surface border border-botanical-border shadow-sm rounded px-3 py-2 text-botanical-text text-sm focus:outline-none focus:border-brand-gold file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:bg-botanical-primary/20 file:text-botanical-primary hover:file:bg-botanical-primary/30" 
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-botanical-muted mb-2">Services Title</label>
          <input
            type="text"
            value={editorial.servicesTitle || ''}
            onChange={(e) => handleChange('servicesTitle', e.target.value)}
            className="w-full bg-botanical-bg border border-botanical-border shadow-sm rounded px-4 py-2 text-botanical-text"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-botanical-muted mb-2">Services Subtitle</label>
          <textarea
            value={editorial.servicesSubtitle || ''}
            onChange={(e) => handleChange('servicesSubtitle', e.target.value)}
            className="w-full bg-botanical-bg border border-botanical-border shadow-sm rounded px-4 py-2 text-botanical-text h-24"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-botanical-muted mb-2">Gallery Title</label>
          <input
            type="text"
            value={editorial.galleryTitle || ''}
            onChange={(e) => handleChange('galleryTitle', e.target.value)}
            className="w-full bg-botanical-bg border border-botanical-border shadow-sm rounded px-4 py-2 text-botanical-text"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-botanical-muted mb-2">Gallery Subtitle</label>
          <input
            type="text"
            value={editorial.gallerySubtitle || ''}
            onChange={(e) => handleChange('gallerySubtitle', e.target.value)}
            className="w-full bg-botanical-bg border border-botanical-border shadow-sm rounded px-4 py-2 text-botanical-text"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-botanical-muted mb-2">Gallery Image URLs (Comma separated)</label>
          <textarea
            value={(editorial.galleryImages || []).join(',\n')}
            onChange={(e) => handleChange('galleryImages', e.target.value.split(',').map((s: string) => s.trim()))}
            className="w-full bg-botanical-bg border border-botanical-border shadow-sm rounded px-4 py-2 text-botanical-text h-32"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-botanical-muted mb-2">Testimonials Title</label>
          <input
            type="text"
            value={editorial.testimonialsTitle || ''}
            onChange={(e) => handleChange('testimonialsTitle', e.target.value)}
            className="w-full bg-botanical-bg border border-botanical-border shadow-sm rounded px-4 py-2 text-botanical-text"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-botanical-muted mb-2">Testimonials (JSON format)</label>
          <textarea
            value={JSON.stringify(editorial.testimonials || [], null, 2)}
            onChange={(e) => {
              try {
                handleChange('testimonials', JSON.parse(e.target.value));
              } catch (err) {
                // Ignore invalid JSON while typing
              }
            }}
            className="w-full bg-botanical-bg border border-botanical-border shadow-sm rounded px-4 py-2 text-botanical-text h-48 font-mono text-sm"
            placeholder='[ { "quote": "...", "author": "...", "role": "..." } ]'
          />
          <p className="text-xs text-botanical-muted mt-1">Please provide valid JSON array of objects with quote, author, and role.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-botanical-muted mb-2">Visit Us Title</label>
          <input
            type="text"
            value={editorial.visitUsTitle || ''}
            onChange={(e) => handleChange('visitUsTitle', e.target.value)}
            className="w-full bg-botanical-bg border border-botanical-border shadow-sm rounded px-4 py-2 text-botanical-text"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-botanical-muted mb-2">Map Image URL</label>
          <input
            type="text"
            value={editorial.mapImageUrl || ''}
            onChange={(e) => handleChange('mapImageUrl', e.target.value)}
            className="w-full bg-botanical-bg border border-botanical-border shadow-sm rounded px-4 py-2 text-botanical-text"
          />
        </div>
      </div>
    </div>
  );
}
