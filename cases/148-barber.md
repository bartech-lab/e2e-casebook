# 148. Barber

The Barber page books a haircut with Sam on Saturday. Four times are offered. Everyone in the
sandbox books from the same diary, each under the name they joined with.
`GET /api/s/:id/barber/slots?name=<name>` returns `{ "serverNow", "slots": [{ "id", "label", "state" }] }`.
The test hook `POST /__test__/s/:id/barber-clock` with `{ "advanceMs": 300000 }` moves the shop's
clock forward.
What it requires:

- Choosing a free time holds it for you for 5 minutes. The page shows the time left as
  minutes and seconds (`4:59`), by the shop's clock, also when the device's clock is wrong.
- While you hold a time, everyone else sees it as "Being booked" and cannot choose it. Choosing
  another time lets go of the first.
- **Confirm booking** within the 5 minutes books it: "Booked: Saturday 09:00 with Sam."
- When the 5 minutes are up, the time is free for others at once, the page says "Your hold ran
  out. Choose a time again.", and the time cannot be booked by you without choosing it again.
- When two people choose the same free time at the same moment, exactly one gets it. The other
  sees "Someone just took that time."
