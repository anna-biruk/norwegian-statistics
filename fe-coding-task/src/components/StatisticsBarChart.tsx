import { BarChart } from "@mui/x-charts/BarChart";
interface LineChartProps {
  labels: string[] | undefined;
  values: number[] | undefined;
}

const StatisticsBarChart: React.FC<LineChartProps> = ({ labels, values }) => {
  if (!labels || !values || labels.length === 0 || values.length === 0) {
    return <div>No data available for the chart</div>;
  }

  return (
    <div>
      <h2>House Prices Chart</h2>
      <BarChart
        xAxis={[{ scaleType: "band", data: labels }]}
        series={[{ data: values }]}
        width={1000}
        height={500}
      />
    </div>
  );
};

export default StatisticsBarChart;
