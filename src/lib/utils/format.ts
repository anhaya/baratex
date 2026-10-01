const brl = new Intl.NumberFormat('pt-BR', {
	style: 'currency',
	currency: 'BRL',
	minimumFractionDigits: 0,
	maximumFractionDigits: 2
});

/** Formats centavos as "R$ 650" or "R$ 12,50". */
export function formatBRL(cents: number): string {
	return brl.format(cents / 100).replace(/ /g, ' ');
}

/** "2,1 km", "5 km", "800 m". */
export function formatKm(km: number): string {
	if (km < 1 && km > 0) return `${Math.round(km * 1000)} m`;
	return `${km.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
}

/** "há 40 min", "há 2 h", "há 3 dias". */
export function timeAgo(iso: string, now: number = Date.now()): string {
	const minutes = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
	if (minutes < 1) return 'agora';
	if (minutes < 60) return `há ${minutes} min`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `há ${hours} h`;
	const days = Math.round(hours / 24);
	return days === 1 ? 'há 1 dia' : `há ${days} dias`;
}

export function rating(value: number): string {
	return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ★`;
}

export function initial(name: string): string {
	return name.trim().charAt(0).toUpperCase() || '?';
}

/** Parses "650", "650,50" or "1.250" typed by a person into centavos. */
export function parseBRL(input: string): number | null {
	const clean = input.replace(/[^\d,.]/g, '');
	if (!clean) return null;
	const normalized = clean.includes(',') ? clean.replace(/\./g, '').replace(',', '.') : clean.replace(/\.(?=\d{3}(\D|$))/g, '');
	const value = Number(normalized);
	if (!Number.isFinite(value) || value < 0) return null;
	return Math.round(value * 100);
}
