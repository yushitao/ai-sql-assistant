export interface QueryTemplate {
	key: string;
	label: string;
	question: string;
}

export const QUERY_TEMPLATES:
	QueryTemplate[] = [
		{
			key: "status_count",
			label: "状态统计",
			question: "统计不同测试状态的数量",
		},

		{
			key: "product_count",
			label: "产品统计",
			question: "统计每个产品的测试数量",
		},

		{
			key: "station_count",
			label: "站点统计",
			question: "统计每个测试站点的测试数量",
		},

		{
			key: "fail_count",
			label: "失败分析",
			question: "统计每个产品的失效数量",
		},

		{
			key: "avg_duration",
			label: "平均时长",
			question: "统计每个产品的平均测试时长",
		},
	];

