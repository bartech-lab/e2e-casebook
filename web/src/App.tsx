import { useEffect, useState } from 'react';
import { ChatRoom } from './chat/ChatRoom.tsx';
import { Landing } from './Landing.tsx';

export function navigate(path: string) {
  history.pushState(null, '', path);
  dispatchEvent(new PopStateEvent('popstate'));
}

export function App() {
  const [path, setPath] = useState(location.pathname);

  useEffect(() => {
    const onPop = () => setPath(location.pathname);
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);

  const sandbox = /^\/s\/([a-z0-9]+)\/?$/.exec(path)?.[1];
  return <main>{sandbox ? <ChatRoom key={sandbox} sandbox={sandbox} /> : <Landing />}</main>;
}
