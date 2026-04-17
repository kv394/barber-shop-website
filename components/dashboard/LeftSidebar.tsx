import Link from 'next/link';
import React from 'react';

function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function FolderIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function LeftSidebar() {
  const categories = [
    {
      title: 'SALES OPERATIONS',
      items: [
        { label: 'Overview', href: '#', active: false, icon: HomeIcon },
        { label: 'Lead Quality', href: '#', active: true, icon: UsersIcon },
      ]
    },
    {
      title: 'WORKSPACES',
      items: [
        { label: 'My Workspace', href: '#', active: false, icon: FolderIcon },
      ]
    }
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col">
      {/* App Header */}
      <div className="p-6">
        <h1 className="text-lg font-semibold text-gray-800">SaaS App</h1>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto pb-4">
        {categories.map((category) => (
          <div key={category.title} className="mb-2">
            <h2 className="text-[10px] uppercase text-gray-400 font-bold mt-6 mb-2 px-6">
              {category.title}
            </h2>
            <ul className="space-y-1">
              {category.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-6 py-2 text-sm transition-colors border-l-4 ${
                        item.active
                          ? 'text-gray-900 font-semibold border-orange-500'
                          : 'text-gray-500 hover:text-gray-900 border-transparent'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${item.active ? 'text-gray-900' : 'text-gray-400'}`} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}