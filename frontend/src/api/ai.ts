import client from "./client";

import type {
	AIQueryRequest,
	AIQueryResponse,
} from "../types/ai";

export async function queryDataWithAI(
	request: AIQueryRequest,
): Promise<AIQueryResponse> {
	const response =
		await client.post<AIQueryResponse>(
			"/ai/query",
			request,
	);

	return response.data;
}

