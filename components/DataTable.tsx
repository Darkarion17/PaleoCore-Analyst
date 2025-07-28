
import React from 'react';
import type { DataPoint } from '../types';
import { Table } from 'lucide-react';

interface DataTableProps {
  data: DataPoint[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900/30 rounded-lg text-slate-500">
        <Table size={40} className="mb-2" />
        <p className="font-semibold">No data series to display.</p>
        <p className="text-sm">Upload a CSV file in the 'Data Entry' tab to see the data table.</p>
      </div>
    );
  }

  const headers = Object.keys(data[0] || {});

  return (
    <div className="max-h-96 overflow-y-auto pr-2">
      <table className="w-full text-sm text-left text-slate-300">
        <thead className="text-xs text-slate-400 uppercase bg-slate-800 sticky top-0">
          <tr>
            {headers.map(header => (
              <th key={header} scope="col" className="px-6 py-3 whitespace-nowrap">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((dp, index) => (
            <tr key={index} className="bg-slate-900/50 border-b border-slate-700/50 hover:bg-slate-800/50">
              {headers.map(header => (
                <td key={header} className="px-6 py-3 font-mono">
                  {typeof dp[header] === 'number' ? (dp[header] as number).toFixed(4) : String(dp[header])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;