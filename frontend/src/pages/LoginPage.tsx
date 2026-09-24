import { useState } from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";
import {
	Button,
	Card,
	Input,
	message,
} from "antd";

import client from "../api/client";

interface LoginResponse {
	access_token: string;
	token_type: string;
}

function LoginPage() {
	const navigate = useNavigate();

	const [username, setUsername] = 
		useState("");

	const [password, setPassword] =
		useState("");

	const [loading, setLoading] =
		useState(false);

	const handleLogin = async() => {
		const normalizedUsername =
			username.trim();

		if (!normalizedUsername) {
			message.warning("请输入用户名");
			return;
		}

		if (!password) {
			message.warning("请输入密码");
			return;
		}

		setLoading(true);

		try {
			const formData = new URLSearchParams();

			formData.append(
				"username",
				normalizedUsername,
			);

			formData.append(
				"password",
				password,
			);

			const response = 
				await client.post<LoginResponse>(
					"/auth/login",
					formData,
					{
						headers: {
							"Content-Type":
								"application/x-www-form-urlencoded",
						},
					},
				);

			localStorage.setItem(
				"access_token",
				response.data.access_token,
			);

			localStorage.setItem(
				"token_type",
				response.data.token_type,
			);

			message.success("登陆成功");

			navigate("/chat",{
				replace: true,
			});
		} catch (error: unknown) {
			if ( axios.isAxiosError(error)) {
				const detail = error.response?.data?.detail;

				message.error(
					typeof detail === "string"? detail: "用户名或密码错误",
				);
			} else {
				message.error(
					"登陆失败，请稍后重试",
				);
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			style={{
				width: "100%",
				minHeight: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: 24,
				background:
					"linear-gradient(135deg, #e6f4ff 0%, #f5f7fa 100%)",
			}}
		>
		<Card
			title="AI SQL Assistant"
			style={{
				width: "100%",
				maxWidth: 420,
				boxShadow:
					"0 10px 32px rgba(0, 0, 0. 0.08)",
			}}
		>
		<Input
			size="large"
			placeholder="用户名或邮箱"
			value={username}
			disabled={loading}
			autoComplete="username"
			onChange={(event) =>
				setUsername(
					event.target.value,
				)
			}
			style={{
				marginBottom: 16,
			}}
		/>

		<Input.Password
			size="large"
			placeholder="密码"
			value={password}
			disabled={loading}
			autoComplete="current-password"
			onChange={(event) =>
				setPassword(
					event.target.value,
				)
			}
			onPressEnter={handleLogin}
			style={{
				marginBottom: 20,
			}}
		/>

		<Button
			type="primary"
			size="large"
			block
			loading={loading}
			onClick={handleLogin}
		>
			登陆
		</Button>
		</Card>
		</div>
	);
}

export default LoginPage;

