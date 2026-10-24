export function Fete({ sandbox }: { sandbox: string }) {
  return (
    <section>
      <h1>Village fête</h1>
      <p>The reply form is a plain page that the server builds.</p>
      <p>
        <a href={`/api/s/${sandbox}/rsvp`}>Reply to the invitation</a>
      </p>
    </section>
  );
}
