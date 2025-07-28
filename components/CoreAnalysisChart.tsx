
import React, { useState, useMemo } from 'react';
import type { Section } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SlidersHorizontal, AreaChart as AreaChartIcon } from 'lucide-react';

interface CoreAnalysisChartProps {
    section: Section;
}

const CoreAnalysisChart: React.FC<CoreAnalysisChartProps> = ({ section }) => {
    const { dataPoints } = section;

    const availableKeys = useMemo(() => {
        if (!dataPoints || dataPoints.length === 0) return [];
        return Object.keys(dataPoints[0]).filter(key => typeof dataPoints[0][key] === 'number');
    }, [dataPoints]);
    
    const [xAxisKey, setXAxisKey] = useState<string>(availableKeys.includes('age') ? 'age' : availableKeys.includes('depth') ? 'depth' : availableKeys[0] || '');
    const [yAxisKey, setYAxisKey] = useState<string>(availableKeys.find(k => k !== xAxisKey && k !== 'depth' && k !== 'age') || availableKeys.find(k => k !== xAxisKey) || '');

    if (!dataPoints || dataPoints.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-background-tertiary/50 rounded-xl text-content-muted border border-border-primary/50">
                <AreaChartIcon size={48} className="mb-4" />
                <h3 className="text-lg font-semibold text-content-primary">No Data Series for Charting</h3>
                <p>Upload a CSV file in the 'Data Entry' tab to visualize data.</p>
            </div>
        );
    }
    
    const sortedData = [...dataPoints].sort((a, b) => (a[xAxisKey] as number) - (b[xAxisKey] as number));
    
    const SelectControl: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: string[]}> = ({label, value, onChange, options}) => (
        <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">{label}</label>
            <select
                value={value}
                onChange={onChange}
                className="w-full bg-background-interactive border border-border-secondary rounded-lg p-2 text-sm text-content-primary focus:ring-2 focus:ring-accent-primary focus:outline-none transition appearance-none bg-no-repeat bg-right pr-8"
                style={{backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='var(--text-muted)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em'}}
            >
                {options.map(key => <option key={key} value={key}>{key}</option>)}
            </select>
        </div>
    );

    return (
        <div className="bg-background-tertiary/50 p-6 rounded-xl shadow-lg border border-border-primary/50">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                 <h2 className="text-xl font-bold text-content-primary flex items-center gap-2"><SlidersHorizontal size={20} className="text-accent-primary"/> Data Series Analysis</h2>
                <div className="flex gap-4">
                   <SelectControl label="X-Axis" value={xAxisKey} onChange={e => setXAxisKey(e.target.value)} options={availableKeys} />
                   <SelectControl label="Y-Axis" value={yAxisKey} onChange={e => setYAxisKey(e.target.value)} options={availableKeys.filter(k => k !== xAxisKey)} />
                </div>
            </div>
            
            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <AreaChart
                        data={sortedData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
                    >
                        <defs>
                            <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            dataKey={xAxisKey} 
                            type="number"
                            domain={['dataMin', 'dataMax']}
                            tick={{ fontSize: 12 }}
                            label={{ value: xAxisKey, position: 'insideBottom', offset: -10, fontSize: 14 }}
                        />
                        <YAxis 
                            tick={{ fontSize: 12 }} 
                            domain={['auto', 'auto']}
                            label={{ value: yAxisKey, angle: -90, position: 'insideLeft', fontSize: 14, dx: -10 }}
                         />
                        <Tooltip />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Area 
                            type="monotone" 
                            dataKey={yAxisKey} 
                            stroke="var(--accent-primary)"
                            fillOpacity={1} 
                            fill="url(#colorY)"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6, stroke: 'var(--bg-primary)', strokeWidth: 2, fill: 'var(--accent-primary-hover)' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CoreAnalysisChart;
