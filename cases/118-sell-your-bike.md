# 118. Sell your bike

The Sell your bike page lists a bike for sale once it has a title, a price in whole złoty and a
photo.

**Requirements to test:**

- **Publish** can always be reached with the Tab key, also before the listing is complete.
- Until all three are done, Publish does nothing when it is clicked or pressed with Enter or
  Space, and it is announced as unavailable.
- Pointing at Publish or moving focus to it shows why, listing what is still missing in this
  order, for example "To publish, add: a price, a photo." Screen readers get the same sentence as
  Publish's description. The sentence always matches the form as it is now.
- When everything is done, Publish lists the bike: "Your bike is listed."
