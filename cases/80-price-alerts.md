# 80. Price alerts

The Price alerts page shows the price of studio headphones and can notify you when it drops. The
page checks the price every 2 seconds. The test hook `POST /__test__/s/:id/price` with
`{ "price": <grosze> }` changes the price.

**Requirements to test:**

- The page asks for permission to show notifications only when you click **Turn on price alerts**.
- If you allow it, alerts are on and stay on after a reload. If you block it or close the
  question, alerts stay off and the page says why.
- When the price drops below the price you first saw, you get one notification with the new
  price, not one for every check.
- After **Turn off price alerts**, no notification comes, also after a reload.
