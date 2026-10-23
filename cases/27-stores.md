# 27. Stores

The Stores page finds the three stores nearest to you.

**Requirements to test:**

- **Use my location** asks the browser for your position and lists the three nearest stores,
  nearest first, each with its great-circle distance (Earth radius 6371 km) rounded to 0.1 km.
- If you block location access, the page says "Location is off. Choose a city instead." If the
  position does not come within 5 seconds, it says "Could not find you. Choose a city instead."
- Choosing a city lists the three stores nearest to that city's centre, also after you used your
  location.

| Store | Latitude | Longitude |
|---|---|---|
| Warszawa Centrum | 52.2297 | 21.0122 |
| Warszawa Mokotów | 52.1935 | 21.0450 |
| Kraków Rynek | 50.0617 | 19.9373 |
| Gdańsk Główne | 54.3520 | 18.6466 |
| Poznań Stary Rynek | 52.4084 | 16.9342 |

| City centre | Latitude | Longitude |
|---|---|---|
| Gdańsk | 54.3520 | 18.6466 |
| Kraków | 50.0647 | 19.9450 |
| Poznań | 52.4064 | 16.9252 |
| Warszawa | 52.2297 | 21.0122 |
| Wrocław | 51.1079 | 17.0385 |
