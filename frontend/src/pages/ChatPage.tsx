import {
	useEffect,
	useState,
	useRef,
} from "react";

import { 
	useLocation,
	useNavigate,
} from "react-router-dom";

import axios from "axios";
import {
	Alert,
	Button,
	Card,
	Divider,
	Modal,
	Input,
	Layout,
	message,
	Popconfirm,
	Space,
	Spin,
	Typography,
} from "antd";

import {
	CheckOutlined,
	CloseOutlined,
	DeleteOutlined,
	EditOutlined,
} from "@ant-design/icons";

import {
	QUERY_TEMPLATES,
} from "../constants/queryTemplates";

import { queryDataWithAI } from "../api/ai";
import {
	deleteChatSession,
	getChatSession,
	getChatSessions,
	updateChatSession,
	type ChatMessage,
	type ChatSession,
} from "../api/chat";

import AnalysisMessage from "../components/AnalysisMessage";

import {
	getFeedbacks,
} from "../api/feedback";

import {
	createFavorite,
	deleteFavorite,
	getFavorites,
	type FavoriteQuery,
} from "../api/favorite";

import {
	getCurrentUser,
	type CurrentUser,
} from "../api/user";

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;
const { TextArea } = Input;

function ChatPage() {
	const navigate = useNavigate();

	const location = useLocation();

	const messagesEndRef =
		useRef<HTMLDivElement | null>(null);

	const [question, setQuestion] =
		useState("");

	const [loading, setLoading] =
		useState(false);

	const [sessions, setSessions] =
		useState<ChatSession[]>([]);

	const [currentSessionId, setCurrentSessionId] =
		useState<number | null>(null);

	const [messages,setMessages] =
		useState<ChatMessage[]>([]);

	const [sessionsLoading, setSessionsLoading] =
		useState(false);
	
	const [queryError, setQueryError] =
		useState<string | null>(null);

	const [editingSessionId, setEditingSessionId] =
		useState<number | null>(null);

	const [editingTitle, setEditingTitle] =
		useState("");

	const [favorites, setFavorites] =
		useState<FavoriteQuery[]>([]);

	const [favoriteModalOpen, setFavoriteModalOpen] =
		useState(false);

	const [favoriteTitle, setFavoriteTitle] =
		useState("");

	const [favoriteQuestion, setFavoriteQuestion] =
		useState("");

	const [ currentUser, setCurrentUser] =
		useState<
			CurrentUser | null
		>(null);

	const [feedbackMap, setFeedbackMap] =
		useState<
			Record<
				number,
				"LIKE"
				|
				"DISLIKE"
			>
		>(
			{},
		);

	const loadSessions = async () => {
		setSessionsLoading(true);
		
		try {
			const data = await getChatSessions();
			setSessions(data);
		} catch {
			message.error("会话列表加载失败");
		} finally {
			setSessionsLoading(false);
		}
	};

	const loadFeedbacks =
		async () => {
			try {
				const data =
					await getFeedbacks();

				const map:
					Record<
						number,
						"LIKE"
						|
						"DISLIKE"
					> = {};

				data.forEach(
					(
						feedback,
					) => {
						map[
							feedback.message_id
						] =
							feedback.feedback_type;
					},
				);

				setFeedbackMap(map);
			} catch {
				//
			}
		};

	const loadFavorites =async () => {
		try {
			const data =
				await getFavorites();

			setFavorites(data);
		} catch {
			message.error("收藏加载失败");
		}
	};

	const handleNewSession = () => {
		setCurrentSessionId(null);
		setMessages([]);
		setQuestion("");
	};

	const handleSelectSession = async (
		sessionId: number,
	) => {
		try {
			const detail = await getChatSession(
				sessionId,
			);

			setCurrentSessionId(detail.id);
			setMessages(detail.messages);
			setQuestion("");

		} catch {
			message.error("会话详情加载失败");
		}
	};

	const loadCurrentUser =
		async () => {
			try {
				const data =
					await getCurrentUser();

				setCurrentUser(data);
			} catch {
				//
			}
		};
	
	useEffect(() => {
		const routeState =
			location.state as {
			permissionDenied?:
				boolean;
			}
			| null;

		if (
			!routeState
				?.permissionDenied
		) {
			return;
		}

		message.warning({
			key: "permission-denied",
			content:
				"当前账户没有管理员权限",
			duration: 3,
		});

		navigate(
			"/chat",
			{
				replace: true,
				state: null,
			},
		);
	}, [
		location.state,
		navigate,
	]);

	useEffect(() => {
		void loadSessions();
		void loadFavorites();
		void loadCurrentUser();
		void loadFeedbacks();
	}, []);

	useEffect(() => {
		if (messages.length === 0) {
			return;
		}

		messagesEndRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "end",
		});
	}, [messages]);

	const handleStartRename = (
		session: ChatSession,
	) => {
		setEditingSessionId(session.id);
		setEditingTitle(session.title);
	};

	const handleCancelRename = () => {
		setEditingSessionId(null);
		setEditingTitle("");
	};

	const handleSaveRename = async (
		sessionId: number,
	) => {
		const normalizedTitle =
			editingTitle.trim();

		if (!normalizedTitle) {
			message.warning(
				"会话标题不能为空",
			);
			return;
		}

		const originalSession =
			sessions.find(
				(session) =>
				session.id === sessionId,
			);

		if (
			originalSession &&
				originalSession.title === normalizedTitle
		) {
			handleCancelRename();
			return;
		}

		if (normalizedTitle.length > 200) {
			message.warning(
				"会话标题不能超过200个字符",
			);
			return;
		}

		try {
			const updatedSession =
				await updateChatSession(
					sessionId,
					{
						title: normalizedTitle,
					},
				);

			setSessions((currentSessions) =>
							currentSessions.map((session) =>
									    session.id === sessionId
										    ? updatedSession
										    : session,
									   ),
				   );

			setEditingSessionId(null);
			setEditingTitle("");

			message.success(
				"会话标题已更新",
			);
		} catch (error: unknown) {
			if (axios.isAxiosError(error)) {
				const detail =
					error.response?.data?.detail;

				message.error(
					typeof detail === "string"
						? detail
						: "修改会话标题失败",
				);
			} else {
				message.error(
					"修改会话标题失败",
				);
			}
		}
	};

	const handleDeleteSession = async (
		sessionId: number,
	) => {
		try {
			await deleteChatSession(
				sessionId,
			);

			setSessions((currentSessions) =>
				currentSessions.filter(
					(session) =>
					session.id !== sessionId,
				),
			);

			if (
				editingSessionId === sessionId
			) {
				setEditingSessionId(null);
				setEditingTitle("");
			}

			if (
				currentSessionId === sessionId
			) {
				setCurrentSessionId(null);
				setMessages([]);
				setQuestion("");
				setQueryError(null);
			}

			message.success("会话已删除");
		} catch (error: unknown) {
			if (axios.isAxiosError(error)) {
				const detail =
					error.response?.data?.detail;

				message.error(
					typeof detail === "string"
					? detail
					: "删除会话失败",
				);
			} else {
				message.error("删除会话失败");
			}
		}
	};

	const handleTemplateClick = (
		templateQuestion: string,
	) => {
		setQuestion(templateQuestion);
	};

	const handleOpenFavorite = (
		question: string,
	) => {
		setFavoriteQuestion(question);
		setFavoriteTitle(
			question.slice(0, 30),
		);
		setFavoriteModalOpen(true);
	};

	const handleCloseFavorite = () => {
		setFavoriteModalOpen(false);
		setFavoriteTitle("");
		setFavoriteQuestion("");
	};

	const handleSaveFavorite =
		async () => {
			const normalizedTitle =
				favoriteTitle.trim();

			if (!normalizedTitle) {
				message.warning(
					"请输入收藏标题",
				);
				return;
			}

			try {
				const favorite =
					await createFavorite({
						title: normalizedTitle,
						question:favoriteQuestion,
					});

					setFavorites(
						(currentFavorites) => [
							favorite,
							...currentFavorites,
						],
					);

					handleCloseFavorite();

					message.success(
						"查询已收藏",
					);
			} catch {
				message.error(
					"收藏查询失败",
				);
			}
		};

	const handleDeleteFavorite =
		async (favoriteId: number) => {
			try {
				await deleteFavorite(
					favoriteId,
				);

				setFavorites(
					(currentFavorites) =>
					currentFavorites.filter(
						(favorite) =>
						favorite.id !==
							favoriteId,
					),
				);

				message.success(
					"收藏已删除",
				);
			} catch {
				message.error(
					"删除收藏失败",
				);
			}
		};

	const handleSubmit = async () => {
		if (loading) {
			return;
		}
		const normalizedQuestion =
			question.trim();
		
		if (!normalizedQuestion) {
			message.warning("请输入分析问题");
			return;
		}

		setLoading(true);
		setQueryError(null);

		try {
			const response =
				await queryDataWithAI({
					question: normalizedQuestion,
					session_id: currentSessionId,
				});

			setCurrentSessionId(
				response.session_id,
			);
			setQuestion("");

			await loadSessions();
			const detail = await getChatSession(
				response.session_id,
			);

			setMessages(detail.messages);

		} catch (error: unknown) {
			let errorText =
				"AI查询失败，请稍后重试";

			if (axios.isAxiosError(error)) {
				const detail =
					error.response?.data?.detail;

				if (typeof detail === "string") {
					errorText = detail;
				} else if(error.response?.status) {
					errorText =
						`AI查询失败，HTTP状态码：` +
							error.response.status;
				}
			}

			setQueryError(errorText);
			message.error(errorText);
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = () => {
		localStorage.removeItem(
			"access_token",
		);

		localStorage.removeItem(

			"token_type",
		);

		navigate("/login", {
			replace: true,
		});
	};


	return (
		<Layout
			style={{
				minHeight: "100vh",
			}}
		>
		<Header
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent:
					"space-between",
				padding: "0 32px",
				background: "#ffffff",
				borderBottom:
					"1px solid #f0f0f0",
			}}
		>
		<Title
			level={3}
			style={{
				margin: 0,
			}}
		>
			AI SQL Assistant
		</Title>

		<Space>

			{currentUser?.role
				?.toUpperCase() ===
				"ADMIN" && (
					<Button
						onClick={() => {
							navigate("/admin/audits");
						}}
					>
						管理员审计
					</Button>
				)
			}

			<Button
				onClick={() =>
					navigate("/history")
				}
			>
				查询历史
			</Button>

			<Button
				danger
				onClick={handleLogout}
			>
				退出登陆
			</Button>

		</Space>
		</Header>

		<Layout>
		<Sider
			width={280}
			theme="light"
			style={{
				padding: 16,
				borderRight:
					"1px solid #f0f0f0",
			}}
		>
		<Button
			type="primary"
			block
			onClick={handleNewSession}
			style={{
				marginBottom: 16,
			}}
		>
			新建分析
		</Button>

		{sessionsLoading ? (
			<div
				style={{
					display: "flex",
						justifyContent: "center",
						padding: 24,
				}}
			>
				<Spin />
			</div>
		) : (
			<div>
				{sessions.map((session) => {
					const isActive =
					session.id === currentSessionId;

					const isEditing =
						session.id === editingSessionId;

					return(
						<div
							key={session.id}
							style={{
								display: "flex",
								alignItems: "center",
								gap: 4,
								marginBottom: 8,
							}}
						>
							{isEditing ? (
								<Input
									value={editingTitle}
									autoFocus
									maxLength={200}
									placeholder="输入会话标题"
									onChange={(event) => {
										setEditingTitle(
											event.target.value,
										);
									}}
									onPressEnter={() => {
										void handleSaveRename(
											session.id,
										);
									}}
									onKeyDown={(event) => {
										if (event.key === "Escape") {
											handleCancelRename();
										}
									}}
									style={{
										flex: 1,
										minWidth: 0,
									}}
								/>
							) : (
							<Button
								type={
									isActive
									? "primary"
									: "text"
								}
								onClick={() => {
									void handleSelectSession(
										session.id,
									);
								}}
								style={{
									flex: 1,
									minWidth: 0,
									height: 42,
									padding: "0 12px",
									overflow: "hidden",
									borderRadius: 6,
								}}
							>
								<Typography.Text
									ellipsis={{
										tooltip: session.title,
									}}
									style={{
										display: "block",
										width: "100%",
										textAlign: "left",
										color: isActive
											? "#ffffff"
											: "#262626",
									}}
								>
									{session.title}
								</Typography.Text>
							</Button>
							)}

							{isEditing ? (
								<>
									<Button
										type="text"
										aria-label="保存会话标题"
										icon={<CheckOutlined />}
										onClick={() => {
											void handleSaveRename(
												session.id,
											);
										}}
									/>
									<Button
										type="text"
										aria-label="取消编辑"
										icon={<CloseOutlined />}
										onClick={handleCancelRename}
									/>
								</>
							) : (
								<>
									<Button
										type="text"
										aria-label={
											`修改会话标题：${session.title}`
										}
										icon={<EditOutlined />}
										onClick={() => {
											handleStartRename(session);
										}}
									/>

							<Popconfirm
								title="删除会话"
								description="确定删除该会话及其全部分析记录吗？"
								okText="删除"
								cancelText="取消"
								okButtonProps={{
									danger: true,
								}}
								onConfirm={() => {
									void handleDeleteSession(
										session.id,
									);
								}}
							>
								<Button
									type="text"
									danger
									aria-label={`删除会话：${session.title}`}
									icon={<DeleteOutlined/>}
								/>
							</Popconfirm>
								</>
							)}
						</div>
					);
				})}
			</div>
			)}
		</Sider>

		<Content
			style={{
				width: "100%",
				maxWidth: 1200,
				margin: "0 auto",
				padding: 32,
			}}
		>
		<Card
			title="智能数据分析"
			style={{
				marginBottom: 24,
			}}
		>
			{currentSessionId !==null && (
				<Text type="secondary">
					当前会话共 {messages.length} 条分析记录
				</Text>
			)}

			<Space
				wrap
				size="small"
				style={{
					marginBottom: 16,
				}}
			>
				{QUERY_TEMPLATES.map(
					(template) => (
						<Button
							key={template.key}
							size="small"
							type="dashed"
							onClick={() =>
								handleTemplateClick(
									template.question,
								)
							}
						>
							{template.label}
						</Button>
					),
				)}
			</Space>

			{favorites.length >0 && (
				<>
					<Divider
						plain
					>
						我的收藏
					</Divider>

					<Space
						wrap
						size="small"
						style={{
							marginBottom: 16,
						}}
					>
						{favorites.map((favorite) => (
								<div
									key={favorite.id}
									style={{
										display: "inline-flex",
										alignItems: "center",
									}}
								>
									<Button
										size="small"
										onClick={() => {
											setQuestion(
												favorite.question,
											);
										}}
									>
										{favorite.title}
									</Button>

									<Popconfirm
										title="删除收藏"
										description="确定删除这个常用查询吗？"
										okText="删除"
										cancelText="取消"
										okButtonProps={{
											danger: true,
										}}
										onConfirm={() => {
											void handleDeleteFavorite(
												favorite.id,
											);
										}}
									>
										<Button
											size="small"
											type="text"
											danger
										>
											x
										</Button>
									</Popconfirm>
								</div>
						))}
					</Space>
				</>
			)}

		<TextArea
			value={question}
			disabled={loading}
			placeholder={
				"例如：统计不同测试状态的数量"
			}
			autoSize={{
				minRows: 3,
				maxRows: 8,
			}}
			onChange={(event) =>
				setQuestion(
					event.target.value,
				)
			}
			onKeyDown={(event) => {
				if (
					event.ctrlKey &&
					event.key === "Enter" &&
					!loading
				) {
					event.preventDefault();
					void handleSubmit();
				}
			}}
		/>

		<div
			style={{
				marginTop: 16,
				display: "flex",
				justifyContent:
					"space-between",
				alignItems: "center",
			}}
		>
		<Text type="secondary">
			按 Ctrl + Enter 发送
		</Text>

		<Button
			type="primary"
			size="large"
			loading={loading}
			disabled={loading}
			onClick={() =>
				void handleSubmit()
			}
		>
			开始分析
		</Button>
		</div>
		</Card>

		{queryError && (
			<Alert
				type="error"
				showIcon
				closable
				message="分析请求失败"
				description={queryError}
				onClose={() => {
					setQueryError(null);
				}}
				style={{
					marginBottom: 16,
				}}
			/>
		)}
		{loading && (
			<Card>
				<div
					style={{
						minHeight: 180,
						display: "flex",
						alignItems: "center",
						justifyContent:
							"center",
					}}
				>
					<Space orientation="vertical">
						<Spin size="large" />
						<Text>
							AI正在生成SQL并分析数据...
						</Text>
					</Space>
				</div>
			</Card>
		)}

		{!loading && messages.length === 0 && (
			<Card>
				<div
					style={{
						minHeight: 180,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						color: "#8c8c8c",
					}}
				>
					输入一个数据分析问题开始新会话
				</div>
			</Card>
		)}

		{messages.length > 0 && (
			<Space
				orientation="vertical"
				size={32}
				style={{
					width: "100%",
				}}
			>
				{messages.map((chatMessage) => (
					<AnalysisMessage
						key={chatMessage.id}
						message={chatMessage}
						onFavorite={
							handleOpenFavorite
						}
						feedbackType={
							feedbackMap[
								chatMessage.id
							]
						}

						onFeedbackChange={(
							messageId,
							feedbackType,
						) => {
							setFeedbackMap(
								current => ({
									...current,
									[messageId]:
										feedbackType,
								}),
							);
						}}
					/>
				))}
			</Space>
		)}

		<div ref={messagesEndRef} />

		</Content>
		</Layout>
			<Modal
				title="收藏常用查询"
				open={favoriteModalOpen}
				okText="收藏"
				cancelText="取消"
				onOk={() =>
					void handleSaveFavorite()
				}
				onCancel={
					handleCloseFavorite
				}
			>
				<Input
					value={favoriteTitle}
					maxLength={200}
					placeholder="输入收藏标题"
					onChange={(event) =>
						setFavoriteTitle(
							event.target.value,
						)
					}
					onPressEnter={() =>
						void handleSaveFavorite()
					}
				/>

				<Typography.Paragraph
					type="secondary"
					style={{
						marginTop: 16,
						marginBottom: 0,
					}}
				>
					{favoriteQuestion}
				</Typography.Paragraph>
			</Modal>
		</Layout>
	);
}

export default ChatPage;

