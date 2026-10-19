/*
 * 优化ProtectedRoute 主动验证 Token + 管理员路由提前鉴权
import {
	Navigate,
	Outlet,
} from "react-router-dom";

function ProtectedRoute() {
	const token = localStorage.getItem(
		"access_token",
	);

	if(!token) {
		return (
			<Navigate
				to="/login"
				replace
			/>
		);
	}

	return <Outlet />;
}

export default ProtectedRoute;
 */

import {
	useEffect,
	useState,
} from "react";

import {
	Button,
	Result,
	Spin,
} from "antd";

import {
	Navigate,
	Outlet,
	useLocation,
} from "react-router-dom";

import {
	getCurrentUser,
	type CurrentUser,
} from "../api/user";

type RequiredRole =
	| "ADMIN"
	| "USER";

interface ProtectedRouteProps {
	requiredRole?: RequiredRole;
}

function ProtectedRoute({
	requiredRole,
}: ProtectedRouteProps) {
	const location = useLocation();

	const [
		currentUser,
		setCurrentUser,
	] = useState<
	CurrentUser | null
	>(null);

	const [
		checking,
		setChecking,
	] = useState(true);

	const [
		networkError,
		setNetworkError,
	] = useState(false);

	const [
		retryKey,
		setRetryKey,
	] = useState(0);

	const token =
		localStorage.getItem(
			"access_token",
		);

	useEffect(() => {
		if (!token) {
			setChecking(false);
			return;
		}

		let cancelled = false;

		const checkCurrentUser =
			async () => {
				setChecking(true);
				setNetworkError(false);

				try {
					const user =
						await getCurrentUser();
					
					if (!cancelled) {
						setCurrentUser(user);
					}
				} catch {
					/*
					 * 401已由client.ts的全局拦截器处理：
					 * 清除Token并跳转/login。
					 *
					 * 这里的错误主要用于处理：
					 * 后端关闭、网路不可用等情况。
					 */
					if (
						!cancelled &&
						localStorage.getItem(
							"access_token",
						)
					) {
						setNetworkError(true);
					}
				} finally {
					if (!cancelled) {
						setChecking(false);
					}
				}
			};
		void checkCurrentUser();

		return () => {
			cancelled = true;
		};
	}, [
		token,
		retryKey,
	]);

	if (!token) {
		return (
			<Navigate
				to="/login"
				replace
				state={{
					from: location.pathname,
				}}
			/>
		);
	}

	if (checking) {
		return (
			<div
				style={{
					minHeight: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<Spin
					size="large"
					description="正在验证登陆状态"
				/>
			</div>
		);
	}

	if (networkError) {
		return (
			<Result
				status="warning"
				title="暂时无法连接服务器"
				subTitle={
					"请确认后端服务正常运行后重试。当前登陆信息未被清除。"
				}
				extra={
					<Button
						type="primary"
						onClick={() => {
							setRetryKey(
								(current) =>
								current + 1,
							);
						}}
					>
						重新连接
					</Button>
				}
			/>
		);
	}

	/*
	 * Token失效时client.ts会删除Token。
	 * 此处作为额外兜底
	 * /
	 */
	if(!currentUser) {
		return (
			<Navigate
				to="/login"
				replace
			/>
		);
	}

	const normalizedRole =
		currentUser.role
		?.toUpperCase();

	if (
		requiredRole &&
			normalizedRole
		!== requiredRole
	) {
		return (
			<Navigate
				to="/chat"
				replace
				state={{
					permissionDenied: true,
				}}
			/>
		);
	}

	return <Outlet />;
}

export default ProtectedRoute;




