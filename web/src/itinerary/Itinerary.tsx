const DAYS = [
  { day: 'Day 1, Friday 6 March', items: ['08:15 Train Gdańsk to Kraków, coach 7, seat 42', '15:30 Check in at Hotel Wawel'], link: ['Hotel website', 'https://hotel-wawel.example/'] },
  { day: 'Day 2, Saturday 7 March', items: ['10:00 Guided tour of the Old Town', '19:00 Dinner at Pod Baranami'], link: ['Tour details', 'https://tours.example/old-town'] },
  { day: 'Day 3, Sunday 8 March', items: ['11:00 Check out', '16:45 Train Kraków to Gdańsk, coach 3, seat 18'], link: ['Rail timetable', 'https://rail.example/timetable'] },
];

export function Itinerary() {
  return (
    <section className="itinerary">
      <h1>Itinerary</h1>
      <p className="booking-ref">
        Booking reference: <strong>KRK-4821</strong>
      </p>
      <p className="no-print">
        <button type="button" onClick={() => window.print()}>
          Print itinerary
        </button>
      </p>
      {DAYS.map((d) => (
        <article className="day" key={d.day} aria-label={d.day}>
          <h2>{d.day}</h2>
          <ul>
            {d.items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
          <p>
            <a href={d.link[1]}>{d.link[0]}</a>
          </p>
        </article>
      ))}
      <p className="trip-total">Total paid: 1,284.00 PLN</p>
    </section>
  );
}
