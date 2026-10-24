export function TrailMap({ sandbox }: { sandbox: string }) {
  return (
    <section>
      <h1>Trail map</h1>
      <p>Trail map is a separate page that opens from a saved copy, so it works offline once you have opened it. It tells you when a new version is ready.</p>
      <p>
        <a href={`/embed/trail/${sandbox}/`}>Open Trail map</a>
      </p>
    </section>
  );
}
