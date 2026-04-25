const fs = require('fs');
const file = 'components/shop-admin/CustomPagesForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add moveUp and moveDown functions
const functions = `
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
`;

content = content.replace(
  '  const removePage = (index: number) => {',
  functions + '\n  const removePage = (index: number) => {'
);

// Add the buttons to the UI
const buttonUI = `
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
`;

content = content.replace(
  /<button\s*onClick=\{\(\) => removePage\(index\)\}\s*className="text-status-cancelled hover:text-status-cancelled text-\[13px\]"\s*>\s*Remove\s*<\/button>/g,
  buttonUI
);

// Also add a little tip for the tags
const tipHtml = `
      <div className="bg-crm-surface border border-crm-border p-4 rounded-xl shadow-sm mb-6 text-[13px] text-crm-muted">
         <h4 className="font-bold text-crm-text mb-2">💡 Dynamic Smart Tags</h4>
         <p className="mb-2">Type these tags exactly as shown anywhere in your page content to automatically generate stunning, theme-aware widgets:</p>
         <ul className="list-disc pl-5 space-y-1">
           <li><code className="text-crm-primary font-bold">\${services}</code> - Renders your service menu and "Book" buttons.</li>
           <li><code className="text-crm-primary font-bold">\${products}</code> - Renders your sellable retail products.</li>
           <li><code className="text-crm-primary font-bold">\${team}</code> - Renders a grid of your staff members with their bios.</li>
           <li><code className="text-crm-primary font-bold">\${gallery}</code> - Displays a masonry gallery of your portfolio images.</li>
           <li><code className="text-crm-primary font-bold">\${reviews}</code> - Shows all shop reviews and an interactive "Leave a Review" form.</li>
           <li><code className="text-crm-primary font-bold">\${contact}</code> - Displays a beautiful map, hours, and contact details.</li>
         </ul>
      </div>
`;

content = content.replace(
  '{error && (',
  tipHtml + '\n\n      {error && ('
);

fs.writeFileSync(file, content);
console.log('Updated CustomPagesForm with Move Up/Down and tag tips');
