
import React from 'react';
import type { Section } from '../types';
import DataTable from './DataTable';
import DataInputManager from './DataInputManager';

interface DataEntryTabProps {
  section: Section;
  onUpdateSection: (section: Section) => void;
}

const DataEntryTab: React.FC<DataEntryTabProps> = ({ section, onUpdateSection }) => {
  return (
    <div className="space-y-6">
      <div className="bg-background-tertiary/50 p-4 rounded-xl shadow-lg border border-border-primary/50">
        <DataInputManager section={section} onUpdateSection={onUpdateSection} />
      </div>
      
      <div className="bg-background-tertiary/50 p-4 rounded-xl shadow-lg border border-border-primary/50">
        <h2 className="text-xl font-bold mb-4 text-content-primary px-2">Raw Data Series</h2>
        <DataTable data={section.dataPoints} />
      </div>
    </div>
  );
};

export default DataEntryTab;
