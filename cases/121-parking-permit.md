# 121. Parking permit

The Parking permit page sells a one-month resident's permit for 120.00 PLN. The card fields are
in a frame titled "Card details", served from `/embed/pay/`, which talks to the page with
`postMessage`. The card `4242 4242 4242 4242` is accepted and `4000 0000 0000 0002` is declined,
with any valid expiry date and security code. `GET /api/s/:id/pay/payments` lists the payments.
**Requirements to test:**

- **Pay 120.00 PLN** without a number plate shows "Enter your number plate." and charges nothing.
- With a plate and an accepted card, the page says "The permit for <PLATE> is paid. Payment
  PAY-<n>." with the plate in capitals, and exactly one payment is made.
- A declined card shows "Your card was declined." in the frame, fully visible, and the page does
  not say the permit is paid. Missing or malformed card details are explained the same way.
- The frame grows to fit its messages, so nothing in it is ever cut off.
- With the keyboard, Tab goes from the number plate through the card fields to the Pay button.
- Only the payment frame can mark the permit as paid; a message from any other window is ignored.
