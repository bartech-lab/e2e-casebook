import { useMutation } from '@tanstack/react-query';
import { navigate } from './App.tsx';
import { createSandbox } from './chat/api.ts';

export function Landing() {
  const start = useMutation({
    mutationFn: createSandbox,
    onSuccess: ({ id }) => navigate(`/s/${id}`),
  });

  return (
    <section>
      <h1>e2e-proving-ground</h1>
      <p>
        Hard cases for end-to-end tests, each with several test approaches and what each one costs.
        A sandbox is your own copy of the app. Share its URL to test with a second user.
      </p>
      <button type="button" onClick={() => start.mutate()} disabled={start.isPending}>
        Start a sandbox
      </button>
      {start.isError && <p role="alert">Could not start a sandbox: {start.error.message}</p>}
    </section>
  );
}
