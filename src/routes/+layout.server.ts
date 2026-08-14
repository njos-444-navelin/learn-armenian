import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals: { claims }, cookies }) => {
	return { claims, cookies: cookies.getAll() };
};
