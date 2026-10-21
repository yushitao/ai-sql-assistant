import axios from "axios";

export const NETWORK_ERROR_EVENT = "app:network-error";

export interface HandledAxiosError {
	globallyHandled?: boolean;
}

export function markErrorAsHandled(
	error: unknown,
): void {
	if (!axios.isAxiosError(error)) {
		return;
	}

	const handledError =
		error as typeof error &
		HandledAxiosError;

	handledError.globallyHandled = true;
}

export function isGloballyHandledError(
	error: unknown,
): boolean {
	if (!axios.isAxiosError(error)) {
		return false;
	}

	const handledError =
		error as typeof error &
		HandledAxiosError;

	return (
		handledError.globallyHandled === true
	);
}

export function isNetworkError(
	error: unknown,
): boolean {
	return (
		axios.isAxiosError(error)
			&& error.response === undefined
	);
}


