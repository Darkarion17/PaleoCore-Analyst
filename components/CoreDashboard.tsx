
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Core, Section, Microfossil, PartialMicrofossil } from '../types';
import * as coreService from '../services/coreService';
import { supabase } from '../services/supabaseClient';
import { generateFullCoreReport } from '../services/pdfService';


import CoreDetails from './CoreDetails';
import PaleoAiAssistant from './PaleoAiAssistant';
import DataEntryTab from './DataEntryTab';
import FossilRecordsTab from './FossilRecordsTab';
import DashboardTab from './DashboardTab';
import CoreAnalysisChart from './CoreAnalysisChart';
import AddCoreModal from './AddCoreModal';
import CoreSynthesisView from './CoreSynthesisView';

import { LayoutDashboard, Database, Bug, Bot, AreaChart, PlusCircle, Loader2, Pencil, Trash2, FileText, Filter, Blend } from 'lucide-react';

interface CoreDashboardProps {
  core: Core;
  microfossils: Microfossil[];
  onEditCore: (core: Core) => void;
  onDeleteCore: (coreId: string) => void;
  onGoToMap: () => void;
  setToast: (toast: { message: string; type: 'success' | 'error' | 'info'; show: boolean; }) => void;
  onAddFossil: (fossil: PartialMicrofossil) => void;
  userEmail: string;
}

type Tab = 'dashboard' | 'analysis' | 'data_entry' | 'fossils' | 'synthesis' | 'ai';

const CoreDashboard: React.FC<CoreDashboardProps> = ({ core, microfossils, onEditCore, onDeleteCore, onGoToMap, setToast, onAddFossil, userEmail }) => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sections, setSections] = useState<Section[]>([]);
  const [calibratedSections, setCalibratedSections] = useState<Section[] | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [loadingSections, setLoadingSections] = useState(true);
  
  const [epochFilter, setEpochFilter] = useState('all');

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  const [isGeneratingFullReport, setIsGeneratingFullReport] = useState(false);
  
  const availableEpochs = useMemo(() => {
    const epochs = new Set(sections.map(s => s.epoch));
    return ['all', ...Array.from(epochs)];
  }, [sections]);

  const filteredSections = useMemo(() => {
    if (epochFilter === 'all') {
      return sections;
    }
    return sections.filter(s => s.epoch === epochFilter);
  }, [sections, epochFilter]);

  useEffect(() => {
    if (selectedSection && !filteredSections.some(s => s.id === selectedSection.id)) {
        setSelectedSection(filteredSections[0] || null);
    }
    if (!selectedSection && filteredSections.length > 0) {
        setSelectedSection(filteredSections[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredSections, selectedSection]);


  const fetchSections = async () => {
    setLoadingSections(true);
    setCalibratedSections(null); // Reset synthesis data on re-fetch
    try {
      const fetchedSections = await coreService.fetchSectionsForCore(core.id);
      setSections(fetchedSections);
      
      const sectionToSelect = editingSection
          ? fetchedSections.find(s => s.id === editingSection.id)
          : selectedSection 
              ? fetchedSections.find(s => s.id === selectedSection.id)
              : null;
      
      setSelectedSection(sectionToSelect || fetchedSections[0] || null);
      
    } catch (error: any) {
      setToast({ message: `Error fetching sections: ${error.message}`, type: 'error', show: true });
    } finally {
      setLoadingSections(false);
      setEditingSection(null);
    }
  };

  useEffect(() => {
    fetchSections();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [core.id]);
  
  const handleSaveSection = async (sectionToSave: Section) => {
    if (!supabase.auth.getSession()) return;
    const isEditing = sections.some(s => s.id === sectionToSave.id);

    try {
        const savedSection = await coreService.saveSection(sectionToSave, isEditing);
        if (isEditing) {
          setEditingSection(savedSection);
        }
        await fetchSections();
        setToast({ message: `Section "${savedSection.name}" saved.`, type: 'success', show: true });
        setIsSectionModalOpen(false);
    } catch (error: any) {
        setToast({ message: `Error: ${error.message}`, type: 'error', show: true });
    }
  };
  
  const handleDeleteSection = async (sectionId: string) => {
    const sectionName = sections.find(s => s.id === sectionId)?.name || 'this section';
     try {
        await coreService.deleteSection(sectionId);
        await fetchSections();
        setToast({ message: `Section "${sectionName}" deleted.`, type: 'success', show: true });
     } catch (error: any) {
        setToast({ message: `Error deleting section: ${error.message}`, type: 'error', show: true });
     }
  };
  
  const handleUpdateSectionData = async (updatedSection: Section) => {
     try {
        const newSection = await coreService.updateSection(updatedSection);
        setSections(prevSections => prevSections.map(s => s.id === newSection.id ? newSection : s));
        if (selectedSection?.id === newSection.id) {
            setSelectedSection(newSection);
        }
    } catch(error: any) {
        setToast({ message: `Error updating section: ${error.message}`, type: 'error', show: true });
    }
  };

  const handleGenerateFullReport = async () => {
    if (sections.length === 0) {
        setToast({ message: 'Core has no sections to generate a report.', type: 'info', show: true });
        return;
    }
    setIsGeneratingFullReport(true);
    setToast({ message: 'Generating Full Core Report...', type: 'info', show: true });
    try {
      // Give the UI a moment to update before the browser freezes for PDF generation
      await new Promise(resolve => setTimeout(resolve, 50));
      generateFullCoreReport(core, sections, microfossils, userEmail);
    } catch (e) {
      console.error("Error generating full report:", e);
      setToast({ message: 'Failed to generate full core report.', type: 'error', show: true });
    } finally {
      setIsGeneratingFullReport(false);
    }
  };


  const TabButton: React.FC<{tabName: Tab, icon: React.ReactNode, label: string, disabled?: boolean}> = ({tabName, icon, label, disabled = false}) => (
      <button
          onClick={() => setActiveTab(tabName)}
          disabled={disabled || !selectedSection}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-all duration-200
              ${activeTab === tabName && !disabled && selectedSection
                  ? 'border-accent-primary text-accent-primary-hover bg-background-tertiary' 
                  : 'border-transparent text-content-muted hover:text-content-primary hover:bg-background-tertiary/50 disabled:text-content-muted/50 disabled:cursor-not-allowed disabled:hover:bg-transparent'}`
          }
          aria-current={activeTab === tabName}
      >
          {icon}
          {label}
      </button>
  );
  
  const renderContent = () => {
    if (loadingSections) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-content-muted">
                <Loader2 size={48} className="mb-4 animate-spin" />
                <h3 className="text-xl font-semibold text-content-primary">Loading Sections...</h3>
            </div>
        )
    }
    if (!selectedSection && activeTab !== 'synthesis') {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-content-muted bg-background-tertiary/20 rounded-xl border-2 border-dashed border-border-primary">
                <FileText size={48} className="mb-4" />
                <h3 className="text-xl font-semibold text-content-primary">No Section Available</h3>
                <p>{sections.length > 0 ? 'Select a different epoch filter to see more sections.' : 'This core has no sections. Add one to get started.'}</p>
            </div>
        );
    }
    
    switch (activeTab) {
      case 'dashboard':
        return selectedSection ? <DashboardTab section={selectedSection} microfossils={microfossils} onUpdateSection={handleUpdateSectionData} setToast={setToast} userEmail={userEmail} /> : null;
      case 'analysis':
        return selectedSection ? <CoreAnalysisChart section={selectedSection} /> : null;
      case 'data_entry':
        return selectedSection ? <DataEntryTab section={selectedSection} onUpdateSection={handleUpdateSectionData} /> : null;
      case 'fossils':
        return selectedSection ? <FossilRecordsTab section={selectedSection} microfossils={microfossils} onUpdateSection={handleUpdateSectionData} /> : null;
      case 'synthesis':
        return <CoreSynthesisView 
                  sections={sections} 
                  calibratedSections={calibratedSections} 
                  onCalibratedDataChange={setCalibratedSections}
                  setToast={setToast}
               />;
      case 'ai':
        return selectedSection ? <PaleoAiAssistant section={selectedSection} /> : null;
      default:
        return null;
    }
  }

  const selectClass = "w-full bg-background-interactive border border-border-secondary rounded-lg p-2 text-sm text-content-primary focus:ring-2 focus:ring-accent-primary focus:outline-none transition appearance-none bg-no-repeat bg-right pr-8 disabled:cursor-not-allowed disabled:bg-background-tertiary disabled:text-content-muted/50";
  const selectIcon = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='var(--text-muted)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;

  return (
    <div className="space-y-6">
      <CoreDetails 
        core={core} 
        onEdit={() => onEditCore(core)} 
        onDelete={() => onDeleteCore(core.id)} 
        onGoToMap={onGoToMap}
        onGenerateFullReport={handleGenerateFullReport}
        isGeneratingFullReport={isGeneratingFullReport}
      />
      
      <div className="bg-background-tertiary/50 p-4 rounded-xl shadow-lg border border-border-primary">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl font-semibold text-content-primary flex-shrink-0">Sections</h2>
            
            {loadingSections ? (
                <div className="flex items-center gap-2 text-content-muted w-full justify-end">
                    <Loader2 className="animate-spin" />
                    <span>Loading...</span>
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full">
                    <div className="flex-1">
                        <label htmlFor="epoch-filter" className="block text-xs font-medium text-content-muted mb-1 flex items-center gap-1"><Filter size={12}/> Filter by Epoch</label>
                        <select
                            id="epoch-filter"
                            value={epochFilter}
                            onChange={(e) => setEpochFilter(e.target.value)}
                            className={selectClass}
                            style={{ backgroundImage: selectIcon, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
                        >
                            {availableEpochs.map(epoch => (
                               <option key={epoch} value={epoch}>{epoch === 'all' ? 'All Epochs' : epoch}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label htmlFor="section-select" className="block text-xs font-medium text-content-muted mb-1">Select Section</label>
                        <select
                            id="section-select"
                            value={selectedSection?.id || ''}
                            onChange={(e) => {
                                const section = filteredSections.find(s => s.id === e.target.value);
                                if (section) setSelectedSection(section);
                            }}
                            className={selectClass}
                            style={{ backgroundImage: selectIcon, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
                            disabled={filteredSections.length === 0}
                        >
                            {filteredSections.length === 0 ? (
                               <option>No matching sections</option>
                            ) : (
                                filteredSections.map(section => (
                                   <option key={section.id} value={section.id}>{section.name}</option>
                                ))
                            )}
                        </select>
                    </div>
                    <div className="self-end">
                        <button onClick={() => { setEditingSection(null); setIsSectionModalOpen(true); }} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold bg-accent-primary/20 text-accent-primary-hover hover:bg-accent-primary/30 transition-colors h-full">
                            <PlusCircle size={16}/> Add Section
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
      
      {selectedSection && !loadingSections && (
        <div className="flex justify-end items-center gap-2 -mt-4 mr-2">
            <button
                onClick={() => { setEditingSection(selectedSection); setIsSectionModalOpen(true); }}
                className="p-1.5 rounded-md bg-background-tertiary text-content-muted hover:bg-background-interactive hover:text-content-primary transition-colors"
                title="Edit selected section"
            >
                <Pencil size={14} />
            </button>
            <button
                onClick={() => handleDeleteSection(selectedSection.id)}
                className="p-1.5 rounded-md bg-danger-primary/20 text-danger-primary hover:bg-danger-primary/40 hover:text-content-inverted transition-colors"
                title="Delete selected section"
            >
                <Trash2 size={14} />
            </button>
        </div>
      )}

      <div>
        <nav className="flex items-center border-b border-border-primary mb-6 flex-wrap">
            <TabButton tabName="dashboard" icon={<LayoutDashboard size={16}/>} label="Dashboard" />
            <TabButton tabName="analysis" icon={<AreaChart size={16}/>} label="Analysis" />
            <TabButton tabName="data_entry" icon={<Database size={16}/>} label="Data Entry" />
            <TabButton tabName="fossils" icon={<Bug size={16}/>} label="Microfossils" />
            <TabButton tabName="synthesis" icon={<Blend size={16}/>} label="Synthesis" disabled={sections.length === 0} />
            <TabButton tabName="ai" icon={<Bot size={16}/>} label="AI Assistant" />
        </nav>
        <div className="animate-fade-in">
            {renderContent()}
        </div>
      </div>

       {isSectionModalOpen && (
          <AddCoreModal
            mode="section"
            parentCoreId={core.id}
            onSaveSection={handleSaveSection} 
            onClose={() => { setIsSectionModalOpen(false); setEditingSection(null); }}
            sectionToEdit={editingSection}
            microfossils={microfossils}
            onAddFossil={onAddFossil}
           />
       )}
    </div>
  );
};

export default CoreDashboard;
