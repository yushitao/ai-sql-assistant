export interface ChartData {
	categoryColumn: string;
	valueColumn: string;
	categories: string[];
	values: number[];
}

function convertToFiniteNumber(
	value: unknown,
): number | null {
	if (typeof value === "number") {
		return Number.isFinite(value)
		? value
		: null;
	}

	if (
		typeof value === "string" &&
		value.trim() !== ""
	) {
		const numericValue = Number(value);

		return Number.isFinite(numericValue)
		? numericValue
		: null;
	}

	return null;
}

export function getChartData(
	columns: string[],
	rows: Record<string, unknown>[],
): ChartData | null {
	if (
		columns.length !==2 ||
		rows.length === 0
	) {
		return null;
	}

	const categoryColumn = columns[0];
	const valueColumn = columns[1];

	if (
		categoryColumn === undefined ||
		valueColumn === undefined
	) {
		return null;
	}

	const categories: string[] = [];
	const values: number[] = [];

	for (const row of rows) {
		const categoryValue =
			row[categoryColumn];
		
		const numericValue =
			convertToFiniteNumber(
				row[valueColumn],
		);

		if (numericValue === null) {
			return null;
		}

		categories.push(
			categoryValue === null ||
				categoryValue === undefined
			? "未分类"
			: String(categoryValue),
		);

		values.push(numericValue);
	}

	return {
		categoryColumn,
		valueColumn,
		categories,
		values,
	};
}

