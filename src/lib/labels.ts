import type { Category, Condition } from '$lib/api/schemas';

export const CATEGORY_LABELS: Record<Category, string> = {
	casa: 'Móveis e casa',
	moda: 'Moda',
	eletronicos: 'Eletrônicos',
	esportes: 'Esportes',
	bebe: 'Bebê',
	lazer: 'Lazer'
};

export const PRIMARY_CATEGORIES: Category[] = ['casa', 'moda', 'eletronicos'];
export const MORE_CATEGORIES: Category[] = ['esportes', 'bebe', 'lazer'];

export const CONDITION_LABELS: Record<Condition, string> = {
	novo: 'Novo',
	como_novo: 'Como novo',
	muito_bom: 'Muito bom',
	bom: 'Bom'
};

export const CONDITION_LONG: Record<Condition, string> = {
	novo: 'Novo com etiqueta',
	como_novo: 'Usado · como novo',
	muito_bom: 'Usado · muito bom',
	bom: 'Usado · bom'
};

export const CONDITION_STATE: Record<Condition, string> = {
	novo: 'Novo',
	como_novo: 'Como novo',
	muito_bom: 'Muito bom estado',
	bom: 'Bom estado'
};
