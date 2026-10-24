import { useRef, useState, type KeyboardEvent } from 'react';

type Node = { name: string; children?: Node[] };

const ROOT: Node[] = [
  {
    name: 'Documents',
    children: [
      { name: 'Contracts', children: [{ name: 'Lease.pdf' }, { name: 'Loan.pdf' }] },
      { name: 'Invoices', children: [{ name: '2025-09.pdf' }, { name: '2025-10.pdf' }] },
      { name: 'CV.pdf' },
    ],
  },
  { name: 'Music', children: [{ name: 'Chopin.flac' }] },
  { name: 'Photos', children: [{ name: 'Holidays', children: [{ name: 'Hel.jpg' }] }, { name: 'Cat.jpg' }] },
  { name: 'Notes.txt' },
];

type Row = { path: string; node: Node; level: number; parent: string | null };

function visible(nodes: Node[], open: Set<string>, level = 1, parent: string | null = null): Row[] {
  return nodes.flatMap((node) => {
    const path = parent ? `${parent}/${node.name}` : node.name;
    const row = { path, node, level, parent };
    return node.children && open.has(path) ? [row, ...visible(node.children, open, level + 1, path)] : [row];
  });
}

export function FolderTree() {
  const [open, setOpen] = useState(new Set<string>());
  const [active, setActive] = useState('Documents');
  const [chosen, setChosen] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLLIElement | null>>({});
  const rows = visible(ROOT, open);

  const focus = (path: string) => {
    setActive(path);
    refs.current[path]?.focus();
  };
  const toggle = (path: string, to: boolean) =>
    setOpen((cur) => {
      const next = new Set(cur);
      if (to) next.add(path);
      else next.delete(path);
      return next;
    });

  function onKeyDown(e: KeyboardEvent) {
    const i = rows.findIndex((r) => r.path === active);
    const row = rows[i]!;
    const isOpen = open.has(row.path);
    let handled = true;
    if (e.key === 'ArrowDown') focus(rows[Math.min(rows.length - 1, i + 1)]!.path);
    else if (e.key === 'ArrowUp') focus(rows[Math.max(0, i - 1)]!.path);
    else if (e.key === 'Home') focus(rows[0]!.path);
    else if (e.key === 'End') focus(rows[rows.length - 1]!.path);
    else if (e.key === 'ArrowRight') {
      if (row.node.children && !isOpen) toggle(row.path, true);
      else if (row.node.children && isOpen) focus(rows[i + 1]!.path);
    } else if (e.key === 'ArrowLeft') {
      if (row.node.children && isOpen) toggle(row.path, false);
      else if (row.parent) focus(row.parent);
    } else if (e.key === 'Enter') setChosen(row.path);
    else if (/^\w$/.test(e.key)) {
      const order = [...rows.slice(i + 1), ...rows.slice(0, i + 1)];
      const hit = order.find((r) => r.node.name.toLowerCase().startsWith(e.key.toLowerCase()));
      if (hit) focus(hit.path);
    } else handled = false;
    if (handled) e.preventDefault();
  }

  function renderLevel(nodes: Node[], level: number, parent: string | null) {
    return nodes.map((node) => {
      const path = parent ? `${parent}/${node.name}` : node.name;
      const folder = !!node.children;
      return (
        <li
          key={path}
          ref={(el) => {
            refs.current[path] = el;
          }}
          role="treeitem"
          aria-labelledby={`label-${path.replace(/\W+/g, '-')}`}
          aria-level={level}
          aria-expanded={folder ? open.has(path) : undefined}
          aria-selected={chosen === path}
          tabIndex={active === path ? 0 : -1}
          onClick={(e) => {
            e.stopPropagation();
            setActive(path);
            setChosen(path);
            if (folder) toggle(path, !open.has(path));
          }}
        >
          <span className="tree-label">
            {folder && <span aria-hidden="true">{open.has(path) ? '▾ ' : '▸ '}</span>}
            <span id={`label-${path.replace(/\W+/g, '-')}`}>{node.name}</span>
          </span>
          {folder && open.has(path) && <ul role="group">{renderLevel(node.children!, level + 1, path)}</ul>}
        </li>
      );
    });
  }

  return (
    <section>
      <h1>Files</h1>
      <ul role="tree" aria-label="Files" className="tree" onKeyDown={onKeyDown}>
        {renderLevel(ROOT, 1, null)}
      </ul>
      <p role="status">{chosen ? `Selected: ${chosen}` : 'Nothing selected.'}</p>
    </section>
  );
}
