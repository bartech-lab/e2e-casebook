export type Consent = 'all' | 'necessary';

const key = (sandbox: string) => `consent:${sandbox}`;

export function readConsent(sandbox: string): Consent | null {
  const value = localStorage.getItem(key(sandbox));
  return value === 'all' || value === 'necessary' ? value : null;
}

const TEMPLATE = `
<style>
  :host { display: block; margin: 1rem 0; border: 1px solid #ccc; border-radius: 4px; padding: 0.75rem 1rem; background: #fafafa; }
  :host([hidden]) { display: none; }
  button { margin-right: 0.5rem; }
</style>
<section role="region" aria-label="Cookie consent">
  <p>We use cookies to pick deals for you. Choose what we may store.</p>
  <button type="button" data-choice="all">Accept all</button>
  <button type="button" data-choice="necessary">Only necessary</button>
</section>`;

export class ConsentBanner extends HTMLElement {
  #root = this.attachShadow({ mode: 'closed' });

  connectedCallback() {
    this.#root.innerHTML = TEMPLATE;
    for (const button of this.#root.querySelectorAll<HTMLButtonElement>('button')) {
      button.addEventListener('click', () => this.#choose(button.dataset.choice as Consent));
    }
    this.hidden = readConsent(this.#sandbox) !== null;
  }

  open() {
    this.hidden = false;
  }

  get #sandbox() {
    return this.getAttribute('sandbox') ?? '';
  }

  #choose(choice: Consent) {
    localStorage.setItem(key(this.#sandbox), choice);
    this.hidden = true;
    this.dispatchEvent(new CustomEvent<Consent>('consent', { detail: choice }));
  }
}

if (!customElements.get('consent-banner')) customElements.define('consent-banner', ConsentBanner);
