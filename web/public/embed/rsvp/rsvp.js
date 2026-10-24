const form = document.getElementById('rsvp');
if (form) {
  const plusOne = form.elements.plusOne;
  const guest = document.getElementById('guest');
  const note = form.elements.note;
  const count = document.getElementById('count');
  const status = document.querySelector('[role="status"]');

  const showGuest = () => {
    guest.hidden = !plusOne.checked;
  };
  const showCount = () => {
    count.textContent = `${note.value.length} of 200 characters`;
  };
  showGuest();
  showCount();
  plusOne.addEventListener('change', showGuest);
  note.addEventListener('input', showCount);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (!plusOne.checked) delete data.guestName;
    const res = await fetch(form.action, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      status.textContent = 'Enter your name.';
      return;
    }
    const { name } = await res.json();
    form.remove();
    status.textContent = `See you there, ${name}!`;
  });
}
