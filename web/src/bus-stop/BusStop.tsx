export function BusStop({ sandbox }: { sandbox: string }) {
  return (
    <section>
      <h1>Bus stop</h1>
      <p>The departures board for the Racławicka stop is a separate page that keeps working offline once you have opened it.</p>
      <p>
        <a href={`/embed/bus/?sandbox=${sandbox}`}>Open the departures board</a>
      </p>
    </section>
  );
}
