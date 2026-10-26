import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { MOOD_LABELS, MOOD_COLORS } from '../../utils/constants';

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const label = MOOD_LABELS[item.mood] || item.mood;
    return (
      <div className="chart-tooltip">
        <div className="chart-tooltip-label">{label}</div>
        <div className="chart-tooltip-value">
          {item.count} {item.count === 1 ? 'entry' : 'entries'} ({item.percentage}%)
        </div>
      </div>
    );
  }
  return null;
}

export default function MoodDistributionChart({ data = [] }) {
  const totalEntries = data.reduce((sum, item) => sum + (item.count || 0), 0);

  if (!data || totalEntries === 0) {
    return (
      <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          No mood distribution data available.
        </p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    name: MOOD_LABELS[item.mood] || item.mood,
  }));

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            stroke="var(--text-secondary)"
            fontSize={12}
          />
          <YAxis
            stroke="var(--text-secondary)"
            fontSize={12}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={MOOD_COLORS[entry.mood] || 'var(--primary)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
