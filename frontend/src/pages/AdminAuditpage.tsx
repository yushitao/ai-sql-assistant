import {
	useNavigate,
} from "react-router-dom";

import ReactECharts
from "echarts-for-react";

import {
	useEffect,
	useState,
} from "react";

import {
	Button,
	Card,
	Col,
	Input,
	message,
	Modal,
	Radio,
	Row,
	Space,
	Statistic,
	Table,
	Tag,
	Typography,
} from "antd";

import {
	exportAuditHistory,
	getAuditHistory,
	getAuditStats,
	getAuditTrend,
	type SQLAudit,
	type SQLAuditStats,
	type SQLAuditTrendItem,
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
		total,
		setTotal,
	] = useState(0);

	const [
		currentPage,
		setCurrentPage,
	] = useState(1);

	const [
		pageSize,
		setPageSize,
	] = useState(20);

	const [
		selectedAudit,
		setSelectedAudit,
	] = useState<
		SQLAudit | null
	>(null);

	const [
		stats,
		setStats,
	] = useState<SQLAuditStats>({
		total: 0,
		success_count: 0,
		failure_count: 0,
		success_rate: 0,
		failure_rate: 0,
		avg_execution_time_ms: 0,
		like_count: 0,
		dislike_count: 0,
		satisfaction_rate: 0,
	});

	const [
		statsLoading,
		setStatsLoading,
	] = useState(false);

	const [
		trendData,
		setTrendData,
	] = useState<SQLAuditTrendItem[]>([]);

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
									limit: pageSize,
									offset:
										(currentPage - 1) * pageSize
						}
					);
				
				setAudits(data.items);
				setTotal(data.total);
			} catch {
				message.error(
					"审计记录加载失败",
				);
			} finally {
				setLoading(false);
			}
		};

	const loadStats = async () => {
		setStatsLoading(true);

		try {
			const executionSuccess =
				statusFilter === "all"
					? undefined
					: statusFilter === "success";
			const data =
				await getAuditStats({
					keyword:
						keyword ||
						undefined,

					execution_success:
						executionSuccess,
				});

			setStats(data);
		} catch {
			message.error(
				"审计统计加载失败",
			);
		} finally {
			setStatsLoading(false);
		}
	};

	const loadTrend = async () => {
		try {
			const data =
				await getAuditTrend();

			setTrendData(data);
		} catch {
			//
		}
	};

	const handleExport =
		async () => {
			try {
				const blob =
					await exportAuditHistory(
						{
							keyword: keyword || undefined,
							execution_success:
								statusFilter ===
								"all"
									? undefined
									: statusFilter ===
										"success",
						},
					);

				const url =
					window.URL.createObjectURL(
						blob,
					);

				const link =
					document.createElement(
						"a",
					);

				link.href = url;

				link.download =
					"sql_audit_export.xlsx";

				document.body.appendChild(
					link,
				);

				link.click();

				document.body.removeChild(
					link,
				);

				window.URL.revokeObjectURL(
					url,
				);

				message.success(
					"导出成功",
				);

			} catch {
				message.error(
					"导出失败",
				);
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

		void loadStats();

		void loadTrend();
	}, []);

	useEffect(() => {
		void loadAudits();

		void loadStats();
	},[statusFilter]
		 );

	useEffect(() => {
		void loadAudits();
	}, [
		currentPage,
		pageSize,
	]);

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
						管理员审计
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

					<Button
						type="primary"
						onClick={() =>
							void handleExport()
						}
					>
						导出Excel
					</Button>
				</Space>
			}
		>
			<Row
				gutter={[16, 16]}
				style={{
					marginBottom: 20,
				}}
			>
				<Col xs={24} sm={12} md={8} lg={4}>
					<Card>
						<Statistic
							title="总查询数"
							value={stats.total}
							loading={statsLoading}
						/>
					</Card>
				</Col>

				<Col xs={24} sm={12} md={8} lg={4}>
					<Card>
						<Statistic
							title="成功率"
							value={stats.success_rate}
							precision={2}
							suffix="%"
							loading={statsLoading}
							valueStyle={{
								color: "#3f8600",
							}}
						/>
					</Card>
				</Col>

				<Col xs={24} sm={12} md={8} lg={4}>
					<Card>
						<Statistic
							title="失败率"
							value={stats.failure_rate}
							precision={2}
							suffix="%"
							loading={statsLoading}
							valueStyle={{
								color: "#cf1322"
							}}
						/>
					</Card>
				</Col>

				<Col xs={24} sm={12} md={8} lg={4}>
					<Card>
						<Statistic
							title="平均耗时"
							value={stats.avg_execution_time_ms}
							precision={3}
							suffix="ms"
							loading={statsLoading}
						/>
					</Card>
				</Col>

				<Col xs={24} sm={12} md={8} lg={4}>
					<Card>
						<Statistic
							title={
								<Space
								size="small"
								wrap
								>
									<span>
										满意率
									</span>

									<Tag color="green">
										赞{stats.like_count}
									</Tag>

									<Tag color="red">
										踩{stats.dislike_count}
									</Tag>
								</Space>
							}
							value={
								stats.satisfaction_rate
							}
							precision={2}
							suffix="%"
							loading={statsLoading}
							valueStyle={{
								color: "#1677ff",
							}}
						/>
					</Card>
				</Col>
			</Row>

			<Card
				title="最近7天查询量"
				style={{
					marginBottom: 16,
				}}
			>
				<ReactECharts
					option={{
						tooltip: {
							trigger: "axis",
						},

						xAxis: {
							type: "category",
							data:
								trendData
							.map(
								item =>
								item.date,
							)
							.reverse(),
						},
						
						yAxis: {
							type: "value",
						},

						series: [
							{
								type: "line",
								smooth: true,
								areaStyle: {},
								data:
									trendData
									.map(
										item =>
											item.count,
									)
									.reverse(),
							},
						],
					}}
					style={{
						height: 300,
					}}
				/>
			</Card>

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
						setCurrentPage(1);

						void loadAudits();

						void loadStats();
					}}
				/>
				
				<Radio.Group
					value={statusFilter}
					onChange={(event) => {
						setStatusFilter(event.target.value);

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

						void loadStats();
					}}
				>
					查询
				</Button>

				<Button
					onClick={() => {
						setKeyword("");
						setStatusFilter("all");
						void loadAudits();

						void loadStats();
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
				pagination={{
					current: currentPage,
					pageSize,
					total,
					showSizeChanger: true,
					showTotal:
						(value) =>
					`共${value}条`,
				}}
				onChange={(
					pagination,
				) => {
					setCurrentPage(
						pagination.current ??
							1,
					);
					setPageSize(
						pagination.pageSize ??
							20,
					);
				}}
			/>
			<Modal
				title={
					<Space>
						<span>
							SQL审计详情
						</span>

						<Button
							size="small"
							onClick={async () => {
								try {
									await navigator.clipboard.writeText(
										selectedAudit?.sql_text ?? "",
									);
									message.success(
										"SQL已复制",
									);
								} catch {
									message.error("复制失败");
								}
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

