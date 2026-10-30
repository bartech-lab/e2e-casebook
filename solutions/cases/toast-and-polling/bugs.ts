import type { Bug } from '../../scripts/score-lib.ts';

export const bugs: Bug[] = [
  {
    name: "Toast shown before the server confirms",
    edits: [
      { file: "web/src/settings/Settings.tsx", find: "    onSuccess: (saved) => {\n      setForm(saved);\n      setToast(Date.now());\n    },", replace: "    onMutate: () => setToast(Date.now()),\n    onSuccess: (saved) => {\n      setForm(saved);\n      setToast(Date.now());\n    }," },
    ],
  },
  {
    name: "Toast never shown",
    edits: [
      { file: "web/src/settings/Settings.tsx", find: "      setForm(saved);\n      setToast(Date.now());\n", replace: "      setForm(saved);\n" },
    ],
  },
  {
    name: "Toast disappears after 200 ms",
    edits: [
      { file: "web/src/settings/Settings.tsx", find: "const TOAST_MS = 2000;", replace: "const TOAST_MS = 200;" },
    ],
  },
  {
    name: "Save sends the old values",
    edits: [
      { file: "web/src/settings/Settings.tsx", find: "          save.mutate(form);", replace: "          save.mutate(settings.data!);" },
    ],
  },
];
