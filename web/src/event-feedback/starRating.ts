const MAX = 5;

class StarRating extends HTMLElement {
  static formAssociated = true;
  private internals = this.attachInternals();
  private value = 0;
  private disabled = false;
  private stars: HTMLSpanElement[] = [];

  connectedCallback() {
    if (this.stars.length) return;
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>
      :host { display: inline-flex; gap: 2px; font-size: 1.6rem; cursor: pointer; border-radius: 6px; padding: 2px 4px; }
      :host(:focus-visible) { outline: 2px solid #4f5bd5; }
      :host([data-disabled]) { opacity: 0.5; cursor: default; }
      span { color: #c4c9d6; } span.on { color: #e3a008; }
    </style>`;
    for (let i = 1; i <= MAX; i++) {
      const star = document.createElement('span');
      star.textContent = '★';
      star.dataset.star = String(i);
      star.setAttribute('aria-hidden', 'true');
      star.addEventListener('click', () => this.set(i));
      root.append(star);
      this.stars.push(star);
    }
    this.tabIndex = 0;
    this.internals.role = 'slider';
    this.internals.ariaLabel = this.getAttribute('label') ?? 'Rating';
    this.internals.ariaValueMin = '0';
    this.internals.ariaValueMax = String(MAX);
    this.addEventListener('keydown', (e) => {
      const next = { ArrowRight: this.value + 1, ArrowUp: this.value + 1, ArrowLeft: this.value - 1, ArrowDown: this.value - 1, Home: 1, End: MAX }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      this.set(Math.min(MAX, Math.max(1, next)));
    });
    this.render();
  }

  private set(v: number) {
    if (this.disabled) return;
    this.value = v;
    this.render();
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  private render() {
    this.stars.forEach((s, i) => s.classList.toggle('on', i < this.value));
    this.internals.ariaValueNow = String(this.value);
    this.internals.ariaValueText = this.value ? `${this.value} of ${MAX} stars` : 'No rating';
    this.internals.setFormValue(this.value ? String(this.value) : null);
    if (this.hasAttribute('required') && !this.value) this.internals.setValidity({ valueMissing: true }, 'Choose a rating.');
    else this.internals.setValidity({});
  }

  get validationMessage() {
    return this.internals.validationMessage;
  }

  formResetCallback() {
    this.value = 0;
    this.render();
  }

  formDisabledCallback(disabled: boolean) {
    this.disabled = disabled;
    this.toggleAttribute('data-disabled', disabled);
    this.tabIndex = disabled ? -1 : 0;
  }
}

if (!customElements.get('star-rating')) customElements.define('star-rating', StarRating);

export {};
