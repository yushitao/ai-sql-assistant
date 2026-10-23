import axios from "axios";

import {
	markErrorAsHandled,
	NETWORK_ERROR_EVENT,
} from "./errorHandling";

let isRedirectingToLogin = false;

let networkErrorEventSent = false;

const client = axios.create({
	baseURL: "http://127.0.0.1:8000/api/v1",
	timeout: 120000,
});

client.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("access_token");

		if (token) {
			config.headers.Authorization = 
				`Bearer ${token}`;
		}

		return config;
	},
	(error) => Promise.reject(error),
);

/*
client.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem("access_token");
			localStorage.removeItem("token_type");

			if (window.location.pathname !== "/login") {
				window.location.href = "/login";
			}
		}

		return Promise.reject(error);
	},
);
*/

client.interceptors.response.use(
	(response) => {
		/*
		 * 只要收到后端响应，
		 * 就说明服务器已经恢复连接。
		 */
		networkErrorEventSent = false;
		return response;
	},

	(error: unknown) => {
		if (!axios.isAxiosError(error)) {
			return Promise.reject(error);
		}

		const status = error.response?.status;

		const requestUrl = error.config?.url ?? "";

		const isLoginRequest = requestUrl.includes(
			"/auth/login",
		);

		/*
		 * 没有response表示请求没有收到
		 * HTTP响应，通常是后端停止、
		 * 连接被拒绝或网络中断。
		 */
		if (!error.response) {
			markErrorAsHandled(error);

			if (!networkErrorEventSent) {
				networkErrorEventSent = true;

				window.dispatchEvent(
					new CustomEvent(
						NETWORK_ERROR_EVENT,
					),
				);

				window.setTimeout(() => {
					networkErrorEventSent = false;
				},
				3000,
				);
			}

			return Promise.reject(error);
		}

		if (
			status === 401 &&
			!isLoginRequest &&
			!isRedirectingToLogin
		) {
			isRedirectingToLogin = true;

			markErrorAsHandled(error);

			localStorage.removeItem(
				"access_token",
			);

			localStorage.removeItem(
				"token_type",
			)

			sessionStorage.setItem(
				"auth_notice",
				"登陆状态已失效，请重新登陆",
			);

			sessionStorage.setItem(
				"auth_notice_type",
				"token_expired",
			);

			if (
				window.location.pathname
				!== "/login"
			) {
				window.location.replace(
					"/login",
				);
			} else {
				isRedirectingToLogin = false;
			}
		}

		return Promise.reject(
			error,
		);
	},
);

export default client;


