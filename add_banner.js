const fs = require('fs');
const path = './app/shops/[slug]/ClientPage.tsx';

let content = fs.readFileSync(path, 'utf8');

const bannerCode = `    const announcementBanner = announcement?.isActive && announcement.text ? (
        <div className="w-full text-white text-center py-2 px-4 text-[13px] font-medium z-[100] relative" style={{ backgroundColor: primaryColor || '#000' }}>
            {announcement.linkUrl ? (
                <a href={announcement.linkUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {announcement.text}
                </a>
            ) : (
                <span>{announcement.text}</span>
            )}
        </div>
    ) : null;

`;

if (!content.includes('const announcementBanner =')) {
    content = content.replace('    // Auth button for client sign-in/out', bannerCode + '    // Auth button for client sign-in/out');
}

// Now replace <main ...> with <main ...>\n      {announcementBanner}
// We only want to insert it if not already there
content = content.replace(/(<main[^>]*>)/g, (match) => {
    return match + '\n      {announcementBanner}';
});

fs.writeFileSync(path, content, 'utf8');
console.log('Banner added successfully');
