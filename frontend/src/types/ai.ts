export interface AIQueryRequest {
	question: string;
}

export interface AIQueryResponse {
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

