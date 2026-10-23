# 23. Top up

The Top up page adds money to a wallet. The card details go into an embedded card form from a
separate payment provider.

**Requirements to test:**

- Choose 10.00, 20.00, or 50.00 PLN and pay with a card. The balance grows by exactly that amount,
  and the Top-ups list shows the amount and the card's last four digits.
- The card form checks the card: a 16-digit number that passes the Luhn check, an expiry date
  (MM/YY) that has not passed, and a 3-digit CVC. A wrong card shows an error in the card form,
  and nothing is charged.
- The test card 4242 4242 4242 4242 is accepted. The test card 4000 0000 0000 0002 is declined: the
  page says "Card declined. You were not charged." and the balance does not change.
- Each card entry pays once.
