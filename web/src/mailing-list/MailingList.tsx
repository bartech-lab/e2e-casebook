import { useEffect } from 'react';

export function MailingList() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/embed/newsletter.js';
    document.body.append(script);
    return () => script.remove();
  }, []);

  return (
    <section>
      <h1>Mailing list</h1>
      <p>Get our weekly news by email. The form below comes from the mailing service.</p>
      <form id="nl-form" className="nl-form" aria-label="Newsletter" noValidate>
        <fieldset disabled>
          <legend>Newsletter</legend>
          <label>
            Email <input name="email" type="email" autoComplete="email" />
          </label>
          <div className="nl-topics" />
          <p id="nl-error" className="nl-error" role="alert" />
          <button type="submit">Subscribe</button>
        </fieldset>
        <p id="nl-note" role="status">
          Loading the sign-up form…
        </p>
      </form>
    </section>
  );
}
