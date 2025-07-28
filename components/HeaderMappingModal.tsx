
import React, { useState } from 'react';
import { COMMON_DATA_KEYS } from '../constants';
import { X, Check, Wand2 } from 'lucide-react';

interface HeaderMappingModalProps {
    headers: string[];
    suggestedMap: Record<string, string | null>;
    onConfirm: (finalMap: Record<string, string | null>) => void;
    onClose: () => void;
}

const HeaderMappingModal: React.FC<HeaderMappingModalProps> = ({ headers, suggestedMap, onConfirm, onClose }) => {
    const [currentMap, setCurrentMap] = useState<Record<string, string | null>>(suggestedMap);
    const knownKeys = Object.keys(COMMON_DATA_KEYS);

    const handleMapChange = (header: string, newKey: string) => {
        setCurrentMap(prev => ({ ...prev, [header]: newKey === 'null' ? null : newKey }));
    };

    const handleConfirm = () => {
        onConfirm(currentMap);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-fast" onClick={onClose}>
            <div className="bg-slate-800 rounded-xl shadow-2xl p-8 w-full max-w-2xl border border-slate-700 m-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Wand2 /> Confirm CSV Column Mapping</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
                </div>
                <p className="text-slate-400 mb-6 text-sm">
                    The AI has suggested mappings for your CSV columns. Please review and confirm or adjust them as needed. Only mapped columns will be imported.
                </p>

                <div className="flex-grow overflow-y-auto pr-2">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-900 sticky top-0">
                            <tr>
                                <th className="px-4 py-3">Your CSV Header</th>
                                <th className="px-4 py-3">Map to Standard Key</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {headers.map(header => (
                                <tr key={header} className="hover:bg-slate-700/50">
                                    <td className="px-4 py-3 font-medium text-slate-200 truncate" title={header}>{header}</td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={currentMap[header] || 'null'}
                                            onChange={(e) => handleMapChange(header, e.target.value)}
                                            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition appearance-none bg-no-repeat bg-right pr-8"
                                            style={{backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em'}}
                                        >
                                            <option value="null">-- Do Not Import --</option>
                                            {knownKeys.map(key => (
                                                <option key={key} value={key}>{key}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end gap-4 pt-6 mt-auto">
                    <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition">Cancel</button>
                    <button onClick={handleConfirm} className="px-6 py-2 rounded-lg bg-cyan-600 text-white font-semibold hover:bg-cyan-500 transition flex items-center gap-2">
                        <Check size={18} />
                        Confirm Mapping & Import
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default HeaderMappingModal;