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

export interface SQLAuditPage {
	items: SQLAudit[];
	total: number;
	limit: number;
	offset: number;
}

export interface AuditHistoryParams {
	keyword?: string;
	execution_success?: boolean;
	limit?: number;
	offset?: number;
}

export async function getAuditHistory(
	params?: AuditHistoryParams,
):
	Promise<SQLAuditPage> {

		const response =
			await client.get(
					"/sql/admin/history",
					{
						params,
					},
				);

		return response.data;
	}


