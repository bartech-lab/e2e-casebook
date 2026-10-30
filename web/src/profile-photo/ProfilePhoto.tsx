import { useEffect, useState, type ChangeEvent } from 'react';

const SIZE = 256;

export function ProfilePhoto({ sandbox }: { sandbox: string }) {
  const [image, setImage] = useState<ImageBitmap | null>(null);
  const [turns, setTurns] = useState(0);
  const [preview, setPreview] = useState('');
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(0);

  async function choose(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    setMessage('');
    if (!file) return;
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      setMessage('That file is not a picture.');
      return;
    }
    if (Math.min(bitmap.width, bitmap.height) < SIZE) {
      setMessage(`The photo must be at least ${SIZE} × ${SIZE} pixels.`);
      return;
    }
    setImage(bitmap);
    setTurns(0);
  }

  function square() {
    const img = image!;
    const sideways = turns % 2 === 1;
    const w = sideways ? img.height : img.width;
    const h = sideways ? img.width : img.height;
    const turned = document.createElement('canvas');
    turned.width = w;
    turned.height = h;
    const t = turned.getContext('2d')!;
    t.translate(w / 2, h / 2);
    t.rotate((turns * Math.PI) / 2);
    t.drawImage(img, -img.width / 2, -img.height / 2);
    const side = Math.min(w, h);
    const out = document.createElement('canvas');
    out.width = SIZE;
    out.height = SIZE;
    out.getContext('2d')!.drawImage(turned, (w - side) / 2, (h - side) / 2, side, side, 0, 0, SIZE, SIZE);
    return out;
  }

  useEffect(() => {
    if (image) setPreview(square().toDataURL('image/png'));
  }, [image, turns]);

  async function save() {
    const blob = await new Promise<Blob>((resolve) => square().toBlob((b) => resolve(b!), 'image/png'));
    const res = await fetch(`/api/s/${sandbox}/avatar`, { method: 'PUT', headers: { 'content-type': 'image/png' }, body: blob });
    setMessage(res.ok ? 'Profile photo saved.' : 'Could not save the photo.');
    if (res.ok) setSaved((n) => n + 1);
  }

  return (
    <section>
      <h1>Profile photo</h1>
      <label>
        Choose a photo <input type="file" accept="image/*" onChange={(e) => void choose(e)} />
      </label>
      {image && (
        <div className="photo-edit">
          <img src={preview} alt="Preview of your profile photo" width={128} height={128} />
          <button type="button" onClick={() => setTurns((t) => (t + 1) % 4)}>
            Rotate right
          </button>{' '}
          <button type="button" onClick={() => void save()}>
            Save photo
          </button>
        </div>
      )}
      <p role="status">{message}</p>
      {saved > 0 && <img src={`/api/s/${sandbox}/avatar?v=${saved}`} alt="Your profile photo" width={64} height={64} />}
    </section>
  );
}
