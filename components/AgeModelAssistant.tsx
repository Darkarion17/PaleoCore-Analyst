
import React, { useState } from 'react';
import type { Section, TiePoint } from '../types';
import { Layers, Plus, Trash2, MapPin, Calendar, Clock } from 'lucide-react';

interface AgeModelAssistantProps {
  sections: Section[];
  tiePoints: TiePoint[];
  onTiePointsChange: (newTiePoints: TiePoint[]) => void;
}

const AgeModelAssistant: React.FC<AgeModelAssistantProps> = ({ sections, tiePoints, onTiePointsChange }) => {
  const [selectedSection, setSelectedSection] = useState<string>(sections[0]?.id || '');
  const [depth, setDepth] = useState<string>('');
  const [age, setAge] = useState<string>('');

  const handleAddTiePoint = () => {
    if (selectedSection && depth && age) {
      const newTiePoint: TiePoint = {
        id: new Date().toISOString(),
        sectionId: selectedSection,
        depth: parseFloat(depth),
        age: parseFloat(age),
      };
      onTiePointsChange([...tiePoints, newTiePoint]);
      setDepth('');
      setAge('');
    }
  };

  const handleRemoveTiePoint = (id: string) => {
    onTiePointsChange(tiePoints.filter(tp => tp.id !== id));
  };
  
  const getSectionName = (sectionId: string) => sections.find(s => s.id === sectionId)?.name || 'Unknown';

  return (
    <div className="p-4 bg-background-tertiary/50 rounded-xl shadow-lg border border-border-primary/50">
      <h3 className="text-lg font-semibold text-content-primary flex items-center gap-2 mb-4">
        <Layers size={20} className="text-accent-primary"/>
        Age Model Assistant
      </h3>

      <div className="space-y-3 mb-4 max-h-40 overflow-y-auto pr-2 -mr-2">
        {tiePoints.length > 0 ? (
          tiePoints.map(tp => (
            <div key={tp.id} className="flex items-center justify-between bg-background-primary/50 p-2 rounded-md text-sm">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-content-secondary w-28 truncate" title={getSectionName(tp.sectionId)}>{getSectionName(tp.sectionId)}</span>
                    <span className="flex items-center gap-1 text-content-muted"><MapPin size={12}/> {tp.depth}</span>
                    <span className="flex items-center gap-1 text-content-muted"><Calendar size={12}/> {tp.age} ka</span>
                </div>
                <button onClick={() => handleRemoveTiePoint(tp.id)} className="p-1 text-content-muted hover:text-danger-primary">
                    <Trash2 size={14} />
                </button>
            </div>
          ))
        ) : (
          <p className="text-xs text-center text-content-muted py-2">Add at least two tie-points to build an age model.</p>
        )}
      </div>
      
      <div className="border-t border-border-primary pt-4 space-y-2">
        <select
          value={selectedSection}
          onChange={e => setSelectedSection(e.target.value)}
          className="w-full bg-background-interactive border border-border-secondary rounded-md p-1.5 text-xs mb-1"
        >
          {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="flex items-stretch gap-2">
          <input
            type="number"
            placeholder="Depth (cmbsf)"
            value={depth}
            onChange={e => setDepth(e.target.value)}
            className="w-full bg-background-interactive border border-border-secondary rounded-md p-1.5 text-xs"
          />
          <input
            type="number"
            placeholder="Age (ka)"
            value={age}
            onChange={e => setAge(e.target.value)}
            className="w-full bg-background-interactive border border-border-secondary rounded-md p-1.5 text-xs"
          />
          <button
            onClick={handleAddTiePoint}
            disabled={!selectedSection || !depth || !age}
            className="p-2 rounded-md bg-accent-primary/20 text-accent-primary-hover hover:bg-accent-primary/30 transition-colors disabled:opacity-50"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgeModelAssistant;
