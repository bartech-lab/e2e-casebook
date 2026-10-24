const params = new URLSearchParams(location.search);
const sandbox = params.get('sandbox');
const amount = Number(params.get('amount'));
const form = document.getElementById('card');
const error = document.getElementById('error');

const post = (message) => parent.postMessage({ source: 'pay-frame', ...message }, location.origin);
const reportHeight = () => post({ type: 'height', px: document.documentElement.scrollHeight });

function fail(text) {
  error.textContent = text;
  error.hidden = false;
  reportHeight();
  post({ type: 'error' });
}

async function submit() {
  error.hidden = true;
  error.textContent = '';
  reportHeight();
  const number = form.number.value.replace(/\s+/g, '');
  const expiry = form.expiry.value.trim();
  const cvc = form.cvc.value.trim();
  if (!/^\d{16}$/.test(number)) return fail('Enter the 16-digit card number.');
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) return fail('Enter the expiry date as MM/YY.');
  if (!/^\d{3}$/.test(cvc)) return fail('Enter the 3-digit security code.');
  const res = await fetch(`/api/s/${sandbox}/pay/charge`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ number, expiry, cvc, amount }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return fail(body.error ?? 'The payment failed. Try again.');
  post({ type: 'paid', id: body.id });
}

form.addEventListener('submit', (e) => e.preventDefault());
addEventListener('message', (e) => {
  if (e.origin === location.origin && e.source === parent && e.data?.type === 'submit') void submit();
});
reportHeight();
