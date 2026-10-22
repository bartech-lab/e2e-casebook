import { useState } from 'react';

type Status = 'active' | 'paused' | 'ending';
type Question = 'pause' | 'cancel';

const RENEWS = '1 December 2026';
const AFTER_PAUSE = '1 January 2027';
const planKey = (sandbox: string) => `plan:${sandbox}`;

function load(sandbox: string): Status {
  const saved = localStorage.getItem(planKey(sandbox));
  return saved === 'paused' || saved === 'ending' ? saved : 'active';
}

export function Plan({ sandbox }: { sandbox: string }) {
  const [status, setStatus] = useState(() => load(sandbox));
  const [asking, setAsking] = useState<Question | null>(null);

  function save(next: Status) {
    localStorage.setItem(planKey(sandbox), next);
    setStatus(next);
    setAsking(null);
  }

  const actions: { label: string; ask: Question }[] = [
    { label: 'Pause plan', ask: 'pause' },
  ];

  return (
    <section>
      <h1>Your plan</h1>
      <p>Pro, 49.00 PLN a month</p>
      <p>Status: {status === 'active' ? 'Active' : status === 'paused' ? 'Paused' : `Active until ${RENEWS}`}</p>
      <p>Next payment: {status === 'active' ? RENEWS : status === 'paused' ? AFTER_PAUSE : 'none'}</p>
      {asking === 'pause' ? (
        <div role="dialog" aria-modal="true" aria-labelledby="plan-question">
          <h2 id="plan-question">Pause your plan?</h2>
          <p>You skip the December payment. Your plan resumes on {AFTER_PAUSE}.</p>
          <button type="button" onClick={() => setAsking(null)}>
            Not now
          </button>{' '}
          <button type="button" onClick={() => save('paused')}>
            Pause plan
          </button>
        </div>
      ) : asking === 'cancel' ? (
        <div role="dialog" aria-modal="true" aria-labelledby="plan-question">
          <h2 id="plan-question">Cancel your plan?</h2>
          <p>You keep Pro until {RENEWS}. After that you pay nothing.</p>
          <button type="button" onClick={() => setAsking(null)}>
            Keep plan
          </button>{' '}
          <button type="button" onClick={() => save('ending')}>
            Cancel plan
          </button>
        </div>
      ) : status === 'active' ? (
        <p>
          {actions.map((a) => (
            <button key={a.ask} type="button" onClick={() => setAsking(a.ask)}>
              {a.label}
            </button>
          ))}
        </p>
      ) : (
        <p>
          <button type="button" onClick={() => save('active')}>
            Resume plan
          </button>
        </p>
      )}
    </section>
  );
}
