export function GuestbookLink({ sandbox }: { sandbox: string }) {
  return (
    <section>
      <h1>Guestbook</h1>
      <p>The guestbook is a plain page that works without JavaScript.</p>
      <p>
        <a href={`/api/s/${sandbox}/guestbook`}>Open the guestbook</a>
      </p>
    </section>
  );
}
