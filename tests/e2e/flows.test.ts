import { expect, test, type Page } from '@playwright/test';

/** Fails the test on any CSP violation or uncaught error. */
function watchConsole(page: Page) {
	const problems: string[] = [];
	page.on('console', (m) => {
		if (m.type() === 'error') problems.push(m.text());
	});
	page.on('pageerror', (e) => problems.push(e.message));
	return problems;
}

test('feed renders with security headers and no console errors', async ({ page }) => {
	const problems = watchConsole(page);
	const res = await page.goto('/');
	const headers = res!.headers();
	expect(headers['content-security-policy']).toContain("script-src 'self' 'nonce-");
	expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
	expect(headers['x-content-type-options']).toBe('nosniff');
	expect(headers['x-frame-options']).toBe('DENY');
	await expect(page.getByRole('heading', { name: 'Bicicleta aro 26 com cestinha' })).toBeVisible();
	expect(problems).toEqual([]);
});

test('favoriting from the feed updates the count', async ({ page, isMobile }) => {
	test.skip(isMobile, 'count lives in the desktop sidebar');
	await page.goto('/');
	const nav = page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: /Favoritos/ });
	const before = Number((await nav.textContent())?.match(/\d+/)?.[0]);
	await page.getByRole('button', { name: /Salvar “Sofá 3 lugares verde”|Remover “Sofá/ }).first().click();
	await expect(nav).not.toHaveText(new RegExp(`\\b${before}\\b`));
});

test('making an offer opens the conversation', async ({ page }) => {
	await page.goto('/anuncio/bike-lilas');
	await page.getByRole('button', { name: 'Fazer oferta' }).first().click();
	await page.getByLabel('Valor da oferta em reais').fill('480');
	await page.getByRole('button', { name: 'Enviar oferta' }).click();
	await expect(page).toHaveURL(/\/mensagens\//);
	await expect(page.getByText('R$ 480').first()).toBeVisible();
});

test('an offer above the price is rejected with a message', async ({ page }) => {
	await page.goto('/anuncio/luminaria');
	await page.getByRole('button', { name: 'Fazer oferta' }).first().click();
	await page.getByLabel('Valor da oferta em reais').fill('5000');
	await page.getByRole('button', { name: 'Enviar oferta' }).click();
	await expect(page.getByRole('alert')).toHaveText(/menor que o preço/);
});

test('AI chat answers and refines', async ({ page, isMobile }) => {
	await page.goto('/chat');
	await expect(page.getByText(/achei 6 resultados/)).toBeVisible();
	if (!isMobile) {
		await page.getByRole('button', { name: 'Remover filtro Peso' }).click();
		await expect(page.getByRole('button', { name: 'Remover filtro Peso' })).toHaveCount(0);
	}
	await page.getByRole('button', { name: 'Compare o 1 e o 2' }).click();
	await expect(page.getByText(/Comparando os dois/)).toBeVisible();
});

test('changing the radius filters the feed', async ({ page, isMobile }) => {
	await page.goto('/');
	if (isMobile) {
		await page.getByRole('button', { name: /5 km/ }).click();
		await page.getByRole('radio', { name: /A pé/ }).click();
		await page.getByRole('button', { name: 'Ver anúncios até 1 km' }).click();
	} else {
		await page.getByRole('radio', { name: /A pé/ }).click();
	}
	// Nothing in the seed data is within walking distance.
	await expect(page.getByRole('heading', { name: 'Nada por aqui ainda' })).toBeVisible();
});

test('publishing a listing', async ({ page }) => {
	await page.goto('/vender');
	await page.locator('input[type=file]').setInputFiles({
		name: 'foto.png',
		mimeType: 'image/png',
		buffer: Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex')
	});
	await page.getByRole('button', { name: 'Continuar' }).click();
	await page.getByLabel('Título').fill('Cadeira de escritório');
	await page.getByRole('button', { name: 'Continuar' }).click();
	await page.getByRole('button', { name: 'Publicar anúncio' }).click();
	await expect(page.getByRole('heading', { level: 1, name: 'Cadeira de escritório' })).toBeVisible();
});

test('cross-site form posts are rejected', async ({ request }) => {
	const res = await request.post('/anuncio/bike-amarela?/favorite', {
		headers: { origin: 'https://evil.example', 'content-type': 'application/x-www-form-urlencoded' },
		data: 'x=1'
	});
	expect(res.status()).toBe(403);
});
