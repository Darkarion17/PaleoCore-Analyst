
import React, { useState, useMemo } from 'react';
import type { Section, TiePoint, SpliceInterval, DataPoint } from '../types';
import AgeModelAssistant from './AgeModelAssistant';
import MultiSectionChart from './MultiSectionChart';
import { generateAgeModel } from '../services/geminiService';
import { Blend, Wand2, Loader2, AlertCircle } from 'lucide-react';

interface CoreSynthesisViewProps {
  sections: Section[];
  calibratedSections: Section[] | null;
  onCalibratedDataChange: (calibratedSections: Section[]) => void;
  setToast: (toast: { message: string; type: 'success' | 'error' | 'info'; show: boolean }) => void;
}

const CoreSynthesisView: React.FC<CoreSynthesisViewProps> = ({ sections, calibratedSections, onCalibratedDataChange, setToast }) => {
  const [tiePoints, setTiePoints] = useState<TiePoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProxy, setSelectedProxy] = useState<string>('d18O');

  const [spliceIntervals, setSpliceIntervals] = useState<Record<string, SpliceInterval>>(
    Object.fromEntries(sections.map(s => [s.id, { sectionId: s.id, startAge: null, endAge: null }]))
  );

  const dataToDisplay = calibratedSections || sections;

  const availableProxies = useMemo(() => {
    const proxies = new Set<string>();
    dataToDisplay.forEach(section => {
      if (section.dataPoints.length > 0) {
        Object.keys(section.dataPoints[0]).forEach(key => {
          if (typeof section.dataPoints[0][key] === 'number' && key !== 'depth' && key !== 'age') {
            proxies.add(key);
          }
        });
      }
    });
    return Array.from(proxies);
  }, [dataToDisplay]);
  
  // Ensure selectedProxy is valid
  React.useEffect(() => {
      if (!availableProxies.includes(selectedProxy) && availableProxies.length > 0) {
          setSelectedProxy(availableProxies[0]);
      }
  }, [availableProxies, selectedProxy]);


  const handleGenerateAgeModel = async () => {
    if (tiePoints.length < 2) {
      setToast({ message: 'At least two tie-points are required to generate an age model.', type: 'error', show: true });
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateAgeModel(sections, tiePoints);
      onCalibratedDataChange(result);
      setToast({ message: 'Age models generated successfully!', type: 'success', show: true });
    } catch (err: any) {
      setError(err.message);
      setToast({ message: `Error generating age model: ${err.message}`, type: 'error', show: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpliceIntervalChange = (sectionId: string, type: 'startAge' | 'endAge', value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setSpliceIntervals(prev => ({
        ...prev,
        [sectionId]: {
            ...prev[sectionId],
            [type]: numValue,
        }
    }));
  };
  
  const compositeSplice = useMemo(() => {
      if (!calibratedSections) return [];
      
      const allPoints: DataPoint[] = [];
      
      calibratedSections.forEach(section => {
          const interval = spliceIntervals[section.id];
          if (interval && interval.startAge !== null && interval.endAge !== null) {
              const start = Math.min(interval.startAge, interval.endAge);
              const end = Math.max(interval.startAge, interval.endAge);
              
              section.dataPoints.forEach(dp => {
                  if (dp.age !== undefined && dp.age >= start && dp.age <= end) {
                      allPoints.push(dp);
                  }
              });
          }
      });
      
      return allPoints.sort((a, b) => (a.age as number) - (b.age as number));
  }, [calibratedSections, spliceIntervals]);

  if (sections.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center p-12 bg-background-tertiary/50 rounded-xl text-content-muted border border-border-primary/50">
            <Blend size={48} className="mb-4" />
            <h3 className="text-lg font-semibold text-content-primary">No Sections to Synthesize</h3>
            <p>This core needs at least one section with data to begin synthesis.</p>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel: Controls */}
      <div className="lg:col-span-1 space-y-6">
        <AgeModelAssistant
          sections={sections}
          tiePoints={tiePoints}
          onTiePointsChange={setTiePoints}
        />
        <div className="p-4 bg-background-tertiary/50 rounded-xl shadow-lg border border-border-primary/50">
            <button
                onClick={handleGenerateAgeModel}
                disabled={isLoading || tiePoints.length < 2}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-accent-primary text-accent-primary-text font-bold hover:bg-accent-primary-hover transition-all duration-200 shadow-lg hover:shadow-cyan-500/30 disabled:bg-background-interactive disabled:cursor-wait"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
                {isLoading ? 'Generating Models...' : 'Generate Age Models with AI'}
            </button>
            {error && <p className="text-danger-primary text-xs mt-2 text-center">{error}</p>}
        </div>

        <div className="p-4 bg-background-tertiary/50 rounded-xl shadow-lg border border-border-primary/50 space-y-4">
             <h3 className="text-lg font-semibold text-content-primary">Composite Splice Intervals</h3>
             <div className="max-h-60 overflow-y-auto space-y-3 pr-2 -mr-2">
                 {dataToDisplay.map(section => (
                     <div key={section.id} className="p-2 bg-background-primary/50 rounded-md">
                        <p className="text-sm font-bold text-content-secondary">{section.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <input
                                type="number"
                                placeholder="Start Age"
                                value={spliceIntervals[section.id]?.startAge ?? ''}
                                onChange={(e) => handleSpliceIntervalChange(section.id, 'startAge', e.target.value)}
                                className="w-full bg-background-interactive border border-border-secondary rounded-md p-1.5 text-xs"
                                disabled={!calibratedSections}
                             />
                             <span className="text-content-muted">-</span>
                             <input
                                type="number"
                                placeholder="End Age"
                                value={spliceIntervals[section.id]?.endAge ?? ''}
                                onChange={(e) => handleSpliceIntervalChange(section.id, 'endAge', e.target.value)}
                                className="w-full bg-background-interactive border border-border-secondary rounded-md p-1.5 text-xs"
                                disabled={!calibratedSections}
                             />
                        </div>
                     </div>
                 ))}
             </div>
        </div>

      </div>

      {/* Right Panel: Chart */}
      <div className="lg:col-span-2 bg-background-tertiary/50 p-6 rounded-xl shadow-lg border border-border-primary/50">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-content-primary">Multi-Section Correlation</h2>
            <div>
                 <label htmlFor="proxy-select" className="text-xs font-medium text-content-muted mr-2">Proxy:</label>
                 <select
                    id="proxy-select"
                    value={selectedProxy}
                    onChange={e => setSelectedProxy(e.target.value)}
                    className="bg-background-interactive border border-border-secondary rounded-lg p-2 text-sm text-content-primary focus:ring-2 focus:ring-accent-primary focus:outline-none transition"
                    disabled={availableProxies.length === 0}
                 >
                    {availableProxies.length === 0 ? <option>No data</option> :
                     availableProxies.map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
            </div>
        </div>
        {dataToDisplay.some(s => s.dataPoints?.length > 0) ? (
            <MultiSectionChart
                sections={dataToDisplay}
                spliceData={compositeSplice}
                proxyKey={selectedProxy}
                xAxisKey={calibratedSections ? 'age' : 'depth'}
            />
        ) : (
            <div className="flex items-center justify-center h-96 text-content-muted">
                <AlertCircle size={24} className="mr-2"/>
                <span>No data points in sections to display.</span>
            </div>
        )}

      </div>
    </div>
  );
};

export default CoreSynthesisView;
