# 178. Loyalty points

The Loyalty points page shows the points kept by a partner, Example Rewards, whose API is on another origin: `http://127.0.0.1:<port>/partner/<sandbox id>/`. The page gets a token from `GET /api/s/:id/loyalty-token` and calls the partner from the browser with `Authorization: Bearer <token>`: `GET balance` answers the points, with the expiry date in the `X-Points-Expire` header, and `POST redeem` with `{ "reward": "coffee" }` spends them. Everyone starts with 250 points; a coffee costs 100 and a cinema ticket 300.

**Requirements to test:**

- The page shows "You have 250 points. They expire on 2027-03-31."
- **Redeem** spends the points, shows the new balance and says "Enjoy a coffee!" (or the cinema ticket).
- When there are not enough points, the page shows the partner's own reason: "You need 300 points for this reward."
- The partner answers only this app: pages on any other origin cannot read the points or spend them.
