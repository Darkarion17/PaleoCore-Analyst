
import React, { useState, useRef } from 'react';
import type { Section, DataPoint } from '../types';
import { UploadCloud, CheckCircle, AlertCircle, Loader2, Database, PlusCircle } from 'lucide-react';
import Papa from 'papaparse';
import { mapCsvHeaders } from '../services/geminiService';
import HeaderMappingModal from './HeaderMappingModal';

interface DataInputManagerProps {
  section: Section;
  onUpdateSection: (section: Section) => void;
}

const initialFormState: Record<string, string> = {
  depth: '',
  delta18O: '',
  delta13C: '',
  mgCaRatio: '',
  tex86: '',
  alkenoneSST: '',
  baCa: '',
  srCa: '',
  cdCa: '',
  radiocarbonDate: '',
};

const proxyFields = [
    { name: 'delta18O', label: 'δ18O (‰)'},
    { name: 'delta13C', label: 'δ13C (‰)'},
    { name: 'mgCaRatio', label: 'Mg/Ca (mmol/mol)'},
    { name: 'tex86', label: 'TEX86'},
    { name: 'alkenoneSST', label: 'Alkenone SST (°C)'},
    { name: 'baCa', label: 'Ba/Ca'},
    { name: 'srCa', label: 'Sr/Ca'},
    { name: 'cdCa', label: 'Cd/Ca'},
    { name: 'radiocarbonDate', label: 'Radiocarbon Date (ka BP)'},
];

const DataInputManager: React.FC<DataInputManagerProps> = ({ section, onUpdateSection }) => {
  const [formState, setFormState] = useState(initialFormState);
  
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const [status, setStatus] = useState<{type: 'success'|'error'|'info', msg: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isMappingHeaders, setIsMappingHeaders] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [headerMap, setHeaderMap] = useState<Record<string, string | null>>({});

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleAddDataPoint = () => {
    const depthValue = parseFloat(formState.depth);
    if (isNaN(depthValue)) {
      setStatus({type: 'error', msg: 'Depth is a required field.'});
      setTimeout(() => setStatus(null), 3000);
      return;
    }

    const newPointData: DataPoint = { depth: depthValue };
    let hasProxyValue = false;

    for (const key in formState) {
        if (key !== 'depth' && formState[key]) {
            const numValue = parseFloat(formState[key]);
            if (!isNaN(numValue)) {
                newPointData[key] = numValue;
                hasProxyValue = true;
            }
        }
    }
    
    if (!hasProxyValue) {
        setStatus({type: 'error', msg: 'At least one proxy value must be provided.'});
        setTimeout(() => setStatus(null), 3000);
        return;
    }

    const existingPointIndex = section.dataPoints.findIndex(dp => dp.depth === depthValue);
    let newDataPoints: DataPoint[];

    if (existingPointIndex > -1) {
        // Update existing point, merging new values
        newDataPoints = [...section.dataPoints];
        newDataPoints[existingPointIndex] = { ...newDataPoints[existingPointIndex], ...newPointData };
        setStatus({type: 'success', msg: `Data point at depth ${depthValue} updated.`});
    } else {
        // Add new point
        newDataPoints = [...section.dataPoints, newPointData];
        setStatus({type: 'success', msg: `Data point at depth ${depthValue} added.`});
    }
    
    newDataPoints.sort((a, b) => (a.depth || 0) - (b.depth || 0));
    
    // Update the section in the parent component, clearing the old labAnalysis object
    onUpdateSection({ ...section, dataPoints: newDataPoints, labAnalysis: {} });

    // Clear form for next entry
    setFormState(initialFormState);
    setTimeout(() => setStatus(null), 3000);
  };
  
  // --- CSV Handling Logic ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setStatus(null);
      triggerHeaderMapping(selectedFile);
    }
  };

  const triggerHeaderMapping = (selectedFile: File) => {
    setIsProcessingCsv(true);
    setStatus({ type: 'info', msg: 'Analyzing CSV headers with AI...' });
    Papa.parse(selectedFile, {
        preview: 1,
        complete: async (results) => {
            const headers = results.meta.fields || [];
            if (headers.length === 0) {
                setStatus({ type: 'error', msg: 'Could not read headers from CSV.' });
                setIsProcessingCsv(false);
                return;
            }
            setCsvHeaders(headers);
            const aiMap = await mapCsvHeaders(headers);
            setHeaderMap(aiMap);
            setIsMappingHeaders(true);
            setIsProcessingCsv(false);
            setStatus(null);
        }
    });
  };

  const handleConfirmMapping = (finalMap: Record<string, string | null>) => {
    setIsMappingHeaders(false);
    if (!file) return;

    setIsProcessingCsv(true);
    setStatus({ type: 'info', msg: 'Processing file with new mapping...' });
    
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
            if (results.errors.length) {
                setStatus({type: 'error', msg: `CSV Parsing Error: ${results.errors[0].message}`});
                setIsProcessingCsv(false);
                return;
            }
            
            const dataPoints: DataPoint[] = results.data.map((row: any) => {
                const newRow: DataPoint = {};
                for(const header in row) {
                    const mappedKey = finalMap[header];
                    if (mappedKey) {
                        const value = row[header];
                        if (value === null || value === '' || typeof value === 'undefined') continue;
                        
                        if (typeof value === 'number') {
                            newRow[mappedKey] = value;
                        } else {
                            const numValue = parseFloat(String(value).replace(',', '.'));
                            if (!isNaN(numValue)) {
                               newRow[mappedKey] = numValue;
                            }
                        }
                    }
                }
                return newRow;
            }).filter(dp => Object.keys(dp).length > 0 && (dp.depth !== undefined || dp.age !== undefined));

            if (dataPoints.length === 0) {
                setStatus({ type: 'error', msg: 'No valid data points could be parsed. Ensure an age or depth column is mapped.' });
                setIsProcessingCsv(false);
                return;
            }
            
            const existingPointsMap = new Map(section.dataPoints.map(p => [p.depth, p]));
            dataPoints.forEach(p => {
                if(p.depth !== undefined) {
                    existingPointsMap.set(p.depth, {...existingPointsMap.get(p.depth), ...p})
                }
            });
            const mergedPoints = Array.from(existingPointsMap.values()).sort((a,b) => (a.depth || 0) - (b.depth || 0));

            onUpdateSection({ ...section, dataPoints: mergedPoints });
            setStatus({ type: 'success', msg: `${dataPoints.length} data points loaded/updated successfully.` });
            resetFileInput();
            setTimeout(() => setStatus(null), 4000);
        },
        error: (err) => {
            setStatus({ type: 'error', msg: `File Read Error: ${err.message}` });
            setIsProcessingCsv(false);
            setTimeout(() => setStatus(null), 4000);
        }
    });
  };
  
  const resetFileInput = () => {
      setFile(null);
      setFileName('');
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsProcessingCsv(false);
  };
  
  const handleCancelMapping = () => {
    setIsMappingHeaders(false);
    resetFileInput();
    setStatus(null);
  };

  const inputClass = "w-full bg-background-interactive border border-border-secondary rounded-md p-2 text-sm text-content-primary placeholder-content-muted focus:ring-1 focus:ring-accent-primary focus:outline-none transition";
  const labelClass = "block text-xs font-medium text-content-secondary mb-1";
  
  return (
    <div className="space-y-6">
      {isMappingHeaders && (
        <HeaderMappingModal
            headers={csvHeaders}
            suggestedMap={headerMap}
            onConfirm={handleConfirmMapping}
            onClose={handleCancelMapping}
        />
      )}
      
      <div className="p-4 bg-background-primary/30 rounded-lg border border-border-primary">
        <h3 className="text-lg font-semibold text-content-primary flex items-center gap-2 mb-3"><Database size={20} className="text-accent-primary"/> Manual Data Point Entry</h3>
        <p className="text-xs text-content-muted mb-4">Enter a depth and one or more proxy values to add or update a point in the data series.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
                <label htmlFor="depth" className={`${labelClass} text-accent-primary font-bold`}>Depth (cmbsf)*</label>
                <input type="number" step="any" name="depth" value={formState.depth} onChange={handleFormChange} className={inputClass} required />
            </div>
            {proxyFields.map(field => (
                <div key={field.name}>
                    <label htmlFor={field.name} className={labelClass}>{field.label}</label>
                    <input type="number" step="any" name={field.name} value={formState[field.name]} onChange={handleFormChange} className={inputClass} />
                </div>
            ))}
        </div>
        <div className="flex justify-end mt-4">
            <button onClick={handleAddDataPoint} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary/20 text-accent-primary-hover hover:bg-accent-primary/30 transition-colors text-sm font-semibold">
                <PlusCircle size={16}/> Add/Update Data Point
            </button>
        </div>
      </div>
      
      <div className="p-4 bg-background-primary/30 rounded-lg border border-border-primary">
        <h3 className="text-lg font-semibold text-content-primary flex items-center gap-2 mb-2"><UploadCloud size={20} className="text-accent-primary"/> Bulk Data Series (CSV)</h3>
        <p className="text-xs text-content-muted mb-3">Upload a CSV to add or merge data. The AI will help map columns. Rows with matching depths will be updated.</p>
        <div className="flex flex-wrap gap-4 items-center">
            <label htmlFor="csv-upload" className={`${inputClass} flex-grow flex items-center gap-3 cursor-pointer`}>
                <span className="font-semibold text-accent-primary py-1 px-3 bg-background-interactive rounded-md">Choose File</span>
                <span className="text-content-muted truncate">{fileName || "No file selected..."}</span>
            </label>
            <input type="file" id="csv-upload" ref={fileInputRef} accept=".csv" onChange={handleFileChange} className="sr-only"/>
        </div>
      </div>
      
      {status && (
        <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm animate-fade-in-fast ${status.type === 'success' ? 'bg-success-primary/20 text-success-primary' : status.type === 'error' ? 'bg-danger-primary/20 text-danger-primary' : 'bg-accent-secondary/20 text-accent-secondary'}`}>
            {status.type === 'success' ? <CheckCircle size={18}/> : status.type === 'error' ? <AlertCircle size={18}/> : <Loader2 size={18} className="animate-spin"/>}
            {status.msg}
        </div>
      )}
       <style>{`
        @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
    `}</style>
    </div>
  );
};

export default DataInputManager;
