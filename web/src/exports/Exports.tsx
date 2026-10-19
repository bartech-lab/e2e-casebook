import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { json } from '../http.ts';

type ExportJob = {
  id: number;
  status: 'running' | 'done' | 'failed' | 'cancelled';
  progress: number;
  error: string | null;
  retryOf: number | null;
};

const STATUS_TEXT: Record<ExportJob['status'], string> = {
  running: 'Running',
  done: 'Done',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export function Exports({ sandbox }: { sandbox: string }) {
  const queryClient = useQueryClient();
  const key = ['exports', sandbox];
  const base = `/api/s/${sandbox}/exports`;
  const jobs = useQuery({
    queryKey: key,
    queryFn: async () => (await json<{ exports: ExportJob[] }>(await fetch(base))).exports,
    refetchInterval: (q) => (q.state.data?.some((j) => j.status === 'running') ? 1000 : false),
  });
  const action = useMutation({
    mutationFn: async (path: string) => json<ExportJob>(await fetch(`${base}${path}`, { method: 'POST' })),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  return (
    <section>
      <h1>Exports</h1>
      <button type="button" onClick={() => action.mutate('')} disabled={action.isPending}>
        Export board as CSV
      </button>
      {action.isError && <p role="alert">Request failed: {action.error.message}</p>}
      {jobs.isError && <p role="alert">Could not load exports: {jobs.error.message}</p>}
      <ul aria-label="Exports">
        {jobs.data?.map((job) => (
          <li key={job.id} aria-label={`Export #${job.id}`}>
            <strong>Export #{job.id}</strong>
            {job.retryOf !== null && <span> (retry of #{job.retryOf})</span>}{' '}
            <span data-testid="export-status">{STATUS_TEXT[job.status]}</span>{' '}
            <progress max={100} value={job.progress} aria-label={`Export #${job.id} progress`} />{' '}
            <span>{job.progress}%</span>
            {job.error && <span role="alert"> {job.error}</span>}{' '}
            {job.status === 'running' && (
              <button type="button" onClick={() => action.mutate(`/${job.id}/cancel`)}>
                Cancel
              </button>
            )}
            {(job.status === 'failed' || job.status === 'cancelled') && (
              <button type="button" onClick={() => action.mutate(`/${job.id}/retry`)}>
                Retry
              </button>
            )}
            {job.status === 'done' && (
              <a href={`${base}/${job.id}/file`} download>
                Download CSV
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
