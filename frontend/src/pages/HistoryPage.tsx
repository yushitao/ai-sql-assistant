import {
	useEffect,
	useState,
} from "react";

import {
	Button,
	Card,
	Table,
	Tag,
	Typography,
} from "antd";

import { useNavigate } from "react-router-dom";

import {
	getSqlHistory,
	type SqlHistoryItem,
} from "../api/history";

const { Paragraph } = Typography;

function HistoryPage() {
	const navigate = useNavigate();

	const [loading, setLoading]=
		useState(false);

	const [data,setData] = useState<
		SqlHistoryItem[]
	>([]);

	useEffect(() => {
		void loadHistory();
	}, []);

	const loadHistory = async () => {
		setLoading(true);
	
		try {
			const result =
				await getSqlHistory();

			setData(result);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			style={{
				padding: 24,
			}}
		>
		<Card
			title="查询历史"
			extra={
				<Button
					onClick={() =>
						navigate("/chat")
					}
				>
					返回分析页
				</Button>
			}
		>
			<Table
				rowKey="id"
				loading={loading}
				dataSource={data}
				pagination={{
					pageSize: 10,
				}}
				expandable={{
					expandedRowRender: (
						record,
					) => (
						<Paragraph>
							<pre
								className="sql-code"
							>
								{record.sql_text}
							</pre>
						</Paragraph>
					),
				}}
				columns={[
					{
						title: "ID",
						dataIndex: "id",
						width: 80,
					},

					{
						title: "执行时间",
						dataIndex:
							"created_at",
						width: 220,
						render: (
							value:string,
						) =>
							new Date(
								value,
							).toLocaleString(
								"zh-CN",
								{
									hour12: false,
								}
							),
					},

					{
						title: "返回行数",
						dataIndex: 
							"row_count",
						width: 120,
					},

					{
						title: "耗时(ms)",
						dataIndex:
							"execution_time_ms",
						width: 120,
						render: (
							value: number | null,
						) =>
							value === null
							? "-"
							: value.toFixed(3),
					},

					{
						title: "校验",
						dataIndex: 
							"validation_passed",
						width: 100,
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
						width: 100,
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
				]}
			/>
		</Card>
		</div>
	);
}

export default HistoryPage;

