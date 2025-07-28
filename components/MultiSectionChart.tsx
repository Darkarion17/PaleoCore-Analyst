
import React from 'react';
import type { Section, DataPoint } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MultiSectionChartProps {
  sections: Section[];
  spliceData: DataPoint[];
  proxyKey: string;
  xAxisKey: 'depth' | 'age';
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F', '#FFBB28'];

const MultiSectionChart: React.FC<MultiSectionChartProps> = ({ sections, spliceData, proxyKey, xAxisKey }) => {

  // Prepare data for charting by sorting and ensuring it's valid
  const processedSections = sections.map(section => ({
    ...section,
    dataPoints: [...section.dataPoints]
      .filter(dp => dp[xAxisKey] !== undefined && dp[proxyKey] !== undefined)
      .sort((a, b) => (a[xAxisKey] as number) - (b[xAxisKey] as number))
  }));

  return (
    <div style={{ width: '100%', height: 500 }}>
        <ResponsiveContainer>
            <LineChart margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey={xAxisKey}
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tick={{ fontSize: 12 }}
                    label={{ value: xAxisKey.charAt(0).toUpperCase() + xAxisKey.slice(1), position: 'insideBottom', offset: -10, fontSize: 14 }}
                    allowDuplicatedCategory={false}
                />
                <YAxis
                    tick={{ fontSize: 12 }}
                    domain={['auto', 'auto']}
                    label={{ value: proxyKey, angle: -90, position: 'insideLeft', fontSize: 14, dx: -10 }}
                />
                <Tooltip
                    formatter={(value) => typeof value === 'number' ? value.toFixed(3) : value}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />

                {/* Render line for each section */}
                {processedSections.map((section, index) => (
                    <Line
                        key={section.id}
                        dataKey={proxyKey}
                        data={section.dataPoints}
                        name={section.name}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={1.5}
                        dot={false}
                        connectNulls
                        type="monotone"
                    />
                ))}

                {/* Render the composite splice line */}
                {spliceData.length > 0 && (
                     <Line
                        key="composite-splice"
                        dataKey={proxyKey}
                        data={spliceData}
                        name="Composite Splice"
                        stroke="var(--accent-primary)"
                        strokeWidth={3}
                        dot={false}
                        connectNulls
                        type="monotone"
                    />
                )}
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
};

export default MultiSectionChart;
