'use client';

import { useEffect }
from 'react';

type PageHeaderProps = {
  title: string;
};

export function PageHeader({ title }: PageHeaderProps) {
  useEffect(() => {
    const titleElement = document.getElementById('page-title');
    if (titleElement) {
      titleElement.textContent = title;
    }
  }, [title]);

  return null; // This component doesn't render anything itself
}
