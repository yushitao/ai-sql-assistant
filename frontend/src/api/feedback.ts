import client from "./client";

export async function submitFeedback(
	messageId: number,
	feedbackType:
		| "LIKE"
		| "DISLIKE",
): Promise<void> {
	await client.post(
		"/feedback",
		{
			message_id: messageId,
			feedback_type: feedbackType,
		},
	);
}

export interface Feedback {
	message_id: number;
	feedback_type:
		| "LIKE"
		| "DISLIKE";
}

export async function getFeedbacks():
	Promise<Feedback[]> {
		const response =
			await client.get(
				"/feedback",
			);

		return response.data;
	}

