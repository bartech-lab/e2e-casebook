# 186. Library catalogue

The Library catalogue page searches books by title, with **Available now** and **Sort by** (Relevance, Title, Newest). `GET /api/s/:id/catalogue?q=&available=1&sort=title` answers the books. Titles include `100% Wool: Knitting Basics`, `C++ & Rust for Beginners`, `C# in Practice`, `Łódź in Photographs`, `The #1 Detective Agency` and `One Plus+ One`.

**Requirements to test:**

- After **Search**, the page's address holds the search: the title text, Available now and the sort. Opening that address, by a reload or a shared link, shows the same search and the same books.
- Any text works in the address: `%`, `+`, `&`, `#`, spaces and Polish letters come back exactly as typed.
- Settings left at their defaults (Available now off, Relevance) are left out of the address.
- Each search is one step in the browser's history; typing alone is not. Back and Forward go through earlier searches and show their text, settings and books.
