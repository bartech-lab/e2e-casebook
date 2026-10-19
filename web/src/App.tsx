import { Landing } from './Landing.tsx';
import { usePath } from './router.tsx';
import { SandboxShell } from './sandbox/SandboxShell.tsx';

export function App() {
  const path = usePath();
  const match = /^\/s\/([a-z0-9]+)(?:\/(.*?))?\/?$/.exec(path);
  return (
    <main>{match ? <SandboxShell key={match[1]} sandbox={match[1]!} page={match[2] ?? ''} /> : <Landing />}</main>
  );
}
