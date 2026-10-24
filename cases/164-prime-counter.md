# 164. Prime counter

The Prime counter page counts the prime numbers up to a limit, from 1 to 2,000,000,000. Large limits take a few seconds. There is no server.

**Requirements to test:**

- **Count** says "There are <count> primes up to <limit>.", with both numbers written with commas ("There are 50,847,534 primes up to 1,000,000,000."). A limit that is itself prime is counted. The limit may be typed with commas or spaces. Anything else says "Enter a whole number from 1 to 2,000,000,000."
- While counting, the page stays usable: typing, scrolling and the buttons respond at once. The page shows "Counting… N%", and the number goes up as the count runs.
- **Cancel** stops the count. The page says "Cancelled.", and no result appears later.
- Pressing **Count** again during a count, with the same or another limit, stops the old count. Only the newest count's result is ever shown.
