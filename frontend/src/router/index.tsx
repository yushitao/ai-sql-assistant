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



