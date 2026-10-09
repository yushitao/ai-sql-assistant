import client from "./client";

export interface CurrentUser {
	id: number;
	username: string;
	role: string;
}

export async function getCurrentUser():
	Promise<CurrentUser> {

		const response =
			await client.get<
				CurrentUser
				>(
					"/users/me",
				);

		return response.data;
	}

