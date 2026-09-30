import {
	Card,
	Collapse,
	Space,
	Tag,
	Typography,
} from "antd";

import ChartPreview from "./ChartPreview";
import ResultTable from "./ResultTable";

import { getChartData } from "../utils/chart";

const { Paragraph, Text, Title } = Typography;

export interface AnalysisMessageData {
	id: number;
	question: string;
	generated_sql: string;
	sql_explanation: string;
	summary: string;
	columns: string[];
	rows: Record<string, unknown>[];
	row_count: number;
	execution_time_ms: number;
	truncated: boolean;
	created_at?: string;
}

interface AnalysisMessageProps {
	message: AnalysisMessageData;
}

function formatDateTime(
	value: string | undefined,
): string | null {
	if (!value) {
		return null;
	}

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return date.toLocaleString(
		"zh-CN",
		{
			hour12: false,
		},
	);
}

function AnalysisMessage({
	message,
}: AnalysisMessageProps) {
	const chartData = getChartData(
		message.columns,
		message.rows,
	);
	
	const createdAt = formatDateTime(
		message.created_at,
	);

	return (
		<Space
			direction="vertical"
			size="middle"
			style={{
				width: "100%",
			}}
		>
			<Card
				size="small"
				style={{
					marginLeft: 80,
					background: "#e6f4ff",
					borderColor: "#91caff",
				}}
			>
				<Text strong>用户问题</Text>

				<Paragraph
					style={{
						marginTop: 8,
						marginBottom: 0,
						fontSize: 15,
					}}
				>
					{message.question}
				</Paragraph>

				{createdAt && (
					<Text
						type="secondary"
						style={{
							display: "bolck",
							marginTop: 8,
							fontSize: 12,
						}}
					>
						{createdAt}
					</Text>
				)}
			</Card>

			<Card
				title={
					<Title
						level={5}
						style={{
							margin: 0,
						}}
					>
						AI分析
					</Title>
				}
				style={{
					marginRight: 80,
				}}
			>
				<Paragraph
					style={{
						fontSize: 15,
						lineHeight: 1.8,
					}}
				>
					{message.summary}
				</Paragraph>

				<Space wrap>
					<Tag color="blue">
						返回 {message.row_count} 行
					</Tag>

					<Tag color="green">
						SQL耗时{" "}
						{message.execution_time_ms.toFixed(
							3,
						)}{" "}
						ms
					</Tag>

					{message.truncated && (
						<Tag color="orange">
							结果已截断
						</Tag>
					)}
				</Space>
			</Card>

			{ chartData !== null && (
				<Card
					title="数据可视化"
					style={{
						marginRight: 80,
					}}
				>
					<ChartPreview
						columns={message.columns}
						rows={message.rows}
					/>
				</Card>
			)}

			<Card
				title="查询结果"
				style={{
					marginRight: 80,
				}}
			>
				<ResultTable
					columns={message.columns}
					rows={message.rows}
				/>
			</Card>

			<Collapse
				style={{
					marginRight: 80,
				}}
				items={[
					{
						key: `sql-${message.id}`,
						label: "查看生成的SQL和解释",
						children: (
							<>
								<Paragraph>
									{message.sql_explanation}
								</Paragraph>

								<pre className="sql-code">
									<code>
										{message.generated_sql}
									</code>
								</pre>
							</>
						),
					},
				]}
			/>
		</Space>
	);
}

export default AnalysisMessage;

