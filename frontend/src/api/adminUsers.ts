import client from "./client";

export type UserRole =
	| "user"
	| "admin";

export interface AdminUser {
	id: number;
	username: string;
	email: string | null;
	role: UserRole;
	is_active: boolean;
	created_at: string;
}

export interface AdminUserPage {
	items: AdminUser[];
	total: number;
	page: number;
	page_size: number;
}

export interface AdminUserParams {
	page: number;
	page_size: number;
	keyword?: string;
	role?: UserRole;
	is_active?: boolean;
}

export interface AdminUserCreate {
	username: string;
	email?: string;
	password: string;
	role: UserRole;
}

export async function getAdminUsers(
	params: AdminUserParams,
): Promise<AdminUserPage> {
	const response =
		await client.get<AdminUserPage>(
			"/users/admin",
			{
				params,
			},
		);

	return response.data;
}

export async function createAdminUser(
	data: AdminUserCreate,
): Promise<AdminUser> {
	const response =
		await client.post<AdminUser>(
			"/users/admin",
			data,
		);

	return response.data;
}

export async function updateAdminUserStatus(
	userId: number,
	isActive: boolean,
): Promise<AdminUser> {
	const response =
		await client.patch<AdminUser>(
			`/users/admin/${userId}/status`,
			{
				is_active: isActive,
			},
		);

	return response.data;
}

export async function updateAdminUserRole(
	userId: number,
	role: UserRole,
): Promise<AdminUser> {
	const response =
		await client.patch<AdminUser>(
			`/users/admin/${userId}/role`,
			{
				role,
			},
		);

	return response.data;
}

