const params = new URLSearchParams(location.search);
const sandbox = params.get('sandbox');
const state = params.get('state');

const reply = (message) => window.opener?.postMessage({ type: 'cloudpix', state, ...message }, location.origin);

document.getElementById('allow').addEventListener('click', async () => {
  const res = await fetch(`/api/s/${sandbox}/cloudpix/codes`, { method: 'POST' });
  const { code } = await res.json();
  reply({ code });
});

document.getElementById('deny').addEventListener('click', () => reply({ error: 'denied' }));
