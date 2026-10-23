import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from 'react';

type Blocker = (path: string) => boolean;

let blocker: Blocker | null = null;

export function setBlocker(next: Blocker) {
  blocker = next;
  return () => {
    if (blocker === next) blocker = null;
  };
}

export function navigate(path: string, { force = false } = {}) {
  if (!force && blocker?.(path)) return;
  history.pushState(null, '', path);
  dispatchEvent(new PopStateEvent('popstate'));
}

export function usePath() {
  const [path, setPath] = useState(location.pathname);
  useEffect(() => {
    const onPop = () => setPath(location.pathname);
    addEventListener('popstate', onPop);
    onPop();
    return () => removeEventListener('popstate', onPop);
  }, []);
  return path;
}

export function Link({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a
      href={href}
      {...rest}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        navigate(href);
      }}
    />
  );
}
