import {
	useEffect,
} from "react";

import {
	App,
} from "antd";

import {
	NETWORK_ERROR_EVENT,
} from "../api/errorHandling";

function NetworkErrorNotifier() {
	const {
		message: messageApi,
	} = App.useApp();

	useEffect(() => {
		const handleNetworkError =
			() => {
				messageApi.error({
					key:
						"global-network-error",
					content:
						"无法连接服务器，请检查后端服务是否正常运行",
					duration: 4,
				});
			};

		window.addEventListener(
			NETWORK_ERROR_EVENT,
			handleNetworkError,
		);

		return () => {
			window.removeEventListener(
				NETWORK_ERROR_EVENT,
				handleNetworkError,
			);
		};
	}, [
		messageApi,
	]);

	return null;
}

export default NetworkErrorNotifier;

