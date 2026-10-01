import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'tests/e2e',
	testMatch: '**/*.test.ts',
	workers: 1,
	webServer: {
		command: 'npm run build && node build',
		port: 4173,
		env: { PORT: '4173', ORIGIN: 'http://localhost:4173' },
		reuseExistingServer: !process.env.CI
	},
	use: { baseURL: 'http://localhost:4173' },
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
		{ name: 'mobile', use: { ...devices['Pixel 7'] } }
	]
});
