# 152. Support answers

The Support answers page lists twelve short help articles and filters them as you type in
**Search answers**. There is no server. What it requires:

- An article matches when every word you type appears in its title or text. Capitals and
  accents make no difference: `lodz` finds "Łódź", `ZOLW` finds "żółw".
- Any characters can be searched for, including `c++`, `(beta)` and `<b>`.
- Every place a word matches, in the title and the text, is highlighted (`<mark>`), showing the
  article's own text. Overlapping matches form one highlight. Titles and texts always read exactly
  as written, with or without highlights.
- With a search, the page says how many answers match ("1 answer matches", "3 answers match").
  An empty search lists every article and says nothing.
