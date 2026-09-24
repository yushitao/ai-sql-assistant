import { useState } from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";
import {
	Button,
	Card,
	Collapse,
	Input,
	Layout,
	message,
	Space,
	Spin,
	Tag,
	Typography,
} from "antd";

import { queryDataWithAI } from "../api/ai";
import ResultTable from "../components/ResultTable";

import type { AIQueryResponse } from "../types/ai";

const { Header, Content } = Layout;
const { Paragraph, Text, Title } = Typography;
const { TextArea } = Input;

function ChatPage() {
	const navigate = useNavigate();

	const [question, setQuestion] =
		useState("");

	const [loading, setLoading] =
		useState(false);

	const [result, setResult] = 
		useState<AIQueryResponse | null>(
			null,
		);

	const handleSubmit = async () => {
		const normalizedQuestion =
			question.trim();
		
		if (!normalizedQuestion) {
			message.warning("请输入分析问题");
			return;
		}

		setLoading(true);
		setResult(null);

		try {
			const response =
				await queryDataWithAI({
					question: normalizedQuestion,
				});

			setResult(response);
		} catch (error: unknown) {
			if (axios.isAxiosError(error)) {
				const detail =
					error.response?.data?.detail;

				message.error(
					typeof detail === "string"
						? detail
						: "AI查询失败，请稍后重试",
				);
			} else {
				message.error(
					"AI查询失败，请稍后重试",
				);
			}
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
					event.key === "Enter"
				) {
					handleSubmit();
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
			onClick={handleSubmit}
		>
			开始分析
		</Button>
		</div>
		</Card>

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
					<Space direction="vertical">
						<Spin size="large" />
						<Text>
							AI正在生成SQL并分析数据...
						</Text>
					</Space>
				</div>
			</Card>
		)}

		{result && (
			<Space
				direction="vertical"
				size="large"
				style={{
					width: "100%",
				}}
			>
				<Card title="分析总结">
					<Paragraph
						style={{
							fontSize: 16,
						}}
					>
						{result.summary}
					</Paragraph>

					<Space wrap>
						<Tag color="blue">
							返回 {result.row_count} 行
						</Tag>

						<Tag color="green">
							SQL耗时{" "}
							{result.execution_time_ms}
							ms
						</Tag>

						{result.truncated && (
							<Tag color="orange">
								结果已截断
							</Tag>
						)}
					</Space>
				</Card>

				<Card title="查询结果">
					<ResultTable
						columns={result.columns}
						rows={result.rows}
					/>
				</Card>

				<Collapse
					items={[
						{
							key: "sql",
							label:
								"查看生成的SQL和解释",
							children: (
								<>
									<Paragraph>
										{result.sql_explanation}
									</Paragraph>

									<pre className="sql-code">
										<code>
											{result.generated_sql}
										</code>
									</pre>
								</>
							),
						},
					]}
				/>
			</Space>
		)}
		</Content>
		</Layout>
	);
}

export default ChatPage;

