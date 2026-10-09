import client from "./client";

export interface SQLAudit {
	id: number;
	user_id: number;
	username: string;
	sql_text: string;
	validation_passed: boolean;
	execution_success: boolean;
	row_count: number | null;
	execution_time_ms: number | null;
	error_message: string | null;
	created_at: string;
}

export async function getAuditHistory():
	Promise<SQLAudit[]> {

		const response =
			await client.get<
				SQLAudit[]
				>(
					"/sql/admin/history",
				);

		return response.data;
	}


