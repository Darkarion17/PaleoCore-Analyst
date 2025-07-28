
import React, { useState, useRef, useEffect } from 'react';
import type { Section, Microfossil } from '../types';
import { Beaker, FileText, Layers, Loader2, Sparkles, Download, FileJson, Pencil, X, Check } from 'lucide-react';
import { generateSectionSummary } from '../services/geminiService';
import { generateSectionReport } from '../services/pdfService';
import SummaryCard from './SummaryCard';
import DataTable from './DataTable';
import 'jspdf-autotable'; // Import for table generation


interface DashboardTabProps {
  section: Section;
  microfossils: Microfossil[];
  onUpdateSection: (section: Section) => void;
  setToast: (toast: { message: string; type: 'success' | 'error' | 'info'; show: boolean; }) => void;
  userEmail: string;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ section, microfossils, onUpdateSection, setToast, userEmail }) => {
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummaryText, setEditedSummaryText] = useState(section.summary || '');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);


  useEffect(() => {
    if (!isEditingSummary) {
        setEditedSummaryText(section.summary || '');
    }
  }, [section.summary, isEditingSummary]);

  
  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    const summaryText = await generateSectionSummary(section, microfossils);
    onUpdateSection({ ...section, summary: summaryText });
    setIsGeneratingSummary(false);
  };

  const handleSaveSummary = () => {
    onUpdateSection({ ...section, summary: editedSummaryText });
    setIsEditingSummary(false);
  };
  
  const exportToCsv = () => {
    if (section.dataPoints.length === 0) {
      setToast({ message: 'No data points to export.', type: 'info', show: true });
      return;
    }
    const headers = Object.keys(section.dataPoints[0]);
    const csvRows = [
      headers.join(','),
      ...section.dataPoints.map(row => 
        headers.map(header => JSON.stringify(row[header] ?? '', (key, value) => value ?? '')).join(',')
      )
    ];
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${section.core_id}_${section.name}_data.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const exportToJson = () => {
    const jsonString = JSON.stringify(section, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${section.core_id}_${section.name}_backup.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    setToast({ message: 'Generating PDF report, please wait...', type: 'info', show: true });
    try {
      // Give the UI a moment to update before the browser freezes for PDF generation
      await new Promise(resolve => setTimeout(resolve, 50));
      generateSectionReport(section, microfossils, userEmail);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      setToast({ message: 'Failed to generate PDF.', type: 'error', show: true });
    } finally {
      setIsGeneratingPdf(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title="Section Information" icon={FileText}>
          <p><strong>Name:</strong> {section.name}</p>
          <p><strong>Collector:</strong> {section.collector || 'N/A'}</p>
          <p><strong>Recovered:</strong> {section.recoveryDate}</p>
        </SummaryCard>
        <SummaryCard title="Geological Context" icon={Layers}>
          <p><strong>Epoch:</strong> {section.epoch}</p>
          <p><strong>Period:</strong> {section.geologicalPeriod}</p>
          <p><strong>Age Range:</strong> {section.ageRange}</p>
        </SummaryCard>
        <SummaryCard title="Lab Analysis" icon={Beaker}>
          {section.labAnalysis && Object.keys(section.labAnalysis).length > 0 ? (
              Object.entries(section.labAnalysis).map(([key, value]) => value && (
                  <p key={key}><strong>{key.replace(/([A-Z])/g, ' $1').split(' ')[0]}:</strong> {value}</p>
              ))
          ) : <p className="text-slate-500 italic">No lab data</p>}
        </SummaryCard>
      </div>
      
      <div className="bg-background-tertiary/50 p-4 rounded-xl shadow-lg border border-border-primary/50">
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-content-primary flex items-center gap-2"><Sparkles size={20} className="text-accent-primary"/> AI-Powered Scientific Summary</h3>
             <div className="flex items-center gap-2">
                 <button onClick={handleGenerateSummary} disabled={isGeneratingSummary || isEditingSummary} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary/80 text-accent-primary-text hover:bg-accent-primary transition-colors text-sm font-semibold disabled:bg-slate-600 disabled:cursor-not-allowed">
                    {isGeneratingSummary ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16}/>}
                    {isGeneratingSummary ? 'Generating...' : 'Generate/Update'}
                </button>
                {section.summary && !isEditingSummary && (
                    <button onClick={() => setIsEditingSummary(true)} className="p-2 rounded-lg bg-background-interactive text-content-secondary hover:bg-background-interactive-hover hover:text-content-primary transition-colors" aria-label="Edit Summary">
                        <Pencil size={16} />
                    </button>
                )}
             </div>
        </div>
        
        {isEditingSummary ? (
            <div className="mt-2 space-y-3">
                <textarea
                    value={editedSummaryText}
                    onChange={(e) => setEditedSummaryText(e.target.value)}
                    className="w-full h-48 bg-background-primary/80 border border-border-secondary rounded-lg p-3 text-content-primary placeholder-content-muted focus:ring-2 focus:ring-accent-primary focus:outline-none transition text-sm"
                    placeholder="Enter summary..."
                />
                <div className="flex justify-end gap-3">
                    <button onClick={() => setIsEditingSummary(false)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background-interactive text-content-primary hover:bg-background-interactive-hover transition text-sm font-semibold">
                        <X size={16}/> Cancel
                    </button>
                    <button onClick={handleSaveSummary} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success-primary text-white hover:bg-green-500 transition text-sm font-semibold">
                        <Check size={16}/> Save Summary
                    </button>
                </div>
            </div>
        ) : section.summary ? (
            <div className="mt-4 p-4 bg-background-primary/50 rounded-lg prose prose-sm prose-invert max-w-none prose-p:my-2 text-content-secondary">
                {section.summary.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                ))}
            </div>
        ) : (
             <div className="mt-4 text-center text-content-muted">
                <p>Click "Generate/Update" to create an AI-powered summary for this section.</p>
             </div>
        )}
      </div>

      <div className="bg-background-tertiary/50 p-4 rounded-xl shadow-lg border border-border-primary/50">
        <h3 className="text-lg font-semibold text-content-primary flex items-center gap-2 mb-3"><Download size={20} className="text-accent-primary"/> Export Tools</h3>
        <div className="flex flex-wrap gap-4">
            <button onClick={exportToCsv} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success-primary/80 text-white hover:bg-success-primary transition-colors text-sm font-semibold">
                <Download size={16}/> Export Data to CSV
            </button>
            <button onClick={exportToJson} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-secondary/80 text-white hover:bg-accent-secondary transition-colors text-sm font-semibold">
                <FileJson size={16}/> Export Section to JSON
            </button>
            <button onClick={handleGeneratePdf} disabled={isGeneratingPdf} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger-primary/80 text-white hover:bg-danger-primary transition-colors text-sm font-semibold disabled:bg-slate-600 disabled:cursor-not-allowed">
              {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16}/>}
              {isGeneratingPdf ? 'Generating...' : 'Download Section Report (PDF)'}
            </button>
        </div>
      </div>
      
      <div className="bg-background-tertiary/50 p-4 rounded-xl shadow-lg border border-border-primary/50">
        <h2 className="text-xl font-bold mb-4 text-content-primary px-2">Raw Data Series</h2>
        <DataTable data={section.dataPoints} />
      </div>
    </div>
  );
};

export default DashboardTab;
