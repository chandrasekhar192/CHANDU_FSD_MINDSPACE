import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { formatShortDate } from '../../utils/dateUtils';
import { MOOD_LABELS } from '../../utils/constants';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const score = payload[0].value;
    const roundedScore = Math.round(score);
    const labelText = MOOD_LABELS[roundedScore] || 'Score';

    return (
      <div className="chart-tooltip">
        <div className="chart-tooltip-label">{formatShortDate(label)}</div>
        <div className="chart-tooltip-value">
          Avg: {score} ({labelText})
        </div>
        {payload[0].payload.count && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 2 }}>
            {payload[0].payload.count} {payload[0].payload.count === 1 ? 'entry' : 'entries'}
          </div>
        )}
      </div>
    );
  }
  return null;
}

export default function MoodLineChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          No mood data available for this period.
        </p>
      </div>
    );
  }

  const yTickFormatter = (value) => {
    const map = { 5: 'Great', 4: 'Good', 3: 'Okay', 2: 'Low', 1: 'Bad' };
    return map[value] || value;
  };

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatShortDate}
            stroke="var(--text-secondary)"
            fontSize={12}
          />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tickFormatter={yTickFormatter}
            stroke="var(--text-secondary)"
            fontSize={12}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="avgScore"
            stroke="var(--primary)"
            strokeWidth={3}
            dot={{ r: 5, fill: 'var(--primary)', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
