import { useState } from 'react';

const FARE = 4900;
const EXTRAS = [
  { id: 'seat', label: 'Reserve a seat', price: 500 },
  { id: 'insurance', label: 'Add travel insurance', price: 900 },
] as const;
type ExtraId = (typeof EXTRAS)[number]['id'];
const pln = (grosze: number) => `${(grosze / 100).toFixed(2)} PLN`;

export function TrainTicket() {
  const [step, setStep] = useState<'journey' | 'extras' | 'pay' | 'done'>('journey');
  const [chosen, setChosen] = useState<ExtraId[]>([]);
  const [offers, setOffers] = useState(false);
  const lines = [{ label: 'Ticket, Warsaw to Kraków', price: FARE }, ...EXTRAS.filter((e) => chosen.includes(e.id))];
  const total = lines.reduce((sum, l) => sum + l.price, 0);
  const totalLine = <p className="train-total">Total: {pln(total)}</p>;

  return (
    <section>
      <h1>Train ticket</h1>
      {step === 'journey' && (
        <>
          <h2>Journey</h2>
          <p>Warsaw Centralna 07:15 to Kraków Główny 09:41, Saturday 7 November.</p>
          {totalLine}
          <button type="button" onClick={() => setStep('extras')}>
            Continue
          </button>
        </>
      )}
      {step === 'extras' && (
        <>
          <h2>Extras</h2>
          <fieldset className="train-extras">
            <legend>Add to your trip</legend>
            {EXTRAS.map((e) => (
              <label key={e.id}>
                <input
                  type="checkbox"
                  checked={chosen.includes(e.id)}
                  onChange={(ev) => setChosen(ev.target.checked ? [...chosen, e.id] : chosen.filter((c) => c !== e.id))}
                />{' '}
                {e.label} (+{pln(e.price)})
              </label>
            ))}
            <label>
              <input type="checkbox" checked={offers} onChange={(ev) => setOffers(ev.target.checked)} /> Email me offers
            </label>
          </fieldset>
          {totalLine}
          <button type="button" onClick={() => setStep('journey')}>
            Back
          </button>{' '}
          <button type="button" onClick={() => setStep('pay')}>
            Continue
          </button>
        </>
      )}
      {step === 'pay' && (
        <>
          <h2>Pay</h2>
          <table className="train-lines" aria-label="Your order">
            <tbody>
              {lines.map((l) => (
                <tr key={l.label}>
                  <th scope="row">{l.label}</th>
                  <td>{pln(l.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalLine}
          <button type="button" onClick={() => setStep('extras')}>
            Back
          </button>{' '}
          <button type="button" onClick={() => setStep('done')}>
            Pay {pln(total)}
          </button>
        </>
      )}
      {step === 'done' && (
        <p role="status">
          Paid {pln(total)}. {offers ? 'We will email you offers.' : 'We will not email you offers.'}
        </p>
      )}
    </section>
  );
}
