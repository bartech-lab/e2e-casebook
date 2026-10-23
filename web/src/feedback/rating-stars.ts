const STAR = 32;

class RatingStars extends HTMLElement {
  #root: ShadowRoot;
  #value = 0;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: 'closed' });
    this.#root.innerHTML = `
      <style>
        :host { display: inline-block; cursor: pointer; }
        :host(:focus-visible) { outline: 2px solid #4f5bd5; outline-offset: 2px; border-radius: 4px; }
        .stars { display: flex; }
        span { width: ${STAR}px; height: ${STAR}px; font-size: 28px; line-height: ${STAR}px; text-align: center; color: #c4c9d6; user-select: none; }
        span.on { color: #e3a008; }
      </style>
      <div class="stars">${'<span>★</span>'.repeat(5)}</div>`;
    this.#root.querySelector('.stars')!.addEventListener('click', (e) => {
      const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
      this.#set(Math.min(5, Math.floor(((e as MouseEvent).clientX - box.left) / STAR) + 1));
    });
    this.addEventListener('keydown', (e) => {
      const next = { ArrowRight: this.#value + 1, ArrowUp: this.#value + 1, ArrowLeft: this.#value - 1, ArrowDown: this.#value - 1, Home: 1, End: 5 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      this.#set(Math.max(1, Math.min(5, next)));
    });
  }

  connectedCallback() {
    this.setAttribute('role', 'slider');
    this.setAttribute('tabindex', '0');
    this.setAttribute('aria-valuemin', '1');
    this.setAttribute('aria-valuemax', '5');
    this.#render();
  }

  get value() {
    return this.#value;
  }

  set value(v: number) {
    this.#value = v;
    this.#render();
  }

  #set(v: number) {
    if (v === this.#value) return;
    this.value = v;
    this.#root.querySelector('.stars')!.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  #render() {
    this.setAttribute('aria-valuenow', String(this.#value));
    this.setAttribute('aria-valuetext', this.#value ? `${this.#value} of 5 stars` : 'No rating');
    this.#root.querySelectorAll('span').forEach((s, i) => s.classList.toggle('on', i < this.#value));
  }
}

if (!customElements.get('rating-stars')) customElements.define('rating-stars', RatingStars);

export type { RatingStars };
