import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { audit } from './audit.ts';

const here = import.meta.dirname;
const appDir = resolve(process.env.APP_DIR ?? join(here, '..', '..'));
const { values } = parseArgs({
  options: {
    agent: { type: 'string', multiple: true, default: ['bonsai'] },
    case: { type: 'string', multiple: true, default: [] },
    runs: { type: 'string', default: '1' },
    'timeout-min': { type: 'string', default: '20' },
    prompt: { type: 'string', default: 'prompt.md' },
    'claude-model': { type: 'string', default: 'sonnet' },
  },
});

const CASES: Record<string, { n: number; title: string; prompt?: string; given?: string }> = {
  'optimistic-moves': { n: 3, title: 'Optimistic moves' },
  'due-dates': { n: 6, title: 'Due dates, time zones, and DST' },
  'toast-and-polling': { n: 10, title: 'A toast and a page that is never idle' },
  'checkout-total': { n: 11, title: 'Checkout total' },
  'shipping-insurance': { n: 12, title: 'Shipping insurance' },
  'product-reviews': { n: 13, title: 'Product reviews' },
  'review-editing': { n: 14, title: 'Editing a review', prompt: 'prompt-repair.md', given: 'given/review-editing' },
  'split-order': { n: 15, title: 'Splitting an order' },
  'people-picker': { n: 16, title: 'The People picker' },
  'cookie-consent': { n: 17, title: 'Cookie consent' },
  'gift-cards': { n: 18, title: 'Gift cards' },
  'notes-toolbar': { n: 19, title: 'Notes' },
  'budget-chart': { n: 20, title: 'Budget' },
  'plan-cancel': { n: 21, title: 'Your plan', prompt: 'prompt-repair-plain.md', given: 'given/plan-cancel' },
  'playlist-reorder': { n: 22, title: 'Playlist' },
  'card-topup': { n: 23, title: 'Top up' },
  'autosave-draft': { n: 24, title: 'Draft' },
  'calendar-popup': { n: 25, title: 'Calendar' },
  'contacts-import': { n: 26, title: 'Contacts' },
  'store-finder': { n: 27, title: 'Stores' },
  'locale-quote': { n: 28, title: 'Quote' },
  'booking-wizard': { n: 29, title: 'Booking' },
  'live-feed': { n: 30, title: 'Feed' },
  'offline-checklist': { n: 31, title: 'Checklist' },
  'totp-vault': { n: 32, title: 'Vault' },
  'shared-basket': { n: 33, title: 'Basket' },
  'session-expiry': { n: 34, title: 'Support' },
  'printable-receipt': { n: 35, title: 'Receipt' },
  'signup-a11y': { n: 36, title: 'Sign up' },
  'rich-bio': { n: 37, title: 'Bio' },
  'search-race': { n: 38, title: 'Search' },
  'invoice-pdf': { n: 39, title: 'Invoices' },
  'price-range': { n: 40, title: 'Price filter' },
  'reminders': { n: 41, title: 'Reminders' },
  'unsaved-address': { n: 42, title: 'Address' },
  'shadow-rating': { n: 43, title: 'Feedback' },
  'copy-link': { n: 44, title: 'Share' },
  'update-banner': { n: 45, title: 'Updates' },
  'bulk-inbox': { n: 46, title: 'Inbox' },
  'sorted-orders': { n: 47, title: 'Orders' },
  'undo-delete': { n: 48, title: 'Files' },
  'command-palette': { n: 49, title: 'Tasks' },
  'print-itinerary': { n: 50, title: 'Itinerary' },
  'rate-limit': { n: 51, title: 'Verify phone' },
  'rtl-summary': { n: 52, title: 'Order summary' },
  'shipping-form': { n: 53, title: 'Shipping address' },
  'lazy-gallery': { n: 54, title: 'Gallery' },
  'holiday-range': { n: 55, title: 'Holiday request' },
  'remember-me': { n: 56, title: 'Stay signed in' },
  'podcast-player': { n: 57, title: 'Podcast' },
  'responsive-menu': { n: 58, title: 'Bakery' },
  'idle-signout': { n: 59, title: 'Session' },
  'team-roles': { n: 60, title: 'Team' },
  'time-zones': { n: 61, title: 'Meetings' },
  'customer-directory': { n: 62, title: 'Directory' },
  'otp-input': { n: 63, title: 'Confirm email' },
  'polish-plurals': { n: 64, title: 'Messages' },
  'passkey-signin': { n: 65, title: 'Passkeys' },
  'signature-pad': { n: 66, title: 'Delivery' },
  'sse-import': { n: 67, title: 'Import' },
  'undo-redo': { n: 68, title: 'Packing list' },
  'route-focus': { n: 69, title: 'Help centre' },
  'sticky-overlap': { n: 70, title: 'Order review' },
  'worker-report': { n: 71, title: 'Sales report' },
  'upload-progress': { n: 72, title: 'Upload' },
  'paste-image': { n: 73, title: 'Support ticket' },
  'grid-keyboard': { n: 74, title: 'Timesheet' },
  'iframe-resize': { n: 75, title: 'Shop reviews' },
  'listbox-typeahead': { n: 76, title: 'Country' },
  'theme-preference': { n: 77, title: 'Appearance' },
  'statement-download': { n: 78, title: 'Statement' },
  'tooltip-hover': { n: 79, title: 'Plans' },
  'notification-permission': { n: 80, title: 'Price alerts' },
  'hidden-tab': { n: 81, title: 'Live score' },
  'swipe-delete': { n: 82, title: 'Mobile inbox' },
  'password-change': { n: 83, title: 'Change password' },
  'flash-sale': { n: 84, title: 'Flash sale' },
  'polish-collation': { n: 85, title: 'Class list' },
  'read-dwell': { n: 86, title: 'Newsletter' },
  'scroll-panel': { n: 87, title: 'Post editor' },
  'banner-transition': { n: 88, title: 'Announcements' },
  'voice-recorder': { n: 89, title: 'Voice note' },
  'etag-revalidate': { n: 90, title: 'Price list' },
  'truncated-names': { n: 91, title: 'Contributors' },
  'aria-tabs': { n: 92, title: 'Product details' },
  'aria-tree': { n: 93, title: 'Files tree' },
  'carousel-pause': { n: 94, title: 'Promotions' },
  'indexeddb-upgrade': { n: 95, title: 'Local notes' },
  'letter-undo': { n: 96, title: 'Letter' },
  'web-share': { n: 97, title: 'Recipe' },
  'fullscreen-viewer': { n: 98, title: 'Photos' },
  'reflow-320': { n: 99, title: 'Delivery details' },
  'hotel-filters': { n: 100, title: 'Hotels' },
  'touch-actions': { n: 101, title: 'Lamps' },
  'late-listeners': { n: 102, title: 'Mailing list' },
  'ime-tags': { n: 103, title: 'Trip tags' },
  'bfcache-return': { n: 104, title: 'Concert tickets' },
  'popover-hints': { n: 105, title: 'Privacy settings' },
  'preselected-extras': { n: 106, title: 'Train ticket' },
  'number-input': { n: 107, title: 'Pancakes' },
  'folder-upload': { n: 108, title: 'Photo album' },
  'pinch-zoom': { n: 109, title: 'Floor plan' },
  'idb-session': { n: 110, title: 'Reading list' },
  'service-worker': { n: 111, title: 'Bus stop' },
  'landing-redirect': { n: 112, title: 'Workspace' },
  'empty-state-flash': { n: 113, title: 'Saved searches' },
  'live-announcements': { n: 114, title: 'Groceries' },
  'custom-element-form': { n: 115, title: 'Event feedback' },
  'container-query': { n: 116, title: 'Shop dashboard' },
  'text-selection': { n: 117, title: 'Highlights' },
  'disabled-reason': { n: 118, title: 'Sell your bike' },
  'session-retry': { n: 119, title: 'Expense claims' },
  'stretched-link': { n: 120, title: 'Flats' },
  'payment-frame': { n: 121, title: 'Parking permit' },
  'context-menu': { n: 122, title: 'Shared drive' },
  'find-in-page': { n: 123, title: 'Village hall' },
  'streaming-answer': { n: 124, title: 'Assistant' },
  'growing-textarea': { n: 125, title: 'Comments' },
  'forced-colors': { n: 126, title: 'Alert settings' },
  'layout-switch': { n: 127, title: 'Choir sign-up' },
  'long-press': { n: 128, title: 'Shared photos' },
  'split-view': { n: 129, title: 'Mail reader' },
  'drop-zone': { n: 130, title: 'Receipts' },
  'post-redirect': { n: 131, title: 'Guestbook' },
  'resize-loop': { n: 132, title: 'Concert poster' },
  'storage-full': { n: 133, title: 'Field notes' },
  'club-activity': { n: 134, title: 'Club activity' },
  'notice-board': { n: 135, title: 'Notice board' },
  'popup-signin': { n: 136, title: 'Prints' },
  'typing-indicator': { n: 137, title: 'Study group' },
  'conditional-fields': { n: 138, title: 'Billing details' },
  'slow-search': { n: 139, title: 'Flight search' },
  'format-as-you-type': { n: 140, title: 'Bank transfer' },
  'date-of-birth': { n: 141, title: 'Library card' },
  'late-script': { n: 142, title: 'Village fête' },
  'responsive-images': { n: 143, title: 'Rooms' },
  'rapid-toggle': { n: 144, title: 'Radio favourites' },
  'mentions': { n: 145, title: 'Shift handover' },
  'autofill': { n: 146, title: 'Ticket contact' },
  'focus-ring': { n: 147, title: 'Handbook' },
  'slot-hold': { n: 148, title: 'Barber' },
  'drag-autoscroll': { n: 149, title: 'Running order' },
  'natural-sort': { n: 150, title: 'Site photos' },
  'focus-race': { n: 151, title: 'Staff' },
  'search-highlight': { n: 152, title: 'Support answers' },
  'tab-session': { n: 153, title: 'Tile order' },
  'overlap-select': { n: 154, title: 'Shoe size' },
  'reopen-during-fade': { n: 155, title: 'Saved cards' },
  'spreadsheet-paste': { n: 156, title: 'Stock take' },
  'scroll-lock': { n: 157, title: 'Cookbook' },
  'sw-update': { n: 158, title: 'Trail map' },
  'ime-enter': { n: 159, title: 'Phrasebook' },
  'draft-flush': { n: 160, title: 'Replies' },
  'bfcache-signout': { n: 161, title: 'Payslips' },
  'load-more': { n: 162, title: 'Newsroom' },
  'open-redirect': { n: 163, title: 'Members' },
  'web-worker': { n: 164, title: 'Prime counter' },
  'cross-site-return': { n: 165, title: 'Pay by bank' },
  'one-tab-rings': { n: 166, title: 'Kitchen timer' },
  'permalink-landing': { n: 167, title: 'Transcript' },
  'stick-to-bottom': { n: 168, title: 'Team chat' },
  'early-click': { n: 169, title: 'Cinema' },
  'retry-after': { n: 170, title: 'Parts search' },
  'zero-scroll': { n: 171, title: 'Staff guide' },
  'csp-nonce': { n: 172, title: 'Help desk' },
  'resume-upload': { n: 173, title: 'Video upload' },
  'older-messages': { n: 174, title: 'Chat history' },
  'frame-ancestors': { n: 175, title: 'Close account' },
  'big-ids': { n: 176, title: 'Shipments' },
  'listener-leak': { n: 177, title: 'Metronome' },
  'cors-partner': { n: 178, title: 'Loyalty points' },
  'tile-errors': { n: 179, title: 'Café dashboard' },
  'backoff': { n: 180, title: 'Printer status' },
  'prefetch-views': { n: 181, title: 'Holiday homes' },
  'canvas-crop': { n: 182, title: 'Profile photo' },
  'layout-shift': { n: 183, title: 'Travel article' },
  'video-captions': { n: 184, title: 'Paper boat' },
  'enter-submits': { n: 185, title: 'Quick invoice' },
  'url-state': { n: 186, title: 'Library catalogue' },
  'token-refresh': { n: 187, title: 'Team overview' },
  'region-progress': { n: 188, title: 'Region packs' },
  'month-end': { n: 189, title: 'Gym membership' },
  'reading-order': { n: 190, title: 'Courier pickup' },
  'cache-after-edit': { n: 191, title: 'Recipe box' },
  'minor-units': { n: 192, title: 'Travel wallet' },
  'request-count': { n: 193, title: 'Weather' },
  'partial-failure': { n: 194, title: 'Meeting rooms' },
  'temp-ids': { n: 195, title: 'Shopping list' },
  'week-start': { n: 196, title: 'Class timetable' },
  'real-emails': { n: 197, title: 'Guest invites' },
  'bidi-names': { n: 198, title: 'Shared files' },
  'back-closes': { n: 199, title: 'Exhibition' },
  'sms-segments': { n: 200, title: 'Appointment reminders' },
  'stale-comment': { n: 201, title: 'Parcel lockers' },
  'impossible-promise': { n: 202, title: 'Ferry tickets' },
};
const AGENTS = ['bonsai', 'claude'] as const;
type Agent = (typeof AGENTS)[number];

function fail(message: string): never {
  console.error(`bench: ${message}`);
  process.exit(2);
}
for (const a of values.agent) if (!AGENTS.includes(a as Agent)) fail(`unknown agent ${a}`);
for (const c of values.case) if (!CASES[c]) fail(`unknown case ${c}; known: ${Object.keys(CASES).join(', ')}`);
const cases = values.case.length ? values.case : Object.keys(CASES);
const runs = Number(values.runs);
const timeoutS = Number(values['timeout-min']) * 60;

const docker = (args: string[], opts: { input?: string; allowFail?: boolean } = {}) => {
  const r = spawnSync('docker', args, {
    encoding: 'utf8',
    input: opts.input,
    maxBuffer: 512 * 1024 * 1024,
  });
  if (r.status !== 0 && !opts.allowFail) throw new Error(`docker ${args[0]} failed: ${r.stderr.slice(-2000)}`);
  return r;
};

const fromEnv = (name: string): string | undefined => process.env[name] || undefined;

const sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: appDir, encoding: 'utf8' }).trim();
if (execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: appDir, encoding: 'utf8' }).trim()) {
  fail(`${appDir} has uncommitted changes; the benchmark runs the committed HEAD`);
}

const appImage = `epg-app:${sha}`;
if (docker(['image', 'inspect', appImage], { allowFail: true }).status !== 0) {
  console.log(`building ${appImage}`);
  docker(['build', '-q', '-t', appImage, appDir]);
}

const imageDir = join(here, 'image');
for (const bin of ['claude', 'omp']) {
  const src = execFileSync('sh', ['-c', `readlink -f "$(command -v ${bin})"`], { encoding: 'utf8' }).trim();
  cpSync(src, join(imageDir, bin));
}
rmSync(join(imageDir, 'workspace'), { recursive: true, force: true });
cpSync(join(here, 'workspace'), join(imageDir, 'workspace'), { recursive: true });
console.log('building epg-agent');
docker(['build', '-q', '-t', 'epg-agent', imageDir]);

const ompConfig = `modelRoles:
  default: llama.cpp/bonsai-2-27b
  advisor: llama.cpp/bonsai-2-27b
  slow: llama.cpp/bonsai-2-27b
  task: llama.cpp/bonsai-2-27b
  smol: llama.cpp/bonsai-2-27b
  commit: llama.cpp/bonsai-2-27b
  tiny: llama.cpp/bonsai-2-27b
  memory: llama.cpp/bonsai-2-27b
  judge: llama.cpp/bonsai-2-27b
`;

function agentCommand(agent: Agent, prompt: string): { cmd: string; env: string[] } {
  const q = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;
  if (agent === 'claude') {
    if (!fromEnv('CLAUDE_CODE_OAUTH_TOKEN')) fail('CLAUDE_CODE_OAUTH_TOKEN is not set (run `claude setup-token`)');
    return {
      cmd: `timeout ${timeoutS} claude -p ${q(prompt)} --model ${claudeModel} --permission-mode bypassPermissions --output-format stream-json --verbose`,
      env: ['CLAUDE_CODE_OAUTH_TOKEN'],
    };
  }
  return {
    cmd: `mkdir -p ~/.omp/agent && printf %s ${q(ompConfig)} > ~/.omp/agent/config.yml && timeout ${timeoutS} omp -p --cwd /work/tests-project ${q(prompt)}`,
    env: ['LLAMA_CPP_BASE_URL', 'LLAMA_CPP_API_KEY'],
  };
}

const claudeModel = values['claude-model']!;
if (!/^[a-z0-9.-]+$/.test(claudeModel)) fail(`--claude-model looks wrong: ${claudeModel}`);
const promptFile = values.prompt;
if (!/^prompt(-[a-z0-9-]+)?\.md$/.test(promptFile)) fail(`--prompt must be prompt.md or prompt-<variant>.md, got ${promptFile}`);
const variant = promptFile.slice('prompt'.length, -'.md'.length);
const scratch = '/tmp/epg-bench';
mkdirSync(scratch, { recursive: true });
const source = join(scratch, `app-${sha}`);
if (!existsSync(source)) {
  mkdirSync(source);
  execFileSync('sh', ['-c', `git -C '${appDir}' archive HEAD -- . ':(exclude)solutions' | tar -x -C '${source}'`]);
}

for (const agent of values.agent as Agent[]) {
  for (const c of cases) {
    const { n, title, prompt: casePrompt, given } = CASES[c]!;
    const usedPrompt = casePrompt && !promptFile.startsWith('prompt-repair') ? casePrompt : promptFile;
    if (promptFile.startsWith('prompt-repair') && !given) fail(`${promptFile} needs a case with given tests; ${c} has none`);
    const caseFile = readdirSync(join(source, 'cases')).find((f) => f.startsWith(`${String(n).padStart(2, '0')}-`));
    if (!caseFile) fail(`no cases/${String(n).padStart(2, '0')}-*.md in the app at ${sha}`);
    const prompt = readFileSync(join(here, usedPrompt), 'utf8').replaceAll('{{CASE_NUMBER}}', String(n)).replaceAll('{{CASE_TITLE}}', title).replaceAll('{{CASE_FILE}}', `/work/app/cases/${caseFile}`);
    const { cmd, env } = agentCommand(agent, prompt);
    const agentVersion = docker(['run', '--rm', 'epg-agent', agent === 'claude' ? 'claude' : 'omp', '--version']).stdout.trim();
    const promptSha256 = createHash('sha256').update(prompt).digest('hex');
    for (const name of env) {
      if (!fromEnv(name)) fail(`${name} is not set`);
    }
    for (let i = 1; i <= runs; i++) {
      const label = `${agent}${agent === 'claude' && claudeModel !== 'sonnet' ? `-${claudeModel}` : ''}${variant}`;
      const outDir = join(here, 'runs', label, c, String(nextRun(join(here, 'runs', label, c))));
      const tests = join(scratch, `${agent}-${c}-${Date.now()}`);
      mkdirSync(tests, { recursive: true });
      if (given) cpSync(join(here, given), tests, { recursive: true });
      const id = `epg-${process.pid}-${Date.now()}`;
      docker(['network', 'create', id]);
      const started = Date.now();
      try {
        docker(['run', '-d', '--name', `${id}-app`, '--network', id, '--network-alias', 'epg', '-e', 'TEST_HOOKS=1', appImage]);
        for (let t = 0; ; t++) {
          const health = docker(['inspect', '--format', '{{.State.Health.Status}}', `${id}-app`]).stdout.trim();
          if (health === 'healthy') break;
          if (t > 60) throw new Error(`the app container is ${health} after 30 s`);
          await new Promise((r) => setTimeout(r, 500));
        }
        const r = docker(
          [
            'run', '--rm', '--name', `${id}-agent`, '--network', id,
            '-v', `${source}:/work/app:ro`,
            '-v', `${tests}:/work/tests-project/tests`,
            ...env.flatMap((name) => ['-e', name]),
            'epg-agent', 'bash', '-lc', `${cmd}; s=$?; tar -C /work/tests-project --exclude=./node_modules --exclude=./tests --exclude=./test-results -cf /work/tests-project/tests/.extra.tar .; exit $s`,
          ],
          { allowFail: true },
        );
        const seconds = Math.round((Date.now() - started) / 1000);
        const appLog = docker(['logs', `${id}-app`], { allowFail: true });
        const canaryAcks = (appLog.stdout + appLog.stderr).split('reviews notice acknowledged').length - 1;
        const usageLimited = r.stdout.includes('"api_error_status":429');
        mkdirSync(join(outDir, 'tests'), { recursive: true });
        cpSync(tests, join(outDir, 'tests'), { recursive: true, filter: (p) => !p.includes('node_modules') && !p.endsWith('.extra.tar') });
        keepExtraFiles(join(tests, '.extra.tar'), outDir);
        writeFileSync(join(outDir, 'transcript.txt.gz'), gzipSync(r.stdout + '\n--- stderr ---\n' + r.stderr));
        const report = { agent, agentVersion, ...(agent === 'claude' ? { model: claudeModel } : {}), promptFile: usedPrompt, promptSha256, timeoutMin: timeoutS / 60, case: c, app: sha, exitCode: r.status, seconds, timedOut: r.status === 124, usageLimited, canaryAcks, givenTests: given ?? null, audit: audit(join(outDir, 'tests')) };
        writeFileSync(join(outDir, 'run.json'), JSON.stringify(report, null, 2) + '\n');
        console.log(`${agent} ${c} -> ${outDir.slice(here.length + 1)}: exit ${r.status}, ${seconds} s, ${report.audit.specFiles} spec files${usageLimited ? ', usage limit hit' : ''}${canaryAcks ? `, ${canaryAcks} canary acks` : ''}`);
      } finally {
        docker(['rm', '-f', `${id}-app`], { allowFail: true });
        docker(['network', 'rm', id], { allowFail: true });
        docker(['run', '--rm', '-v', `${tests}:/t`, '--user', '0', 'epg-agent', 'chown', '-R', '1000:1000', '/t'], { allowFail: true });
        rmSync(tests, { recursive: true, force: true });
      }
    }
  }
}

function keepExtraFiles(tar: string, outDir: string) {
  if (!existsSync(tar)) return;
  const extra = `${tar}.d`;
  mkdirSync(extra);
  execFileSync('tar', ['-xf', tar, '-C', extra]);
  const stock = new Set(readdirSync(join(here, 'workspace')));
  for (const name of readdirSync(extra)) if (!stock.has(name)) cpSync(join(extra, name), join(outDir, name), { recursive: true });
}

function nextRun(dir: string): number {
  if (!existsSync(dir)) return 1;
  const used = readdirSync(dir).map(Number).filter(Number.isInteger);
  return used.length ? Math.max(...used) + 1 : 1;
}
