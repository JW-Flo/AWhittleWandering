import { useEffect } from 'react';

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | A Whittle Wandering` : 'A Whittle Wandering';
    return () => { document.title = prev; };
  }, [title]);
}
