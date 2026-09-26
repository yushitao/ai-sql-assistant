export interface AIQueryRequest {
	question: string;
	session_id?: number | null;
}

export interface AIQueryResponse {
	session_id: number;
	message_id: number;

	question: string;
	generated_sql: string;
	sql_explanation: string;
	summary: string;
	columns: string[];
	rows: Record<string, unknown>[];
	row_count: number;
	execution_time_ms: number;
	truncated: boolean;
}

