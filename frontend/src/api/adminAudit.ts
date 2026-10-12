import client from "./client";

export interface SQLAudit {
	id: number;
	user_id: number;
	username: string;
	question: string | null;
	sql_text: string;
	validation_passed: boolean;
	execution_success: boolean;
	row_count: number | null;
	execution_time_ms: number | null;
	error_message: string | null;
	created_at: string;
}

export async function getAuditHistory(
	params?: {
		keyword?: string;
		execution_success?: boolean;
	},
):
	Promise<SQLAudit[]> {

		const response =
			await client.get(
					"/sql/admin/history",
					{
						params,
					},
				);

		return response.data;
	}


