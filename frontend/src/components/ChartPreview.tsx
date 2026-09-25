import ReactEChartsCore from
	"echarts-for-react/lib/core";

import type { EChartsOption } from "echarts";

import echarts from "../lib/echarts";
import { getChartData } from "../utils/chart";

interface ChartPreviewProps {
	columns: string[];
	rows: Record<string, unknown>[];
}

function ChartPreview({
	columns,
	rows,
}: ChartPreviewProps) {
	const chartData = getChartData(
		columns,
		rows,
	);

	if (chartData === null) {
		return null;
	}

	const option: EChartsOption = {
		color: ["#1677ff"],

		tooltip: {
			trigger: "axis",
			axisPointer: {
				type: "shadow",
			},
		},

		grid: {
			top: 50,
			right: 32,
			bottom:
				chartData.categories.length > 8
				? 90
				: 64,
			left: 48,
			containLabel: true,
		},

		xAxis: {
			type: "category",
			name: chartData.categoryColumn,
			nameLocation: "middle",
			nameGap:
				chartData.categories.length > 8
				? 70
				: 42,
			data: chartData.categories,
			axisTick: {
				alignWithLabel: true,
			},
			axisLabel: {
				interval: 0,
				rotate:
					chartData.categories.length > 8
					? 30
					: 0,
			},
		},

		yAxis: {
			type: "value",
			name: chartData.valueColumn,
			minInterval: 1,
			splitLine: {
				lineStyle: {
					color: "#f0f0f0",
				},
			},
		},

		series: [
			{
				name: chartData.valueColumn,
				type: "bar",
				data: chartData.values,
				barMaxWidth: 60,

				showBackground: true,

				backgroundStyle: {
					color: "rgba(180, 180, 180, 0.10)",
					borderRadius: [6, 6, 0, 0],
				},

				itemStyle: {
					color: "#1677ff",
					borderRadius: [6, 6, 0, 0],
				},

				label: {
					show: true,
					position: "top",
					color: "#262626",
				},

				emphasis: {
					itemStyle: {
						color: "#4096ff",
					},
				},
			},
		],

		animationDuration: 500,
	};

	return (
		<ReactEChartsCore
			echarts={echarts}
			option={option}
			notMerge
			lazyUpdate
			style={{
				width: "100%",
				height: 380,
			}}
		/>
	);
}

export default ChartPreview;

