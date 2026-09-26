import client from "./client";


export interface ChatSession {
	id: number;
	user_id: number;
	title: string;
	created_at: string;
	updated_at: string;
}

export interface ChatMessage {
	id: number;
	session_id: number;
	question: string;
	generated_sql: string;
	sql_explanation: string;
	summary: string;
	columns: string[];
	rows: Record<string, unknown>[];
	row_count: number;
	execution_time_ms: number;
	truncated: boolean;
	created_at: string;
}

export interface ChatSessionDetail {
	id: number;
	title: string;
	created_at: string;
	updated_at: string;
	messages: ChatMessage[];
}

export async function getChatSessions():
	Promise<ChatSession[]> {
	const response =
		await client.get<ChatSession[]>(
			"/chat/sessions",
	);
	
	return response.data;
}

export async function getChatSession(
	sessionId: number,
): Promise<ChatSessionDetail> {
	const response =
		await client.get<ChatSessionDetail>(
			`/chat/sessions/${sessionId}`,
	);

	return response.data;
}

