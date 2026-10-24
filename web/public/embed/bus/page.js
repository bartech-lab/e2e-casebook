const sandbox = new URLSearchParams(location.search).get('sandbox');
const note = document.getElementById('note');
const list = document.getElementById('list');

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

fetch(`/api/s/${sandbox}/bus`)
  .then(async (res) => {
    if (!res.ok) throw new Error(String(res.status));
    const { departures } = await res.json();
    list.replaceChildren(
      ...departures.map((d) => {
        const li = document.createElement('li');
        li.textContent = `${d.time} line ${d.line} to ${d.to}`;
        return li;
      }),
    );
    const saved = res.headers.get('x-saved-at');
    note.textContent = saved ? `Offline: showing the times saved at ${saved}.` : '';
  })
  .catch(() => {
    note.textContent = 'Departures are not available right now.';
  });
