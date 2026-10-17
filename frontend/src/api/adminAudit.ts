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

export interface SQLAuditStats {
	total: number;
	success_count: number;
	failure_count: number;
	success_rate: number;
	failure_rate: number;
	avg_execution_time_ms: number;
	like_count: number;
	dislike_count: number;
	satisfaction_rate: number;
}

export interface SQLAuditTrendItem {
	date: string;
	count: number;
}

export interface SatisfactionTrendItem {
	date: string;
	satisfaction_rate: number;
}

export interface AuditQualityTrendItem {
	date: string;
	query_count: number;
	like_count: number;
	dislike_count: number;
	satisfaction_rate: number | null;
}

export interface TopQuestionItem {
	question: string;
	count: number;
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

export async function getAuditStats(
	params?: AuditHistoryParams,
): Promise<SQLAuditStats> {
	const response =
		await client.get<SQLAuditStats>(
			"/sql/admin/stats",
			{
				params: {
					keyword: params?.keyword,
					execution_success: params?.execution_success,
				},
			},
		);

	return response.data;
}

export async function getAuditTrend():
	Promise<SQLAuditTrendItem[]> {
		const response =
			await client.get(
				"/sql/admin/trend",
			);

		return response.data;
	}

export async function getSatisfactionTrend():
	Promise<SatisfactionTrendItem[]> {
		const response =
			await client.get(
				"/sql/admin/satisfaction-trend",
			);

		return response.data;
	}

export async function getAuditQualityTrend(
	days = 30,
): Promise<AuditQualityTrendItem[]> {
	const response =
		await client.get<
			AuditQualityTrendItem[]
			>(
				"/sql/admin/quality-trend",
				{
					params: {
						days,
					},
				},
			);

	return response.data;
}

export async function getTopQuestions(
	days = 30,
	limit = 10,
): Promise<TopQuestionItem[]> {
	const response =
		await client.get<TopQuestionItem[]>(
			"/sql/admin/top-questions",
			{
				params: {
					days,
					limit,
				},
			},
		);

	return response.data;
}

export async function exportAuditHistory(
	params?: AuditHistoryParams,
): Promise<Blob> {

	const response =
		await client.get(
			"/sql/admin/export",
			{
				params,
				responseType:
					"blob",
			},
		);

	return response.data;
}

