const fs = require('fs');
const file = 'components/shop-admin/CustomizationForm.tsx';
let content = fs.readFileSync(file, 'utf8');

const advancedSection = `
        <div>
          <h3 className="font-bold text-crm-text mb-4 text-lg font-bold">Advanced Customization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block font-medium text-crm-muted mb-2 text-[13px]">Primary Font</label>
              <select
                value={formData.fontFamily || 'Inter'}
                onChange={(e) => handleInputChange('fontFamily', e.target.value)}
                className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text"
              >
                <option value="Inter">Inter (Modern)</option>
                <option value="Playfair Display">Playfair Display (Elegant)</option>
                <option value="Roboto">Roboto (Clean)</option>
                <option value="Oswald">Oswald (Classic)</option>
                <option value="Montserrat">Montserrat (Bold)</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-crm-muted mb-2 text-[13px]">Call to Action Text</label>
              <input
                type="text"
                value={formData.ctaText || ''}
                onChange={(e) => handleInputChange('ctaText', e.target.value)}
                placeholder="E.g., Book Now"
                className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-medium text-crm-muted mb-2 text-[13px]">Hero Video URL (.mp4 or YouTube)</label>
              <input
                type="url"
                value={formData.heroVideoUrl || ''}
                onChange={(e) => handleInputChange('heroVideoUrl', e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-crm-text mb-4 text-lg font-bold">Announcement Banner</h3>
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="announcementActive"
                checked={formData.announcement?.isActive || false}
                onChange={(e) => handleInputChange('announcement', { ...formData.announcement, isActive: e.target.checked })}
                className="w-4 h-4 accent-blue-600 bg-crm-bg border-crm-border rounded cursor-pointer"
              />
              <label htmlFor="announcementActive" className="text-crm-muted text-[13px] cursor-pointer">Enable Announcement Banner</label>
            </div>
            {formData.announcement?.isActive && (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block font-medium text-crm-muted mb-2 text-[13px]">Announcement Text</label>
                  <input
                    type="text"
                    value={formData.announcement?.text || ''}
                    onChange={(e) => handleInputChange('announcement', { ...formData.announcement, text: e.target.value })}
                    placeholder="E.g., 20% off all haircuts this week!"
                    className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-crm-muted mb-2 text-[13px]">Link URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.announcement?.url || ''}
                    onChange={(e) => handleInputChange('announcement', { ...formData.announcement, url: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-crm-text mb-4 text-lg font-bold">SEO & Social Sharing</h3>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block font-medium text-crm-muted mb-2 text-[13px]">SEO Title</label>
              <input
                type="text"
                value={formData.seo?.title || ''}
                onChange={(e) => handleInputChange('seo', { ...formData.seo, title: e.target.value })}
                placeholder="E.g., The Best Barbershop in NYC"
                className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block font-medium text-crm-muted mb-2 text-[13px]">SEO Description</label>
              <textarea
                rows={2}
                value={formData.seo?.description || ''}
                onChange={(e) => handleInputChange('seo', { ...formData.seo, description: e.target.value })}
                placeholder="Brief description for search engines..."
                className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block font-medium text-crm-muted mb-2 text-[13px]">OpenGraph Image URL</label>
              <input
                type="url"
                value={formData.seo?.ogImageUrl || ''}
                onChange={(e) => handleInputChange('seo', { ...formData.seo, ogImageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
              />
            </div>
          </div>
        </div>
`;

// Insert before the <EditorialCustomizationForm> or just before "Template Custom Variables"
const marker = "{currentTemplate === 'editorial' && (";
content = content.replace(marker, advancedSection + '\n        ' + marker);

fs.writeFileSync(file, content);
console.log('Updated CustomizationForm.tsx with advanced settings');
