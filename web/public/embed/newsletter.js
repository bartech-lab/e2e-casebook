(async () => {
  const form = document.getElementById('nl-form');
  if (!form || form.dataset.wired) return;
  form.dataset.wired = '1';
  const email = form.querySelector('input[name="email"]');
  const box = form.querySelector('.nl-topics');
  const note = document.getElementById('nl-note');
  const error = document.getElementById('nl-error');
  const topics = await (await fetch('/embed/newsletter.json')).json();
  email.value = '';
  box.replaceChildren(
    ...topics.map((t) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'topic';
      input.value = t.id;
      input.checked = t.default;
      label.append(input, ' ' + t.label);
      return label;
    }),
  );
  const valid = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
  const message = 'Enter an email address like name@example.com.';
  email.addEventListener('input', () => {
    if (valid()) error.textContent = '';
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!valid()) {
      error.textContent = message;
      email.focus();
      return;
    }
    error.textContent = '';
    const chosen = topics.filter((t) => form.querySelector(`input[value="${t.id}"]`).checked).map((t) => t.label);
    note.textContent = chosen.length ? `Subscribed ${email.value.trim()} to ${chosen.join(' and ')}.` : 'Choose at least one topic.';
  });
  note.textContent = '';
  form.querySelector('fieldset').disabled = false;
  form.dataset.ready = '1';
})();
