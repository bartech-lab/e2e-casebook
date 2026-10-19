import { useQuery } from '@tanstack/react-query';
import { fetchFlags, type CreateCardVariant } from './api.ts';

const STORAGE_KEY = 'variant:createCard';

function visitorVariant(): CreateCardVariant {
  const fromUrl = new URLSearchParams(location.search).get('variant');
  if (fromUrl === 'inline' || fromUrl === 'dialog') return fromUrl;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'inline' || stored === 'dialog') return stored;
  const assigned: CreateCardVariant = Math.random() < 0.5 ? 'inline' : 'dialog';
  localStorage.setItem(STORAGE_KEY, assigned);
  return assigned;
}

export function useCreateCardVariant(sandbox: string): CreateCardVariant | undefined {
  const flags = useQuery({ queryKey: ['flags', sandbox], queryFn: () => fetchFlags(sandbox), staleTime: Infinity });
  if (flags.isPending) return undefined;
  return flags.data?.createCard ?? visitorVariant();
}
