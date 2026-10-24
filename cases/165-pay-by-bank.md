# 165. Pay by bank

The Pay by bank page sells a club membership for 120.00 PLN. **Pay by bank** creates an order and opens Mock Bank, which runs on another site (`127.0.0.1` instead of `localhost`, same port). The bank's **Approve** and **Decline** buttons send the result back to the shop with a form post to `POST /api/s/:id/pbb/return`, signed by the bank. Your orders belong to this browser.

**Requirements to test:**

- After **Approve**, you are back on the Pay by bank page, which says "Payment received for order N." and lists the order as Paid.
- After **Decline**, the page says "Your bank declined order N. You were not charged." and lists it as "Payment declined".
- A return the bank did not sign, or for an order that does not exist, changes nothing and is refused.
- The same return arriving twice (a double click at the bank, a resent form) charges once.
- Each browser sees only its own orders.
