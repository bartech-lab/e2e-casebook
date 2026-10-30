export function CloseAccountLink({ sandbox }: { sandbox: string }) {
  return (
    <section>
      <h1>Close account</h1>
      <p>Closing an account happens on its own page, which other sites must not be able to show in a frame.</p>
      <p>
        <a href={`/embed/account/${sandbox}/`}>Open the Close account page</a>
      </p>
      <iframe title="Close account preview" src={`/embed/account/${sandbox}/`} className="close-account-preview" />
    </section>
  );
}
