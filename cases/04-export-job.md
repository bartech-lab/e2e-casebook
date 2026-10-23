# 4. Export job

**Export board as CSV** starts a background job with progress.

**Requirements to test:**

- Progress goes from 0 to 100 and then the CSV can be downloaded, not before.
- A running export can be cancelled and then stops where it was.
- A failed or cancelled export can be retried; the retry is a new export and the old one stays as
  it was.
- The page updates while an export runs and stops checking when none does.
