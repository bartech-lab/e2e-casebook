# 192. Travel wallet

The Travel wallet page shows balances in PLN, JPY and BHD and adds money to one of them. The server keeps every amount as a whole number of the currency's smallest unit: grosz for PLN (2 decimal places), yen for JPY (none), fils for BHD (3). `GET /api/s/:id/wallet` answers `{ "balances": { "PLN", "JPY", "BHD" } }` in those units, and `POST /api/s/:id/wallet/add` takes `{ "currency", "minor" }`.

**Requirements to test:**

- Each balance is shown with its currency's own number of decimal places: `PLN 1,234.50`, `JPY 12,346`, `BHD 1.235`.
- The amount you type is added exactly: 1.15 PLN adds 115 grosz, 1500 JPY adds 1500 yen, 2.125 BHD adds 2125 fils.
- An amount with more decimal places than the currency has is refused with a message ("JPY has no smaller unit than 1.", "BHD allows 3 decimal places."), and so are amounts like `1,000` ("Use digits and a dot only.") and `0` ("Amount must be more than 0."). Nothing is added then.
