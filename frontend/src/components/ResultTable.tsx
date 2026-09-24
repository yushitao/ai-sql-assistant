import { Empty, Table } from "antd";

interface ResultTableProps {
	columns: string[];
	rows: Record<string, unknown>[];
}

function ResultTable({
	columns,
	rows,
}: ResultTableProps) {
	if (columns.length ===0) {
		return (
			<Empty
				description="灭有查询结果"
			/>
		);
	}

	const tableColumns = columns.map(
		(columnName) => ({
			title: columnName,
			dataIndex: columnName,
			key: columnName,
			ellipsis: true,
			render: (value: unknown) => {
				if (value === null) {
					return "-";
				}

				if (typeof value === "object") {
					return JSON.stringify(value);
				}

				return String(value);
			},
		}),
	);

	const dataSource = rows.map(
		(row, index) => ({
			...row,
			__rowKey: index,
		}),
	);

	return (
		<Table
			columns={tableColumns}
			dataSource={dataSource}
			rowKey="__rowKey"
			bordered
			size="middle"
			scroll={{ x: true }}
			pagination={{
				pageSize: 10,
				showSizeChanger: true,
				showTotal: (total) =>
					`共 ${total} 条`,
			}}
		/>
	);
}

export default ResultTable;

