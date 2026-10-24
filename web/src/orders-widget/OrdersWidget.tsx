import { useState } from 'react';

const ORDERS = [
  ['#1042', 'Anna Nowak', 'Paid', '129.00 PLN'],
  ['#1043', 'Jan Wiśniewski', 'Shipped', '59.90 PLN'],
  ['#1044', 'Maria Wójcik', 'Paid', '310.50 PLN'],
  ['#1045', 'Tomasz Kamiński', 'Refunded', '24.00 PLN'],
];

export function OrdersWidget() {
  const [filters, setFilters] = useState(false);

  return (
    <section className="ow-page">
      <h1>Shop dashboard</h1>
      <button type="button" aria-expanded={filters} aria-controls="ow-filters" onClick={() => setFilters(!filters)}>
        Filters
      </button>
      <div className={filters ? 'ow-layout with-filters' : 'ow-layout'}>
        <div className="ow-widget" role="region" aria-label="Recent orders">
          <h2>Recent orders</h2>
          <table className="ow-table">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Customer</th>
                <th scope="col">Status</th>
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {ORDERS.map(([id, customer, status, total]) => (
                <tr key={id}>
                  <td data-label="Order">{id}</td>
                  <td data-label="Customer">{customer}</td>
                  <td data-label="Status">{status}</td>
                  <td data-label="Total">{total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filters && (
          <aside id="ow-filters" className="ow-filters" aria-label="Filters">
            <h2>Filters</h2>
            <label>
              <input type="checkbox" defaultChecked /> Paid
            </label>
            <label>
              <input type="checkbox" defaultChecked /> Shipped
            </label>
            <label>
              <input type="checkbox" defaultChecked /> Refunded
            </label>
          </aside>
        )}
      </div>
    </section>
  );
}
