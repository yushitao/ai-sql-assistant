import client from "./client";

export interface SqlHistoryItem {
	id: number;
	user_id: number;
	sql_text: string;
	validation_passed: boolean;
	execution_success: boolean;
	row_count: number;
	execution_time_ms: number | null;
	error_message: string | null;
	created_at: string;
}

export async function getSqlHistory() {
	const response =
		await client.get<SqlHistoryItem[]>(
			"/sql/history",
	);

	return response.data;
}

