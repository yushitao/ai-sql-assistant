import axios from "axios";

let isRedirectingToLogin = false;

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
	(response) => response,

	(error: unknown) => {
		if (!axios.isAxiosError(error)) {
			return Promise.reject(error);
		}

		const status = error.response?.status;

		const requestUrl = error.config?.url ?? "";

		const isLoginRequest = requestUrl.includes(
			"/auth/login",
		);

		if (
			status === 401 &&
			!isLoginRequest &&
			!isRedirectingToLogin
		) {
			isRedirectingToLogin = true;

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


