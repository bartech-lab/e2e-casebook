export function PayslipsLink({ sandbox }: { sandbox: string }) {
  return (
    <section>
      <h1>Payslips</h1>
      <p>Payslips is a separate site with its own sign-in. Try it as alice or bob, password payday.</p>
      <p>
        <a href={`/embed/pay/${sandbox}/`}>Open Payslips</a>
      </p>
    </section>
  );
}
