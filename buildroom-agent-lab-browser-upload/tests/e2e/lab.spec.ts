import { test, expect } from '@playwright/test';
test('runs, inspects snapshots, filters agents and resets on rerun', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Run workflow' }).click();
    await expect(page.getByRole('status')).toHaveText('completed');
    await expect(page.getByLabel('Trace events').getByRole('button')).toHaveCount(4);
    await page.getByRole('button', { name: /04 · RenderAgent/ }).click();
    await expect(page.getByLabel('Shared state')).toContainText('150');
    await page.getByLabel('Filter agent').selectOption('SearchAgent');
    await expect(page.getByLabel('Trace events').getByRole('button')).toHaveCount(1);
    await page.getByLabel('Simulation scenario').selectOption('repeated-search');
    await page.getByRole('button', { name: 'Run workflow' }).click();
    await expect(page.getByRole('status')).toHaveText('terminated');
    await expect(page.getByText('Repeated search prevented.', { exact: true })).toHaveCount(2);
    await expect(page.getByRole('heading', { name: 'State after event 1' })).toBeVisible();
});
for (const [scenario, status] of [['transient-failure', 'completed'], ['tool-failure', 'failed'], ['termination-limit', 'terminated']]) {
    test(`${scenario} has terminal status ${status}`, async ({ page }) => {
        await page.goto('/');
        await page.getByLabel('Simulation scenario').selectOption(scenario);
        await page.getByRole('button', { name: 'Run workflow' }).click();
        await expect(page.getByRole('status')).toHaveText(status);
    });
}
test('mobile view fits viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Run workflow' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
