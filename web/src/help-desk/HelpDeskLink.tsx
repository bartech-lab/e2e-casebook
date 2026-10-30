export function HelpDeskLink({ sandbox }: { sandbox: string }) {
  return (
    <section>
      <h1>Help desk</h1>
      <p>The help desk is a separate page with a strict security policy and a chat you can open.</p>
      <p>
        <a href={`/embed/help/${sandbox}/`}>Open the help desk</a>
      </p>
    </section>
  );
}
