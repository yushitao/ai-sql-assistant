import * as echarts from "echarts/core";

import { BarChart } from "echarts/charts";

import {
	GridComponent,
	LegendComponent,
	TooltipComponent,
} from "echarts/components";

import { CanvasRenderer } from "echarts/renderers";

echarts.use([
	BarChart,
	GridComponent,
	LegendComponent,
	TooltipComponent,
	CanvasRenderer,
]);

export default echarts;

