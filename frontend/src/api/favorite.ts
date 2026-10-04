import client from "./client";

export interface FavoriteQuery {
	id: number;
	title: string;
	question: string;
	created_at:string;
}

export interface CreateFavoriteRequest {
	title: string;
	question: string;
}

export async function getFavorites():
	Promise<FavoriteQuery[]> {
		const response =
			await client.get<FavoriteQuery[]>(
				"/favorites",
			);

		return response.data;
	}

export async function createFavorite(
	request: CreateFavoriteRequest,
): Promise<FavoriteQuery> {
	const response =
		await client.post<FavoriteQuery>(
			"/favorites",
			request,
		);

	return response.data;
}

export async function deleteFavorite(
	favoriteId: number,
): Promise<void> {
	await client.delete(
		`/favorites/${favoriteId}`,
	);
}

