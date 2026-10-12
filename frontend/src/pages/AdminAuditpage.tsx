import {
	useNavigate,
} from "react-router-dom";

import {
	useEffect,
	useState,
} from "react";

import {
	Button,
	Card,
	Input,
	Modal,
	message,
	Radio,
	Space,
	Table,
	Tag,
	Typography,
} from "antd";

import {
	getAuditHistory,
	type SQLAudit,
} from "../api/adminAudit";

import {
	getCurrentUser,
} from "../api/user";

function AdminAuditPage() {
	const navigate = useNavigate();

	const [
		audits,
		setAudits,
	] = useState<SQLAudit[]>([]);

	const [
		keyword,
		setKeyword,
	] = useState("");

	const [
		statusFilter,
		setStatusFilter,
	] = useState<
	"all" | "success" | "failed"
	>(
		"all",
	);

	const [
		loading,
		setLoading,
	] = useState(false);

	const [
		selectedAudit,
		setSelectedAudit,
	] = useState<
		SQLAudit | null
	>(null);

	const loadAudits =
		async () => {
			setLoading(true);

			try {
				const data =
					await getAuditHistory(
						{
							keyword:
								keyword ||
								undefined,

							execution_success:
								statusFilter ===
								"all"
									? undefined
									: statusFilter ===
										"success",
						}
					);
				
				setAudits(data);
			} catch {
				message.error(
					"审计记录加载失败",
				);
			} finally {
				setLoading(false);
			}
		};

	useEffect(() => {
		const checkAdmin =
			async () => {
				try {
					const user =
						await getCurrentUser();

					if (
						user.role
							?.toUpperCase() !==
							"ADMIN"
					) {
						message.error(
							"无权限访问管理页面",
						);

						navigate(
							"/chat",
							{
								replace: true,
							},
						);
					}

				} catch {
					message.error(
						"用户信息获取失败",
					);

					navigate(
						"/chat",
						{
							replace: true,
						},
					);
				}
			};

		void checkAdmin();
	}, [navigate]);

	useEffect(() => {
		void loadAudits();
	}, []);

	useEffect(() => {
		void loadAudits();
	}, [statusFilter]);

	const columns = [
		{
			title: "ID",
			dataIndex: "id",
		},

		{
			title: "用户",
			dataIndex: "username",
		},

		{
			title: "问题",
			dataIndex: "question",
			width: 260,
			ellipsis: true,
			render: (
				value:string | null,
			) => value ?? "-",
		},

		{
			title:"时间",
			dataIndex: "created_at",

			render: (
				value: string,
			) => {
				return value
				.replace(
					"T",
					" ",
				)
				.slice(
					0,
					19,
				);
			},
		},

		{
			title: "校验",
			dataIndex:
				"validation_passed",
			render: (
				value: boolean,
			) =>
			value ? (
				<Tag color="green">
					通过
				</Tag>
			) : (
				<Tag color="red">
					失败
				</Tag>
			),
		},

		{
			title: "执行",
			dataIndex:
				"execution_success",

			render: (
				value: boolean,
			) =>
			value ? (
				<Tag color="green">
					成功
				</Tag>
			) : (
				<Tag color="red">
					失败
				</Tag>
			),
		},

		{
			title: "返回行数",
			dataIndex: "row_count",
		},

		{
			title: "耗时(ms)",
			dataIndex:
				"execution_time_ms",
		},

		{
			title: "SQL",
			render: (
				_: unknown,
				record: SQLAudit,
			) => (
				<Button
				size="small"
					onClick={() => {
						setSelectedAudit(
							record,
						);
					}}
				>
					查看
				</Button>
			),
		},
	];

	return (
		<Card
			title={
				<Space>
					<span>
						"管理员审计"
					</span>

					<Tag
						color="red"
						style={{
							marginLeft: 8,
						}}
					>
						ADMIN
					</Tag>
				</Space>
			}
			extra={
				<Space>
					<Button
						onClick={() =>
							navigate("/chat")
						}
					>
						返回聊天
					</Button>

					<Button
						loading={loading}
						onClick={() =>
							void loadAudits()
						}
					>
						刷新
					</Button>
				</Space>
			}
		>
			<Space
				style={{
					marginBottom: 16,
				}}
			>
				<Input.Search
					value={keyword}
					allowClear
					style={{
						width: 350,
					}}
					placeholder="搜索SQL关键词"
					onChange={(
						event,
					) => {
						setKeyword(
							event.target.value,
						);
					}}
					onSearch={() => {
						void loadAudits();
					}}
				/>
				
				<Radio.Group
					value={statusFilter}
					onChange={(
						event,
					) => {
						setStatusFilter(
							event.target.value,
						);
					}}
				>
					<Radio.Button
						value="all"
					>
						全部
					</Radio.Button>

					<Radio.Button
						value="success"
					>
						成功
					</Radio.Button>

					<Radio.Button
						value="failed"
					>
						失败
					</Radio.Button>
				</Radio.Group>

				<Button
					onClick={() => {
						void loadAudits();
					}}
				>
					查询
				</Button>

				<Button
					onClick={() => {
						setKeyword("");
						setStatusFilter("all");
						void loadAudits();
					}}
				>
					重置
				</Button>
			</Space>

			<Table
				rowKey="id"
				loading={loading}
				columns={columns}
				dataSource={audits}
			/>
			<Modal
				title={
					<Space>
						<span>
							SQL审计详情
						</span>

						<Button
							size="small"
							onClick={() => {
								void navigator.clipboard.writeText(
									selectedAudit?.sql_text ??
										"",
								);

								message.success(
									"SQL已复制",
								);
							}}
						>
							复制SQL
						</Button>
					</Space>
				}
				width={1000}
				open={selectedAudit !== null}
				footer={null}
				onCancel={() =>
					setSelectedAudit(null)
				}
			>
				<Typography.Title
					level={5}
				>
					用户问题
				</Typography.Title>

				<div
					style={{
						padding: 12,
						marginBottom: 16,
						background: "#fafafa",
						border: "1px solid #d9d9d9",
						borderRadius: 6,
						whiteSpace: "pre-wrap",
						wordBreak: "break-word",
					}}
				> {selectedAudit?.question ??
					"历史记录无问题信息"
					}
				</div>

				<Typography.Title
					level={5}
				>
					SQL
				</Typography.Title>

				<div
					style={{
						background: "#f6f8fa",
						border: "1px solid #d9d9d9",
						borderRadius: 6,
						padding: 12,
						maxHeight: 300,
						overflow: "auto",
						fontFamily: "Consolas, monospace",
						whiteSpace: "pre-wrap",
						wordBreak: "break-word",
					}}
				>
					{selectedAudit?.sql_text}
				</div>

				<Typography.Title
					level={5}
					style={{ marginTop: 16 }}
				>
					错误信息
				</Typography.Title>

				<div
					style={{
						background: "#fff2f0",
						border: "1px solid #ffccc7",
						borderRadius: 6,
						padding: 12,
						whiteSpace: "pre-wrap",
						wordBreak: "break-word",
					}}
				>
					{selectedAudit?.error_message ??
						"无"}
				</div>
			</Modal>
		</Card>
	);
}

export default AdminAuditPage;

