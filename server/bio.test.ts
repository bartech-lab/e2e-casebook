import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';
import { sanitize } from './bio.ts';

test('sanitize keeps formatting and safe links', () => {
  assert.equal(sanitize('<p>I <b>love</b> <em>it</em><br></p>'), '<p>I <b>love</b> <em>it</em><br></p>');
  assert.equal(sanitize('<a href="https://example.com/?a=1&b=2">x</a>'), '<a href="https://example.com/?a=1&amp;b=2" rel="noopener noreferrer">x</a>');
  assert.equal(sanitize('<DIV>a</DIV>'), '<div>a</div>');
});

test('sanitize removes scripts, handlers, unsafe links and unknown tags', () => {
  assert.equal(sanitize('a<script>alert(1)</script>b'), 'ab');
  assert.equal(sanitize('a<SCRIPT src=x>'), 'a');
  assert.equal(sanitize('<style>p{}</style>x'), 'x');
  assert.equal(sanitize('<b onmouseover="alert(1)">x</b>'), '<b>x</b>');
  assert.equal(sanitize('<a href="javascript:alert(1)">x</a>'), '<a>x</a>');
  assert.equal(sanitize('<a href=" JAVASCRIPT:alert(1)">x</a>'), '<a>x</a>');
  assert.equal(sanitize("<a onclick='x' href='https://a.example'>x</a>"), '<a href="https://a.example" rel="noopener noreferrer">x</a>');
  assert.equal(sanitize('<img src=x onerror=alert(1)>y'), 'y');
  assert.equal(sanitize('<a href="https://a.example" title="x>y">z</a>'), '<a href="https://a.example" rel="noopener noreferrer">y"&gt;z</a>');
  assert.equal(sanitize('1 < 2 > 0 <!-- c -->'), '1 &lt; 2 &gt; 0 ');
  assert.equal(sanitize('<a href="https://a.example/&quot;onclick=&quot;x">q</a>'), '<a href="https://a.example/&quot;onclick=&quot;x" rel="noopener noreferrer">q</a>');
});

test('bio: saved sanitized, validated, reset clears', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const put = (payload: object) => app.inject({ method: 'PUT', url: `/api/s/${sb}/bio`, payload });
  const get = async () => (await app.inject({ method: 'GET', url: `/api/s/${sb}/bio` })).json().html;
  assert.equal(await get(), '');
  const saved = await put({ html: '<b onclick="x">Hi</b><script>1</script>' });
  assert.deepEqual(saved.json(), { html: '<b>Hi</b>' });
  assert.equal(await get(), '<b>Hi</b>');
  assert.equal((await put({ html: 'x'.repeat(5001) })).statusCode, 400);
  assert.equal((await put({})).statusCode, 400);
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.equal(await get(), '');
});
