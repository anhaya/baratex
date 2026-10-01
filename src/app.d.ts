// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Error {
			message: string;
			id?: string;
		}
		interface Locals {
			/** Search radius in km, or `null` for "anywhere, delivery only". */
			radiusKm: number | null;
		}
	}
}

export {};
