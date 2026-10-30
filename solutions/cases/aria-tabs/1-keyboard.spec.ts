import { test } from '../fixtures.ts';
import { expect } from '@playwright/test';
import { openTabs, panel, tab } from './helpers.ts';

test('one Tab stop, arrows select and wrap, Home and End, and Tab goes on to the panel', async ({ page, sandbox }) => {
  await openTabs(page, sandbox);
  await tab(page, 'Description').focus();
  await page.keyboard.press('Tab');
  await expect(panel(page)).toBeFocused();
  await expect(panel(page)).toContainText('ceramic burrs');
  await page.keyboard.press('Shift+Tab');
  await expect(tab(page, 'Description')).toBeFocused();

  const steps: [string, string, string][] = [
    ['ArrowRight', 'Specifications', 'Weight 620 g'],
    ['ArrowRight', 'Reviews', '212 reviews'],
    ['ArrowRight', 'Shipping', 'Free returns'],
    ['ArrowRight', 'Description', 'ceramic burrs'],
    ['ArrowLeft', 'Shipping', 'Free returns'],
    ['Home', 'Description', 'ceramic burrs'],
    ['End', 'Shipping', 'Free returns'],
  ];
  for (const [key, name, text] of steps) {
    await page.keyboard.press(key);
    await expect(tab(page, name), `${key} -> ${name}`).toBeFocused();
    await expect(tab(page, name)).toHaveAttribute('aria-selected', 'true');
    await expect(panel(page)).toContainText(text);
  }

  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(() => document.activeElement?.getAttribute('role'))).not.toBe('tab');
  await page.keyboard.press('Tab');
  await expect(tab(page, 'Shipping')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(panel(page)).toBeFocused();
});
