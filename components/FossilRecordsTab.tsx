
import React from 'react';
import type { Section, SectionFossilRecord, Microfossil } from '../types';
import { Bug } from 'lucide-react';

interface FossilRecordsTabProps {
  section: Section;
  microfossils: Microfossil[];
  onUpdateSection: (section: Section) => void;
}

interface FossilRecordCardProps {
    record: SectionFossilRecord;
    fossil: Microfossil | undefined;
    onRecordChange: (updatedRecord: SectionFossilRecord) => void;
}

const FossilRecordCard: React.FC<FossilRecordCardProps> = ({ record, fossil, onRecordChange }) => {
    
    if (!fossil) return null; // Should not happen if data is consistent

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        onRecordChange({ ...record, [name]: value });
    };
    
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        onRecordChange({ ...record, [name]: value });
    };

    return (
        <div className="bg-background-tertiary/60 p-6 rounded-xl shadow-lg border border-border-primary/50 flex flex-col items-center text-center">
            <img src={fossil.imageUrl} alt={fossil.taxonomy.species} className="w-40 h-40 object-cover rounded-lg border-2 border-border-secondary mb-4" />
            
            <h3 className="text-xl font-bold text-content-primary italic">{fossil.taxonomy.genus} {fossil.taxonomy.species}</h3>
            <p className="text-md text-content-secondary">{fossil.taxonomy.family}</p>
            <p className="text-sm text-accent-primary mt-1 mb-6 font-semibold">{fossil.stratigraphicRange}</p>

            <div className="w-full space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor={`abundance-${fossil.id}`} className="block text-sm font-medium text-content-secondary mb-1">Abundance</label>
                        <select
                            id={`abundance-${fossil.id}`}
                            name="abundance"
                            value={record.abundance}
                            onChange={handleSelectChange}
                            className="w-full bg-background-interactive border border-border-secondary rounded-lg p-2 text-content-primary focus:ring-2 focus:ring-accent-primary focus:outline-none transition appearance-none bg-no-repeat bg-right pr-8"
                            style={{backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='var(--text-muted)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em'}}
                        >
                            <option>Present</option>
                            <option>Abundant</option>
                            <option>Common</option>
                            <option>Few</option>
                            <option>Rare</option>
                            <option>Barren</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor={`preservation-${fossil.id}`} className="block text-sm font-medium text-content-secondary mb-1">Preservation</label>
                        <select
                            id={`preservation-${fossil.id}`}
                            name="preservation"
                            value={record.preservation}
                            onChange={handleSelectChange}
                            className="w-full bg-background-interactive border border-border-secondary rounded-lg p-2 text-content-primary focus:ring-2 focus:ring-accent-primary focus:outline-none transition appearance-none bg-no-repeat bg-right pr-8"
                            style={{backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='var(--text-muted)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em'}}
                        >
                            <option>Good</option>
                            <option>Moderate</option>
                            <option>Poor</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor={`observations-${fossil.id}`} className="block text-sm font-medium text-content-secondary mb-1">Observations</label>
                    <textarea
                        id={`observations-${fossil.id}`}
                        name="observations"
                        value={record.observations}
                        onChange={handleTextChange}
                        rows={4}
                        placeholder="e.g., 'Much presence and well-differentiated individuals are observed...'"
                        className="w-full bg-background-interactive border border-border-secondary rounded-lg p-2 text-content-primary placeholder-content-muted focus:ring-2 focus:ring-accent-primary focus:outline-none transition"
                    />
                </div>
            </div>
        </div>
    );
};

const FossilRecordsTab: React.FC<FossilRecordsTabProps> = ({ section, microfossils, onUpdateSection }) => {
    
    const handleRecordChange = (updatedRecord: SectionFossilRecord) => {
        const updatedSection = {
            ...section,
            microfossilRecords: section.microfossilRecords.map(r => 
                r.fossilId === updatedRecord.fossilId ? updatedRecord : r
            )
        };
        onUpdateSection(updatedSection);
    };

    if (!section.microfossilRecords || section.microfossilRecords.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-background-tertiary/50 rounded-xl text-content-muted border border-border-primary/50">
                <Bug size={48} className="mb-4" />
                <h3 className="text-lg font-semibold text-content-primary">No Microfossils Associated</h3>
                <p>Edit this section to associate key microfossil species for analysis.</p>
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {section.microfossilRecords.map(record => {
               const fossilDetails = microfossils.find(f => f.id === record.fossilId);
               return (
                    <FossilRecordCard 
                        key={record.fossilId} 
                        record={record}
                        fossil={fossilDetails}
                        onRecordChange={handleRecordChange}
                    />
                );
            })}
        </div>
    );
};

export default FossilRecordsTab;
