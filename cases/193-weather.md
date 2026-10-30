# 193. Weather

The Weather page shows the weather for Kraków, Gdańsk or Zakopane from `GET /api/s/:id/weather?city=<city>`, in °C or, with **Show °F**, in °F. It asks again every ten minutes. The test hooks `GET /__test__/s/:id/weather-requests` answers `{ "count" }`, the number of weather requests so far, and `POST /__test__/s/:id/weather-fail` with `{ "on" }` makes the weather service fail or work again.

**Requirements to test:**

- Opening the page asks for the weather once, and choosing another city asks once more. **Show °F** does not ask again; it converts.
- While the page is open it asks again once every ten minutes, and never more often.
- When the weather service fails, the page says "Weather unavailable. Trying again in 10 minutes." and waits for the next ten-minute refresh; it does not try again straight away.
- After you leave the page, it stops asking.
