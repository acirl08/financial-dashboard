import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface MonthlyTrendProps {
  data: { month: string; amount: number }[];
}

export function MonthlyTrendChart({ data }: MonthlyTrendProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="month"
          tick={{ fill: '#64748b', fontSize: 12 }}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 12 }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spent']}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
          }}
        />
        <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface CategoryBreakdownProps {
  data: { name: string; color: string; amount: number }[];
}

export function CategoryBreakdownChart({ data }: CategoryBreakdownProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="flex items-center gap-8">
      <ResponsiveContainer width={200} height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="amount"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex-1 space-y-2">
        {data.map((category) => (
          <div key={category.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-sm text-slate-600">{category.name}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-slate-900">
                ${category.amount.toFixed(2)}
              </span>
              <span className="text-xs text-slate-500 ml-2">
                ({((category.amount / total) * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ComparisonChartProps {
  user: { total: number; percentage: number };
  partner: { total: number; percentage: number };
}

export function ComparisonChart({ user, partner }: ComparisonChartProps) {
  const data = [
    { name: 'You', amount: user.total, color: '#3b82f6' },
    { name: 'Partner', amount: partner.total, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.name}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-slate-700">{item.name}</span>
            <span className="text-slate-600">
              ${item.amount.toFixed(2)} (
              {((item.amount / (user.total + partner.total)) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(item.amount / (user.total + partner.total)) * 100}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
