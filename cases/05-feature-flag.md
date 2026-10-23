# 5. Feature flag

New cards are created with one of two variants: an inline form or a dialog. A visitor is assigned
one at random and keeps it; a sandbox can pin one for everybody.

**Requirements to test:**

- Both variants create the card in To do.
- A visitor sees the same variant on every visit, and a pinned variant wins over the assignment.
