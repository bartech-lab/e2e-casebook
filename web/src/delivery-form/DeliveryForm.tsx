import { useState } from 'react';

const OPTIONS = [
  { id: 'locker', name: 'Parcel locker', when: 'Tomorrow, after 10:00', price: '9.99 PLN' },
  { id: 'courier', name: 'Courier to your door', when: 'Tomorrow, 08:00 to 18:00', price: '16.99 PLN' },
  { id: 'pickup', name: 'Pick up in the shop', when: 'Today, from 15:00', price: 'Free' },
];

export function DeliveryForm() {
  const [option, setOption] = useState('locker');
  const [sent, setSent] = useState(false);

  return (
    <section className="reflow">
      <h1>Delivery details</h1>
      <p>
        We send updates to <strong className="reflow-email">aleksandra.szczepanska-wisniewska@przykladowa-firma.example</strong>.
      </p>
      <form
        className="reflow-form"
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
        }}
      >
        <label htmlFor="reflow-name">Full name</label>
        <input id="reflow-name" autoComplete="name" />
        <label htmlFor="reflow-street">Street and number</label>
        <input id="reflow-street" autoComplete="street-address" />
        <label htmlFor="reflow-city">City</label>
        <input id="reflow-city" autoComplete="address-level2" />
        <fieldset className="reflow-options">
          <legend>Delivery option</legend>
          <table className="reflow-table">
            <thead>
              <tr>
                <th scope="col">Option</th>
                <th scope="col">When</th>
                <th scope="col">Price</th>
              </tr>
            </thead>
            <tbody>
              {OPTIONS.map((o) => (
                <tr key={o.id}>
                  <td>
                    <label>
                      <input type="radio" name="option" checked={option === o.id} onChange={() => setOption(o.id)} /> {o.name}
                    </label>
                  </td>
                  <td>{o.when}</td>
                  <td>{o.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </fieldset>
        <button type="submit" className="reflow-continue">
          Continue to payment
        </button>
      </form>
      <p role="status">{sent ? 'Delivery details saved.' : ''}</p>
    </section>
  );
}
