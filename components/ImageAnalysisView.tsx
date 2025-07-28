



import React, { useState } from 'react';
import type { PartialMicrofossil } from '../types';
import { Image, UploadCloud, Bot, Loader2, AlertCircle, Save } from 'lucide-react';
import { identifyFossilFromImage, parseFossilAnalysis } from '../services/geminiService';

interface ImageAnalysisViewProps {
    onAddFossil: (data: PartialMicrofossil) => void;
}

const ImageAnalysisView: React.FC<ImageAnalysisViewProps> = ({ onAddFossil }) => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [analysisResult, setAnalysisResult] = useState<string>('');
    const [parsedFossil, setParsedFossil] = useState<PartialMicrofossil | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                setError('File is too large. Please select an image under 4MB.');
                return;
            }
            setError('');
            setAnalysisResult('');
            setParsedFossil(null);
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleAnalyze = async () => {
        if (!imageFile || !imagePreview) return;
        
        setIsLoading(true);
        setError('');
        setAnalysisResult('');
        setParsedFossil(null);

        try {
            // The preview is already a base64 string
            const base64Data = imagePreview.split(',')[1];
            const result = await identifyFossilFromImage(base64Data, imageFile.type);
            setAnalysisResult(result);
            const parsedData = parseFossilAnalysis(result);
            setParsedFossil({ ...parsedData, imageUrl: imagePreview });
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred during analysis.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveAsFossil = () => {
        if (parsedFossil) {
            onAddFossil(parsedFossil);
        }
    };
    
    // Function to render the analysis with markdown-like formatting
    const renderAnalysis = (text: string) => {
        return text
            .split('\n')
            .map((line, index) => {
                if (line.startsWith('### ')) {
                    return <h3 key={index} className="text-lg font-semibold text-cyan-300 mt-4 mb-2">{line.replace('### ', '')}</h3>;
                }
                return <p key={index} className="mb-2">{line}</p>;
            })
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Image /> AI Image Analysis</h1>
            
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                <h2 className="text-xl font-semibold mb-4 text-slate-200">Upload Microfossil Image</h2>
                <div className="flex items-center justify-center w-full mb-6">
                    <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-900/50 hover:bg-slate-800/60">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-8 h-8 mb-2 text-slate-500" />
                            <p className="text-sm text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-slate-500">PNG, JPG, WEBP (Max 4MB)</p>
                        </div>
                        <input id="image-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} />
                    </label>
                </div>
                {error && (
                    <div className="mt-4 p-3 rounded-lg flex items-center gap-2 text-sm bg-red-500/20 text-red-300">
                        <AlertCircle size={18}/> {error}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 space-y-4">
                    <h2 className="text-xl font-semibold text-slate-200">Image Preview</h2>
                    <div className="w-full h-80 bg-slate-900/50 rounded-lg border border-slate-700 flex items-center justify-center overflow-hidden">
                       {imagePreview ? (
                            <img src={imagePreview} alt="Microfossil preview" className="max-h-full max-w-full object-contain" />
                       ) : (
                           <p className="text-slate-500">No image selected</p>
                       )}
                    </div>
                     <button 
                        onClick={handleAnalyze} 
                        disabled={!imageFile || isLoading} 
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-cyan-600 text-white font-bold hover:bg-cyan-500 transition-all duration-200 shadow-lg hover:shadow-cyan-500/30 disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                       {isLoading ? <Loader2 className="animate-spin" /> : <Bot />}
                       {isLoading ? 'Analyzing...' : 'Analyze with PaleoAI'}
                    </button>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 min-h-[468px]">
                    <h2 className="text-xl font-semibold mb-4 text-slate-200 flex items-center gap-3"><Bot /> Analysis Result</h2>
                    {isLoading ? (
                        <div className="flex items-center gap-3 text-slate-400 pt-10 justify-center">
                            <Loader2 className="animate-spin" size={24}/>
                            <p>The AI is examining the image. This may take a moment...</p>
                        </div>
                    ) : analysisResult ? (
                        <div className="prose prose-sm prose-invert max-w-none text-slate-300">
                           {renderAnalysis(analysisResult)}
                           <div className="mt-6 border-t border-slate-700 pt-4">
                               <button 
                                   onClick={handleSaveAsFossil}
                                   disabled={!parsedFossil}
                                   className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/80 text-white hover:bg-emerald-600 transition-colors text-sm font-semibold disabled:bg-slate-600 disabled:cursor-not-allowed"
                                >
                                   <Save size={16}/> Save as New Fossil Record
                               </button>
                           </div>
                        </div>
                    ) : (
                         <div className="flex items-center justify-center pt-10 text-slate-500">
                             <p>Analysis will appear here.</p>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageAnalysisView;
