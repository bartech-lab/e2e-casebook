import { useEffect, useRef, useState, type FormEvent } from 'react';
import { HttpError, json, sendJson } from '../http.ts';

type Question = { q: string; a: string };
type Post = { id: number; title: string; pinned: boolean };

export function PostEditor({ sandbox }: { sandbox: string }) {
  const url = `/api/s/${sandbox}/posts`;
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [faq, setFaq] = useState<Question[]>([{ q: '', a: '' }]);
  const [pinned, setPinned] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [status, setStatus] = useState('');
  const lastQuestion = useRef<HTMLInputElement>(null);
  const added = useRef(false);

  useEffect(() => {
    void (async () => setPosts((await json<{ posts: Post[] }>(await fetch(url))).posts))();
  }, [url]);

  useEffect(() => {
    if (!added.current) return;
    added.current = false;
    lastQuestion.current?.focus();
  }, [faq.length]);

  const setQuestion = (i: number, part: keyof Question, value: string) =>
    setFaq((list) => list.map((x, j) => (j === i ? { ...x, [part]: value } : x)));

  async function publish(e?: FormEvent) {
    e?.preventDefault();
    try {
      const post = await json<Post>(await fetch(url, sendJson('POST', { title, body, faq, pinned })));
      setPosts((list) => [...list, post]);
      setStatus(`Published "${post.title}".`);
      setTitle('');
      setBody('');
      setFaq([{ q: '', a: '' }]);
      setPinned(false);
    } catch (err) {
      setStatus(err instanceof HttpError ? err.message : 'Could not publish. Try again.');
    }
  }

  return (
    <section>
      <h1>Post editor</h1>
      <div className="editor-layout">
        <aside className="editor-side" aria-label="Your posts">
          <h2>Your posts</h2>
          <ul>
            {posts.map((p) => (
              <li key={p.id}>
                {p.title}
                {p.pinned && ' (pinned)'}
              </li>
            ))}
          </ul>
        </aside>
        <div className="editor-panel" data-testid="editor-panel">
          <form onSubmit={(e) => void publish(e)} aria-label="New post">
            <label>
              Title <input value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label>
              Body <textarea rows={14} value={body} onChange={(e) => setBody(e.target.value)} />
            </label>
            <fieldset>
              <legend>Questions and answers</legend>
              {faq.map((x, i) => (
                <div key={i} className="faq-row">
                  <label>
                    Question {i + 1}{' '}
                    <input ref={i === faq.length - 1 ? lastQuestion : undefined} value={x.q} onChange={(e) => setQuestion(i, 'q', e.target.value)} />
                  </label>
                  <label>
                    Answer {i + 1} <input value={x.a} onChange={(e) => setQuestion(i, 'a', e.target.value)} />
                  </label>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  added.current = true;
                  setFaq((list) => [...list, { q: '', a: '' }]);
                }}
              >
                Add question
              </button>
            </fieldset>
            <fieldset>
              <legend>Publishing</legend>
              <label>
                <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> Pin to the top of the blog
              </label>
            </fieldset>
            <button type="submit">Publish</button>
          </form>
        </div>
      </div>
      <p role="status">{status}</p>
    </section>
  );
}
