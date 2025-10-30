
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Submission } from '@/types';
import { format, subMonths } from 'date-fns';

interface SubmissionsChartProps {
  submissions: Submission[];
}

export function SubmissionsChart({ submissions }: SubmissionsChartProps) {
  const data = Array.from({ length: 6 }, (_, i) => {
    const monthDate = subMonths(new Date(), 5 - i);
    return {
      name: format(monthDate, 'MMM'),
      total: 0,
    };
  });

  const sixMonthsAgo = subMonths(new Date(), 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  submissions.forEach(sub => {
    if (sub.submittedAt >= sixMonthsAgo) {
      const monthIndex = 5 - (new Date().getMonth() - sub.submittedAt.getMonth() + 12) % 12;
      if (monthIndex >= 0 && monthIndex < 6) {
        data[monthIndex].total += 1;
      }
    }
  });

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
          allowDecimals={false}
        />
        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
