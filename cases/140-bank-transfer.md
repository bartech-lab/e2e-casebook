# 140. Bank transfer

The Bank transfer page sends 100.00 PLN to a Polish account number (IBAN).
`GET /api/s/:id/transfers` lists the transfers as `{ "transfers": [{ "account": "..." }] }`.
`PL61 1090 1014 0000 0712 1981 2874` is a valid account number.
**Requirements to test:**

- The account number is shown in groups of four as you type, for example `PL61 1090 1014`.
  It starts with two letters; lowercase becomes uppercase. Any other character is left out.
- It stops at 28 characters, the length of a Polish account number.
- Typing or deleting in the middle keeps the cursor right after what you typed or before what you
  deleted. It never jumps to the end.
- **Backspace** just after a space deletes the digit before the space.
- Pasting works with spaces, dashes or lowercase letters.
- **Send 100.00 PLN** checks the account number, including its check digits. A wrong one shows
  "Check the account number." next to the field. A right one says
  "Transfer to PL61…2874 sent." and saves the number without spaces.
