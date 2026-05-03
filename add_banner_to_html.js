const fs = require('fs');
const glob = require('glob');

const files = glob.sync('public/html-sections/*.html');

files.forEach(file => {
    if (file.includes('SportClips.html')) return; // Already has it
    
    let content = fs.readFileSync(file, 'utf8');
    
    // Add banner div if not present
    if (!content.includes('id="announcement-banner"')) {
        content = content.replace(/<body[^>]*>/, (match) => {
            return match + '\n    <div id="announcement-banner" style="background: var(--primary); color: var(--white); text-align: center; padding: 0; font-size: 0.9rem; font-weight: 700; z-index: 1001; position: relative; width: 100%; transition: all 0.3s ease; height: 0; overflow: hidden;"></div>';
        });
    }

    // Add SDK handling code if shopDetails is being initialized
    if (content.includes('BarberSaaS.getShopDetails') && !content.includes('Update Announcement Banner')) {
        // Insert right after logo logic or right after document.documentElement.style.setProperty
        const logoRegex = /document\.documentElement\.style\.setProperty\("--primary", primaryColor, "important"\);/;
        if (logoRegex.test(content)) {
            const announcementCode = `

                // Update Announcement Banner
                const announcement = shop.customization?.announcement;
                if (announcement && announcement.isActive && announcement.text) {
                  const banner = document.getElementById('announcement-banner');
                  if (banner) {
                    if (announcement.url || announcement.linkUrl) {
                       const link = announcement.url || announcement.linkUrl;
                       banner.innerHTML = \`<a href="\${link}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline; text-underline-offset: 2px;">\${announcement.text}</a>\`;
                    } else {
                       banner.textContent = announcement.text;
                    }
                    banner.style.padding = '10px';
                    banner.style.height = 'auto';
                  }
                }
`;
            content = content.replace(logoRegex, (match) => match + announcementCode);
        }
    }
    
    fs.writeFileSync(file, content, 'utf8');
});

console.log('Updated HTML files');
