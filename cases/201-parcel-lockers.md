# 201. Parcel lockers

The Parcel lockers page lists six parcel lockers near the shopper, each with its code, street and distance, and **Send here** confirms the one chosen. There is no server.

**Requirements to test:**

- The lockers that have room come first, nearest first.
- Full lockers are still listed, after all the others and also nearest first, marked ", full", and cannot be chosen.
- Distances under 1 km are shown in metres (`350 m`); from 1 km on, in kilometres with one decimal (`1.5 km`).
- **Send here** says "Your parcel goes to <code>, <street>." for the locker chosen, or "Choose a locker." when none is.
