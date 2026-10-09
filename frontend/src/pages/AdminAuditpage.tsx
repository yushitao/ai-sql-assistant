import {
	useEffect,
	useState,
} from "react";

import {
	Button,
	Card,
	Modal,
	message,
	Space,
	Table,
	Tag,
	Typography,
} from "antd";

import {
	getAuditHistory,
	type SQLAudit,
} from "../api/adminAudit";

function AdminAuditPage() {
	const [
		audits,
		setAudits,
	] = useState<SQLAudit[]>([]);

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
					await getAuditHistory();
				
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
			void loadAudits();
		}, []);

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
			title="管理员审计"
			extra={
				<Button
					onClick={() =>
						void loadAudits()
					}
				>
					刷新
				</Button>
			}
		>
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

