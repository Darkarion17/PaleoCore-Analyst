
import React from 'react';

interface SummaryCardProps {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, icon: Icon, children }) => (
    <div className="bg-slate-800 p-4 rounded-lg shadow-md border border-slate-700 h-full">
        <div className="flex items-center mb-2">
            <Icon className="h-6 w-6 mr-2 text-cyan-400" />
            <h4 className="text-md font-semibold text-slate-300">{title}</h4>
        </div>
        <div className="text-sm text-slate-400 space-y-1">{children}</div>
    </div>
);

export default SummaryCard;