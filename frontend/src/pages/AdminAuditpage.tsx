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
	Listy,
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
	//getAuditTrend,
	//getSatisfactionTrend,
	getAuditQualityTrend,
	getTopQuestions,
	type SQLAudit,
	type SQLAuditStats,
	//type SQLAuditTrendItem,
	//type SatisfactionTrendItem,
	type AuditQualityTrendItem,
	type TopQuestionItem,
} from "../api/adminAudit";

/*
import {
	getCurrentUser,
} from "../api/user";
 */

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

	//唯一时间范围来源，默认30天
	const [
		trendDays,
		setTrendDays,
	] = useState(30);

	//同时包含查询量和满意率
	const [
		qualityTrend,
		setQualityTrend,
	] = useState<AuditQualityTrendItem[]>([]);

	//切换7/30/90天时显示加载状态
	const [
		trendLoading,
		setTrendLoading,
	] = useState(false);

	//增加Top问题统计
	const [
		topQuestions,
		setTopQuestions,
	] = useState<TopQuestionItem[]>([]);

	const [
		topQuestionsLoading,
		setTopQuestionsLoading,
	] = useState(false);

	/*
	 * 改用查询量和满意率双轴图，其它接口代提这个接口
	const [
		trendData,
		setTrendData,
	] = useState<SQLAuditTrendItem[]>([]);
	 */

	/*
	 * 改用查询量和满意率双轴图，其它接口代提这个接口
	const [
		satisfactionTrend,
		setSatisfactionTrend,
	] = useState<SatisfactionTrendItem[]>([]);
	 */

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

	/*
	 * 改用查询量和满意率双轴图，其它接口代提这个接口
	const loadTrend = async () => {
		try {
			const data =
				await getAuditTrend();

			setTrendData(data);
		} catch {
			//
		}
	};
	 */

	/*
	 * 改用查询量和满意率双轴图，其它接口代提这个接口
	const loadSatisfactionTrend = async () => {
		try {
			const data =
				await getSatisfactionTrend();

			setSatisfactionTrend(data);
		} catch {
			//
		}
	};
	 */

	const loadQualityTrend =
		async () => {
			setTrendLoading(true);

			try {
				const data =
					await getAuditQualityTrend(
						trendDays,
					);

				setQualityTrend(data);
			} catch {
				message.error(
					"查询量与满意率趋势加载失败",
				);
			} finally {
				setTrendLoading(false);
			}
		};

	const loadTopQuestions =
		async () => {
			setTopQuestionsLoading(true);

			try {
				const data =
					await getTopQuestions(
						trendDays,
						10,
					);

					setTopQuestions(data);
			} catch {
				message.error(
					"热门问题加载失败",
				);
			} finally {
				setTopQuestionsLoading(false);
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

	/*
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
	 */

	useEffect(() => {
		void loadAudits();

		void loadStats();

		//void loadTrend();

		//void loadSatisfactionTrend();
	}, []);

	useEffect (() => {
		void loadQualityTrend();

		void loadTopQuestions();
	}, [trendDays]);

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
			title: "Tokens",
			dataIndex: "total_tokens",
			key: "total_tokens",
			width: 110,
			render: (
				value:
					| number
					| null,
			) => {
				if (value == null) {
					return (
						<Typography.Text
							type="secondary"
						>
							-
						</Typography.Text>
					);
				}

				return (
					<Typography.Text>
						{value.toLocaleString()}
					</Typography.Text>
				);
			},
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
						loading={
							loading ||
								statsLoading ||
								trendLoading ||
								topQuestionsLoading
						}
						onClick={() => {
							void loadAudits()
							void loadStats();
							void loadQualityTrend();

							void loadTopQuestions();
						}

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
							styles={{
								content: {
									color: "#3f8600",
								},
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
							styles={{
								content: {
									color: "#cf1322",
								},
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
							styles={{
								content: {
									color: "#1677ff",
								},
							}}
						/>
					</Card>
				</Col>
			</Row>

			{/*
	 			* 改用查询量和满意率双轴图，其它接口代提这个接口
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
			  */}

			{/*
	 			* 改用查询量和满意率双轴图，其它接口代提这个接口
			<Card
				title="最近7天满意率"
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
								satisfactionTrend
								.map(
									item =>
									item.date,
								)
								.reverse(),
						},

						yAxis: {
							type: "value",
							max: 100,
						},

						series: [
							{
								type: "line",
								smooth: true,
								areaStyle: {},
								data:
									satisfactionTrend
									.map(
										item =>
											item.satisfaction_rate,
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
			  */}

			<Card
				title={
					`最近${trendDays}天查询量与满意率`
				}
				extra={
					<Radio.Group
						value={trendDays}
						optionType="button"
						buttonStyle="solid"
						onChange={(event) => {
							setTrendDays(
								Number(
									event.target.value,
								),
							);
						}}
					>
						<Radio.Button value={7}>
							7天
						</Radio.Button>

						<Radio.Button value={30}>
							30天
						</Radio.Button>

						<Radio.Button value={90}>
							90天
						</Radio.Button>
					</Radio.Group>
				}
				loading={trendLoading}
				style={{
					marginBottom: 16,
				}}
			>
				<ReactECharts
					option={{
						tooltip: {
							trigger: "axis",
							axisPointer: {
								type: "cross",
							},
						},

						legend: {
							data: [
								"查询量",
								"满意率",
							],
						},

						grid: {
							left: 65,
							right: 75,
							top: 60,
							bottom:
								trendDays === 90
								? 85
								: 55,
						},

						xAxis: {
							type: "category",
							boundaryGap: true,
							data:
								qualityTrend.map(
									(item) =>
									item.date,
								),
							axisLabel: {
								formatter: (
									value: string,
								) => value.slice(5),

								rotate:
									trendDays === 90
									? 45
									: 0,

								interval:
									trendDays === 7
									? 0
									: "auto",
							},
						},

						yAxis: [
							{
								type: "value",
								name: "查询量",
								min: 0,
								minInterval: 1,
								position: "left",
								axisLabel: {
									formatter:
										"{value}次",
								},
							},
							
							{
								type: "value",
								name: "满意率",
								min: 0,
								max: 100,
								positon: "right",
								axisLabel: {
									formatter:
										"{value}%",
								},
							},
						],

						series: [
							{
								name : "查询量",
								type: "bar",
								yAxisIndex: 0,
								barMaxWidth: 40,
								data:
									qualityTrend.map(
										(item) =>
										item.query_count,
									),
								itemStyle: {
									color: "#5470c6",
									borderRadius: [
										4,
										4,
										0,
										0,
									],
								},
							},

							{
								name: "满意率",
								type: "line",
								yAxisIndex: 1,
								smooth: true,
								connectNulls: false,
								symbol: "circle",
								symbolSize: 8,
								data:
									qualityTrend.map(
										(item) =>
										item
										.satisfaction_rate,
									),
								lineStyle: {
									width: 3,
									color: "#91cc75",
								},
								itemStyle: {
									color: "#91cc75",
								},
							},
						],

						dataZoom:
							trendDays === 90
								? [
									{
										type: "inside",
										start: 65,
										end: 100,
									},
									{
										type: "slider",
										start: 65,
										end: 100,
										bottom: 10,
									},
								]
								: [],
					}}
					style={{
						height:
							trendDays === 90
								? 410
								: 360,
					}}
				/>
			</Card>

			<Card
				title={
					`最近${trendDays}天热门问题 TOP 10`
				}
				loading={
					topQuestionsLoading
				}
				style={{
					marginBottom: 16,
				}}
			>

				{/*
				  *List接口被新版本弃用，改用Listy
				<List
					dataSource={topQuestions}
					locale={{
						emptyText:
							"当前时间范围内暂无问题数据",
					}}
					renderItem={(
						item,
						index,
					) => (
					<List.Item
						extra={
							<Tag color="blue">
								{item.count}次
							</Tag>
						}
					>
						<List.Item.Meta
							avatar={
								<div
									style={{
										width: 28,
										height: 28,
										lineHeight: "28px",
										textAlign: "center",
										borderRadius: "50%",
										background: index < 3 ? "#1677ff" : "#f0f0f0",
										color: index < 3 ? "#ffffff" : "#595959",
										fontWeight: 600,
									}}
								>
									{index + 1}
								</div>
							}
							title={
								<Typography.Text
									ellipsis={{
										tooltip:
											item.question,
									}}
								>
									{item.question}
								</Typography.Text>
							}
						/>
					</List.Item>
					)}
				/>
				  */}

				{topQuestions.length === 0 ? (
					<Typography.Text
						type="secondary"
					>
						当前时间范围内暂无问题数据
					</Typography.Text>
				) : (
					<Listy
						items={topQuestions}
						rowKey={(item) =>
							item.question
						}
						itemRender={(
							item,
							index,
						) => (
							<div
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent:
										"space-between",
									gap: 16,
									padding: "12px 0",
								}}
							>
								<Space
									style={{
										flex: 1,
										minWidth: 0,
									}}
								>
									<div
										style={{
											width: 28,
											height: 28,
											lineHeight: "28px",
											textAlign: "center",
											borderRadius: "50%",
											background:
												index < 3
												? "#1677ff"
												: "#f0f0f0",
											color:
												index < 3
												? "#ffffff"
												: "#595959",
											fontWeight: 600,
											flexShrink: 0,
										}}
									>
										{index + 1}
									</div>

									<Typography.Text
										ellipsis={{
											tooltip: item.question,
										}}
									>
										{item.question}
									</Typography.Text>
								</Space>

								<Tag
									color="blue"
									style={{
										flexShrink: 0,
									}}
								>
									{item.count} 次
								</Tag>
							</div>
						)}
					/>
				)}
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
					style={{
						marginTop: 16,
					}}
				>
					Token 使用情况
				</Typography.Title>

				<div
					style={{
						display: "grid",
						gridTemplateColumns:
							"repeat(3, 1fr)",
						gap: 12,
						marginBottom: 16,
					}}
				>
					<div
						style={{
							padding: 12,
							background: "#fafafa",
							border: "1px solid #d9d9d9",
							borderRadius: 6,
						}}
					>
						<Typography.Text
							type="secondary"
						>
							输入 Tokens
						</Typography.Text>

						<div
							style={{
								marginTop: 4,
								fontSize: 20,
								fontWeight: 600,
							}}
						>
							{selectedAudit
								?.prompt_tokens == null
									? "-"
									: selectedAudit
									.prompt_tokens
									.toLocaleString()}
						</div>
					</div>

					<div
						style={{
							padding: 12,
							background: "#fafafa",
							border: "1px solid #d9d9d9",
							borderRadius: 6,
						}}
					>
						<Typography.Text
							type="secondary"
						>
							输出 Tokens
						</Typography.Text>

						<div
							style={{
								marginTop: 4,
								fontSize: 20,
								fontWeight: 600,
							}}
						>
							{selectedAudit
								?.completion_tokens
								== null
									? "-"
									: selectedAudit
									.completion_tokens
									.toLocaleString()}
						</div>
					</div>

					<div
						style={{
							padding: 12,
							background: "#e6f4ff",
							border: "1px solid #91caff",
							borderRadius: 6,
						}}
					>
						<Typography.Text
							type="secondary"
						>
							总 Tokens
						</Typography.Text>

						<div
							style={{
								marginTop: 4,
								fontSize: 20,
								fontWeight: 700,
								color: "#1677ff",
							}}
						>
							{
								selectedAudit
									?.total_tokens == null
										? "-"
										: selectedAudit
										.total_tokens
										.toLocaleString()}
						</div>
					</div>
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

