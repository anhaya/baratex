import { error, fail, isHttpError, isRedirect, type ActionFailure } from '@sveltejs/kit';
import { z } from 'zod';
import { ApiError } from '$lib/api/types';
import { Id } from '$lib/api/schemas';

/** Parses a form with a Zod schema; returns a 400 failure with the first issue on error. */
export function parseForm<S extends z.ZodType>(
	schema: S,
	form: FormData
): { ok: true; data: z.output<S> } | { ok: false; failure: ActionFailure<{ message: string }> } {
	const raw: Record<string, FormDataEntryValue> = {};
	for (const [key, value] of form) raw[key] = value;
	const parsed = schema.safeParse(raw);
	if (parsed.success) return { ok: true, data: parsed.data };
	return { ok: false, failure: fail(400, { message: parsed.error.issues[0]?.message ?? 'Dados inválidos' }) };
}

/** Turns API errors into user-facing failures, rethrowing redirects and unknowns. */
export async function guard<T>(run: () => Promise<T>): Promise<T | ActionFailure<{ message: string }>> {
	try {
		return await run();
	} catch (err) {
		if (isRedirect(err) || isHttpError(err)) throw err;
		if (err instanceof ApiError) return fail(err.status, { message: err.message });
		throw err;
	}
}

export function requireId(value: string): string {
	const parsed = Id.safeParse(value);
	if (!parsed.success) error(404, 'Não encontrado');
	return parsed.data;
}
