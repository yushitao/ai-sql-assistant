import {
	useNavigate,
} from "react-router-dom";

import ReactECharts
from "echarts-for-react";

import {
	useCallback,
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
	Skeleton,
	Statistic,
	Table,
	Tag,
	Typography,
	type TableColumnsType,
} from "antd";

import {
	exportAuditHistory,
	getAIQualityAnalysis,
	getAIQualityMetrics,
	getAuditHistory,
	getAuditStats,
	//getAuditTrend,
	//getSatisfactionTrend,
	getAuditQualityTrend,
	getTopQuestions,
	type SQLAudit,
	type SQLAuditStats,
	type AIQualityAnalysis,
	type AIQualityDailyTrendItem,
	type AIQualityMetrics,
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
function parseSelectedTables(
	value: string | null,
): string[] {
	if (!value) {
		return [];
	}

	try {
		const parsed:
			unknown = JSON.parse(value);

		if(
			Array.isArray(parsed)
			&& parsed.every(
			(item) =>
			typeof item
			=== "string",
			)
		) {
			return parsed;
		}
	} catch {
		return [];
	}
	return [];
}

function formatRate(
	value: number,
): string {
	return `${value.toFixed(2)}%`;
}

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
	] = useState<7 | 30 | 90>(30);

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

	const[
		aiQualityMetrics,
		setAIQualityMetrics,
	] = useState<AIQualityMetrics | null>(null);

	const[
		aiQualityLoading,
		setAIQualityLoading,
	] = useState(false);

	const [
		qualityAnalysis,
		setQualityAnalysis,
	] = useState<AIQualityAnalysis | null>(null);

	const [
		qualityAnalysisLoading,
		setQualityAnalysisLoading,
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

	const loadAIQualityMetrics =
		useCallback(
			async () => {
				setAIQualityLoading(true);

				try {
					const data =
						await getAIQualityMetrics();

					setAIQualityMetrics(data);
				} catch {
					message.error(
						"加载AI查询质量指标失败",
					);
				} finally {
					setAIQualityLoading(false);
				}
			},
			[],
		);

	const loadAIQualityAnalysis =
		useCallback(
			async (
				days: 7 | 30 | 90,
			) => {
				setQualityAnalysisLoading(true);

				try {
					const data =
						await getAIQualityAnalysis(days);

					setQualityAnalysis(data);
				} catch {
					message.error(
						"加载AI质量分析失败",
					);
				} finally {
					setQualityAnalysisLoading(false);
				}
			},
			[],
		);

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

	useEffect(() => {
		void loadAIQualityMetrics();
	}, [loadAIQualityMetrics,]);

	useEffect(() => {
		void loadAIQualityAnalysis(
			trendDays,
		);
	}, [
		loadAIQualityAnalysis,
		trendDays,
	],);
	
	const qualityTrendColumns:
		TableColumnsType<
			AIQualityDailyTrendItem
		> = [
			{
				title: "日期",
				dataIndex: "date",
				key: "date",
				width: 120,
			},
			{
				title: "查询数",
				dataIndex: "total_queries",
				key: "total_queries",
				width: 90,
			},
			{
				title: "首次成功率",
				dataIndex: "first_try_success_rate",
				key: "first_try_success_rate",
				width: 120,
				render: (
					value: number,
				) =>
				`${value.toFixed(2)}%`,
			},
			{
				title: "修复触发率",
				dataIndex: "repair_trigger_rate",
				key: "repair_trigger_rate",
				width: 120,
				render: (
					value: number,
				) =>
				`${value.toFixed(2)}%`,
			},
			{
				title: "最终成功率",
				dataIndex: "final_success_rate",
				key: "final_success_rate",
				width: 120,
				render: (
					value: number,
				) =>
				`${value.toFixed(2)}%`,
			},
			{
				title: "平均Tokens",
				dataIndex: "average_total_tokens",
				key: "average_total_tokens",
				width: 130,
				render: (
					value: number,
				) =>
				value.toLocaleString(),
			},
			{
				title: "Token样本",
				dataIndex: "token_sample_count",
				key: "token_sample_count",
				width: 110,
				render: (
					value: number,
					record,
				) => (
					<Typography.Text>
						{value}
						{" / "}
						{record.total_queries}
					</Typography.Text>
				),
			},
		];

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
			title: "Schema",
			key: "selected_tables",
			width: 170,
			render: (
				_value: unknown,
				record: SQLAudit,
			) => {
				const tables =
					parseSelectedTables(
						record.selected_tables,
					);

				if (
					record.selected_table_count
					== null
				) {
					return (
						<Typography.Text
							type="secondary"
						>
							未统计
						</Typography.Text>
					);
				}

				if (
					record.schema_fallback_used
				) {
					return (
						<Tag color="gold">
							完整Schema
						</Tag>
					);
				}

				if (
					tables.length === 0
				) {
					return "-";
				}

				return (
					<Space
						size={[
							4,
							4,
						]}
						wrap
					>
						{tables.map(
							(tableName) => (
								<Tag
									color="blue"
									key={tableName}
								>
									{tableName}
								</Tag>
							),
						)}
					</Space>
				);
			},
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
			title: "自动修复",
			dataIndex: "repair_count",
			key: "repair_count",
			width: 110,
			render: (
				value: number,
			) => {
				if (value === 0) {
					return (
						<Tag>
							未修复
						</Tag>
					);
				}

				return (
					<Tag color="orange">
						修复{value}次
					</Tag>
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
							loading
								|| statsLoading
								|| trendLoading
								|| topQuestionsLoading
								|| aiQualityLoading
								|| qualityAnalysisLoading
						}
						onClick={() => {
							void loadAudits()
							void loadStats();
							void loadQualityTrend();

							void loadTopQuestions();
							void loadAIQualityMetrics();
							void loadAIQualityAnalysis(trendDays);
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

			<Card
				title="AI查询质量"
				style={{
					marginBottom: 16,
				}}
			>
				<Skeleton
					active
					loading={aiQualityLoading}
				>
					{aiQualityMetrics ? (
						<>
							<Row
								gutter={[
									16,
									16,
								]}
							>
								<Col
									xs={24}
									sm={12}
									lg={8}
									xl={5}
								>
									<Card
										size="small"
										variant="outlined"
									>
										<Statistic
											title="首次成功率"
											value={
												aiQualityMetrics
												.first_try_success_rate
											}
											precision={2}
											suffix="%"
										/>

										<Typography.Text
											type="secondary"
										>
											{
												aiQualityMetrics
												.first_try_success_count
											}
											{" / "}
											{
												aiQualityMetrics
												.total_queries
											}
											{"次查询"}
										</Typography.Text>
									</Card>
								</Col>

								<Col
									xs={24}
									sm={12}
									lg={8}
									xl={5}
								>
									<Card
										size="small"
										variant="outlined"
									>
										<Statistic
											title="修复触发率"
											value={
												aiQualityMetrics
												.repair_trigger_rate
											}
											precision={2}
											suffix="%"
										/>

										<Typography.Text
											type="secondary"
										>
											{
												aiQualityMetrics
												.repair_triggered_count
											}
											{" / "}
											{
												aiQualityMetrics
												.total_queries
											}
											{"次查询"}
										</Typography.Text>
									</Card>
								</Col>

								<Col
									xs={24}
									sm={12}
									lg={8}
									xl={5}
								>
									<Card
										size="small"
										variant="outlined"
									>
										<Statistic
											title="修复成功率"
											value={
												aiQualityMetrics
												.repair_triggered_count
												=== 0
													? 0
													: aiQualityMetrics
													.repair_success_rate
											}
											precision={2}
											suffix="%"
										/>

										<Typography.Text
											type="secondary"
										>
											{aiQualityMetrics
												.repair_triggered_count
												=== 0
													? "暂无修复请求"
													: (
														`${aiQualityMetrics
															.repair_success_count
														} / ${aiQualityMetrics
														.repair_triggered_count
														}次修复`
													)}
										</Typography.Text>
									</Card>
								</Col>

								<Col
									xs={24}
									sm={12}
									lg={8}
									xl={5}
								>
									<Card
										size="small"
										variant="outlined"
									>
										<Statistic
											title="最终成功率"
											value={
												aiQualityMetrics
												.final_success_rate
											}
											precision={2}
											suffix="%"
											styles={{
												content: {
													color: "#3f8600",
												},
											}}
										/>

										<Typography.Text
											type="secondary"
										>
											{
												aiQualityMetrics
												.final_success_count
											}
											{" / "}
											{
												aiQualityMetrics
												.total_queries
											}
											{"次查询"}
										</Typography.Text>
									</Card>
								</Col>

								<Col
									xs={24}
									sm={12}
									lg={8}
									xl={4}
								>
									<Card
										size="small"
										variant="outlined"
									>
										<Statistic
											title="平均修复次数"
											value={
												aiQualityMetrics
												.average_repair_count
											}
											precision={2}
										/>

										<Typography.Text
											type="secondary"
										>
											每次查询
										</Typography.Text>
									</Card>
								</Col>
							</Row>

							<div
								style={{
									marginTop: 20,
								}}
							>
								<Typography.Title
									level={5}
								>
									修复次数分布
								</Typography.Title>

								<Row
									gutter={[
										16,
										16,
									]}
								>
									<Col
										xs={24}
										md={8}
									>
										<Card
											size="small"
										>
											<Statistic
												title="未修复"
												value={
													aiQualityMetrics
													.repair_count_distribution
													.no_repair
												}
												suffix="次"
											/>
										</Card>
									</Col>

									<Col
										xs={24}
										md={8}
									>
										<Card
											size="small"
										>
											<Statistic
												title="修复1次"
												value={
													aiQualityMetrics
													.repair_count_distribution
													.repaired_once
												}
												suffix="次"
											/>
										</Card>
									</Col>

									<Col
										xs={24}
										md={8}
									>
										<Card
											size="small"
										>
											<Statistic
												title="修复2次"
												value={
													aiQualityMetrics
													.repair_count_distribution
													.repaired_twice
												}
												suffix="次"
											/>
										</Card>
									</Col>
								</Row>
							</div>

							<div
								style={{
									marginTop: 16,
									padding: 12,
									background: "#f6ffed",
									border: "1px solid #b7eb8f",
									borderRadius: 6,
								}}
							>
								<Typography.Text>
									自动修复使最终成功率从
									{" "}
									<Typography.Text
										strong
									>
										{formatRate(
											aiQualityMetrics
											.first_try_success_rate,
										)}
									</Typography.Text>
									{" "}
									提升到
									{" "}
									<Typography.Text
										strong
										style={{
											color: "#3f8600",
										}}
									>
										{formatRate(
											aiQualityMetrics
											.final_success_rate,
										)}
									</Typography.Text>
									，提高了
									{" "}
									<Typography.Text
										strong
									>
										{(
											aiQualityMetrics
											.final_success_rate
											- aiQualityMetrics
											.first_try_success_rate
										).toFixed(2)}
										{" "}
										个百分点
									</Typography.Text>
									。
								</Typography.Text>
							</div>
						</>
					) : (
					<Typography.Text
						type="secondary"
					>
						暂无AI查询质量数据
					</Typography.Text>
					)}
				</Skeleton>
			</Card>

			<Card
				title={
					`最近${trendDays}天AI质量趋势与交叉分析`
				}
				loading={
					qualityAnalysisLoading
				}
				style={{
					marginBottom: 16,
				}}
			>
				{qualityAnalysis ? (
					<>
						<Typography.Title
							level={5}
						>
							Schema选择质量
						</Typography.Title>

						<Row
							gutter={[
								16,
								16,
							]}
						>
							<Col
								xs={24}
								sm={12}
								lg={6}
							>
								<Card
									size="small"
									variant="outlined"
								>
									<Statistic
										title="Schema 回退率"
										value={
											qualityAnalysis
											.schema_analysis
											.fallback_rate
										}
										precision={2}
										suffix="%"
									/>

									<Typography.Text
										type="secondary"
									>
										{
											qualityAnalysis
											.schema_analysis
											.fallback_count
										}
										{"次回退"}
									</Typography.Text>
								</Card>
							</Col>

							<Col
								xs={24}
								sm={12}
								lg={6}
							>
								<Card
									size="small"
									variant="outlined"
								>
									<Statistic
										title="智能选表成功率"
										value={
											qualityAnalysis
											.schema_analysis
											.smart_selection_success_rate
										}
										precision={2}
										suffix="%"
									/>

									<Typography.Text
										type="secondary"
									>
										{
											qualityAnalysis
											.schema_analysis
											.smart_selection_count
										}
										{"次智能选择"}
									</Typography.Text>
								</Card>
							</Col>

							<Col
								xs={24}
								sm={12}
								lg={6}
							>
								<Card
									size="small"
									variant="outlined"
								>
									<Statistic
										title="Fallback成功率"
										value={
											qualityAnalysis
											.schema_analysis
											.fallback_success_rate
										}
										precision={2}
										suffix="%"
									/>
								</Card>
							</Col>

							<Col
								xs={24}
								sm={12}
								lg={6}
							>
								<Card
									size="small"
									variant="outlined"
								>
									<Statistic
										title="平均选择表数"
										value={
											qualityAnalysis
											.schema_analysis
											.average_selected_table_count
										}
										precision={2}
									/>
								</Card>
							</Col>
						</Row>

						<Typography.Title
							level={5}
							style={{
								marginTop: 24,
							}}
						>
							自动修复Token成本
						</Typography.Title>

						<Row
							gutter={[
								16,
								16,
							]}
						>
							<Col
								xs={24}
								md={8}
							>
								<Card
									size="small"
									variant="outlined"
								>
									<Statistic
										title="首次成功平均Tokens"
										value={
											qualityAnalysis
											.token_analysis
											.first_try_average_tokens
										}
										precision={0}
									/>
								</Card>
							</Col>

							<Col
								xs={24}
								md={8}
							>
								<Card
									size="small"
									variant="outlined"
								>
									<Statistic
										title="修复1次平均Tokens"
										value={
											qualityAnalysis
											.token_analysis
											.repaired_once_average_tokens
										}
										precision={0}
									/>
								</Card>
							</Col>

							<Col
								xs={24}
								md={8}
							>
								<Card
									size="small"
									variant="outlined"
								>
									<Statistic
										title="修复2次平均Tokens"
										value={
											qualityAnalysis
											.token_analysis
											.repaired_twice_average_tokens
										}
										precision={0}
									/>
								</Card>
							</Col>
						</Row>

						<Typography.Title
							level={5}
							style={{
								marginTop: 24,
							}}
						>
							每日质量趋势
						</Typography.Title>

						<Table<AIQualityDailyTrendItem>
							rowKey="date"
							size="small"
							columns={
								qualityTrendColumns
							}
							dataSource={
								qualityAnalysis
								.daily_trend
							}
							pagination={{
								pageSize:
									trendDays === 90
										? 15
										: 10,
							}}
							scroll={{
								x: 900,
							}}
						/>
					</>
				) : (
				<Typography.Text
					type="secondary"
				>
					暂无AI质量分析数据
				</Typography.Text>
				)}
			</Card>




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
								) as 7 | 30 | 90,
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
					style={{
						marginTop: 16,
					}}
				>
					自动修复
				</Typography.Title>

				<div
					style={{
						padding: 12,
						marginBottom: 16,
						background:
							selectedAudit
							?.repair_count
								? "#fff7e6"
								: "#fafafa",
						border:
							selectedAudit
							?.repair_count
								? "1px solid #ffd591"
								: "1px solid #d9d9d9",
						borderRadius: 6,
					}}
				>
					{selectedAudit
						?.repair_count ? (
							<Typography.Text>
								该查询经过
								{" "}
								<Typography.Text
									strong
								>
									{selectedAudit
										?.repair_count}
								</Typography.Text>
								{" "}
								次自动修复后完成。
							</Typography.Text>
						) : (
						<Typography.Text
							type="secondary"
						>
							该查询首次生成的SQL
							直接执行成功。
						</Typography.Text>
						)}
				</div>

				<Typography.Title
					level={5}
					style={{
						marginTop: 16,
					}}
				>
					Schema选择
				</Typography.Title>

				<div
					style={{
						padding: 12,
						marginBottom: 16,
						background: "#fafafa",
						border: "1px solid #d9d9d9",
						borderRadius: 6,
					}}
				>
					{selectedAudit
						?.selected_table_count
						== null ? (
							<Typography.Text
								type="secondary"
							>
								该历史记录没有
								Schema选择信息。
							</Typography.Text>
						) : (
							<>
								<div
									style={{
										marginBottom: 8,
									}}
								>
									<Typography.Text
										type="secondary"
									>
										选择方式：
									</Typography.Text>
									{selectedAudit
										.schema_fallback_used ? (
											<Tag
												color="gold"
												style={{
													marginLeft: 8,
												}}
											>
												完整Schema回退
											</Tag>
										) : (
										<Tag
											color="green"
											style={{
												marginLeft: 8,
											}}
										>
											智能选择
										</Tag>
										)}
								</div>

								<div
									style={{
										marginBottom: 8,
									}}
								>
									<Typography.Text
										type="secondary"
									>
										选择表数量：
									</Typography.Text>

									<Typography.Text
										strong
										style={{
											marginLeft: 8,
										}}
									>
										{selectedAudit
											.selected_table_count}
									</Typography.Text>
									</div>

									<div>
										<Typography.Text
											type="secondary"
										>
											选择的表：
										</Typography.Text>
										<Space
										size={[
											4,
											4,
										]}
											wrap
											style={{
												marginLeft: 8,
											}}
										>
										{parseSelectedTables(
											selectedAudit
											.selected_tables,
										).map(
										(tableName) => (
											<Tag
												color="blue"
												key={tableName}
											>
												{tableName}
											</Tag>
										),
										)}
										</Space>
									</div>
							</>
					)}
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

