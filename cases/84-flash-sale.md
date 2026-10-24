# 84. Flash sale

The Flash sale page sells an espresso grinder for 199.00 PLN until the sale ends, 15 minutes
after the sandbox first opens it. The test hook `POST /__test__/s/:id/sale` with
`{ "endsInMs": <ms> }` moves the end.

**Requirements to test:**

- "Ends in" shows the time left by the shop's clock, also when the device clock is wrong.
- The time is minutes and seconds (`09:59`), with hours in front when there is an hour or more
  left (`1:02:03`).
- The time left stays right after the computer sleeps or the tab is in the background.
- The last second shows `00:01`, and `00:00` never appears. Then the page says "The sale has
  ended." and **Buy now** is disabled.
- After the end, buying is refused, also when the request does not come from the page.
