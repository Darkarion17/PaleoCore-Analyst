
import React, { useState, useMemo } from 'react';
import type { Folder, Microfossil } from '../types';
import { REGIONS } from '../constants';
import { Filter, X, SlidersHorizontal, Trash2 } from 'lucide-react';

interface MapFiltersProps {
    filters: {
        folderId: string;
        region: string;
    };
    onFilterChange: (filterType: keyof MapFiltersProps['filters'], value: string) => void;
    onClearFilters: () => void;
    folders: Folder[];
    microfossils: Microfossil[];
}

const SelectFilter: React.FC<{
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: {value: string; label: string}[];
}> = ({ label, value, onChange, options }) => (
    <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">{label}</label>
        <select
            value={value}
            onChange={onChange}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition appearance-none bg-no-repeat bg-right pr-8"
            style={{backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em'}}
        >
            <option value="">All</option>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const MapFilters: React.FC<MapFiltersProps> = ({ filters, onFilterChange, onClearFilters, folders, microfossils }) => {
    const [isOpen, setIsOpen] = useState(false);

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="absolute top-4 right-4 z-10 flex items-center gap-2 p-3 rounded-full bg-slate-800/80 backdrop-blur-sm text-slate-200 hover:bg-slate-700/90 shadow-lg border border-slate-600 transition-all"
                aria-label="Open filters"
                title="Open filters"
            >
                <SlidersHorizontal size={20} />
                {activeFilterCount > 0 && (
                     <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-xs font-bold text-white">
                        {activeFilterCount}
                     </span>
                )}
            </button>
        );
    }
    
    return (
        <div className="absolute top-4 right-4 z-10 w-64 bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-2xl border border-slate-600 transition-all duration-300 animate-fade-in-fast">
             <div className="flex justify-between items-center p-3 border-b border-slate-700">
                <h3 className="font-semibold text-white flex items-center gap-2"><Filter size={16}/> Map Filters</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
            <div className="p-4 space-y-4">
                <SelectFilter 
                    label="Region"
                    value={filters.region}
                    onChange={(e) => onFilterChange('region', e.target.value)}
                    options={Object.keys(REGIONS).map(r => ({value: r, label: r}))}
                />
                <SelectFilter 
                    label="Folder"
                    value={filters.folderId}
                    onChange={(e) => onFilterChange('folderId', e.target.value)}
                    options={folders.map(f => ({value: f.id, label: f.name}))}
                />
                 <div className="text-xs text-content-muted pt-2 border-t border-border-secondary">
                    Advanced filtering by Section properties (e.g., epoch, microfossils) can be done via the API or future updates.
                </div>
            </div>
            <div className="p-3 border-t border-slate-700">
                <button 
                    onClick={onClearFilters}
                    disabled={activeFilterCount === 0}
                    className="w-full flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-md text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-300"
                >
                    <Trash2 size={14}/>
                    Clear All Filters
                </button>
            </div>
            <style>{`
                @keyframes fade-in-fast { from { opacity: 0; transform: scale(0.95) translateX(10px); } to { opacity: 1; transform: scale(1) translateX(0); } }
                .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default MapFilters;
