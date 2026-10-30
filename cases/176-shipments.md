# 176. Shipments

The Shipments page lists four parcels. `GET /api/s/:id/shipments` answers each one's tracking number twice: as a JSON number in `id`, for older apps, and as a string in `id_str`. Tracking numbers are up to 19 digits. `GET /api/s/:id/shipments/<tracking number>` answers one parcel with its history.

**Requirements to test:**

- Every tracking number shows exactly as the server has it, digit for digit.
- **Track** on a row shows that parcel's details ("Shipment <tracking number>", where it goes, its status and history), never another parcel's.
- **Find** shows the parcel whose tracking number was typed or pasted, spaces allowed. An unknown number says "No shipment with tracking number <number>." and anything that is not digits says "A tracking number has only digits."
