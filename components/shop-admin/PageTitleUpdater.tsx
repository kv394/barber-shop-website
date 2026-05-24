'use client';

import { useEffect } from 'react';

export default function PageTitleUpdater({ title, shopName }: { title?: string; shopName: string }) {
  useEffect(() => {
    if (title && shopName) {
      document.title = `${title} | ${shopName}`;
    } else if (shopName) {
      document.title = shopName;
    }
  }, [title, shopName]);

  return null;
}
