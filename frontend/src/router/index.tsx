import {
	BrowserRouter,
	Routes,
	Route,
	Navigate,
} from "react-router-dom"

import LoginPage from "../pages/LoginPage";
import ChatPage from "../pages/ChatPage";
import HistoryPage from "../pages/HistoryPage";

import ProtectedRoute from "./ProtectedRoute";

import AdminAuditPage from "../pages/AdminAuditPage";

function AppRouter() {
	return (
		<BrowserRouter>
			<Routes>
				<Route	
					path="/"
					element={
						<Navigate
							to="/chat"
							replace
						/>
					}
				/>

				<Route
					path="/login"
					element={<LoginPage />}
				/>

				{/*普通登陆用户可访问 */}

				<Route element={<ProtectedRoute />}>
					<Route
						path="/chat"
						element={<ChatPage />}
					/>

					<Route
						path="/history"
						element={<HistoryPage />}
					/>
				</Route>

				{/* 仅管理员可访问 */}
				<Route
					element={
						<ProtectedRoute
							requiredRole="ADMIN"
						/>
					}
				>
					<Route
						path="/admin/audits"
						element={<AdminAuditPage />}
					/>
				</Route>

				<Route
					path="*"
					element={
						<Navigate
							to="/chat"
							replace
						/>
					}
				/>
			</Routes>
		</BrowserRouter>
	);
}

export default AppRouter;		



