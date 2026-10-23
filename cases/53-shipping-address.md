# 53. Shipping address

The Shipping address page saves a country and a postcode, and a state for the United States.

**Requirements to test:**

- Poland takes postcodes like 80-001. The United States takes ZIP codes like 94105 or
  94105-1234 and needs a state. The United Kingdom takes postcodes like SW1A 1AA, in any case
  and with or without the space, and saves them in capitals with the space.
- A state is only asked for, and only saved, for the United States. Changing the country clears
  the old mistakes.
- The server checks the same rules, whoever sends the address.
