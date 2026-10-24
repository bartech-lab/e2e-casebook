# 107. Pancakes

The Pancakes page shows a recipe written for 4 servings.

**Requirements to test:**

- **Servings** takes a whole number from 1 to 12, and the ingredient amounts follow it. The
  arrow keys change it by 1 and stop at 1 and 12.
- Any other value shows "Choose 1 to 12 servings." and the amounts stay as they were for the
  last valid number.
- Turning the mouse wheel over the page scrolls the page, also when the pointer is over
  Servings and Servings has focus. It never changes the number.
- **Flour you have, in kg** accepts a decimal comma or a decimal point, so "2,5" and "2.5" both
  mean 2.5 kg. The page says how many whole servings that flour makes (62.5 g per serving), or
  "Enter the flour in kg, for example 1,5." for anything else.
