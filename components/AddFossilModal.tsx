


import React, { useState, useEffect } from 'react';
import type { Microfossil, Taxonomy, PartialMicrofossil } from '../types';
import { X, Save, BookOpen, Microscope, Thermometer, Image } from 'lucide-react';

interface AddFossilModalProps {
    onAddFossil: (fossil: Microfossil) => void;
    onClose: () => void;
    fossilToCreate?: Partial<Microfossil> | null;
}

const initialFossilState: Omit<Microfossil, 'id' | 'taxonomy'> & { taxonomy: Taxonomy } = {
    taxonomy: {
        kingdom: 'Rhizaria',
        phylum: 'Foraminifera',
        class: 'Globothalamea',
        order: 'Rotaliida',
        family: '',
        genus: '',
        species: ''
    },
    description: '',
    stratigraphicRange: '',
    ecology: {
        temperatureRange: '',
        depthHabitat: '',
        notes: ''
    },
    imageUrl: ''
};

const FormSection: React.FC<{title: string; icon: React.ReactNode; children: React.ReactNode}> = ({title, icon, children}) => (
    <div className="space-y-3 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
        <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
            {icon}
            {title}
        </h3>
        <div className="space-y-2">{children}</div>
    </div>
);

const SubInputField = ({ id, label, value, onChange, name, required = false }: {id: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, name: string, required?: boolean }) => (
    <div>
        <label htmlFor={id} className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
        <input
            type="text"
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-sm text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition"
        />
    </div>
);

const AddFossilModal: React.FC<AddFossilModalProps> = ({ onAddFossil, onClose, fossilToCreate }) => {
    const [formData, setFormData] = useState(initialFossilState);
    const [fossilId, setFossilId] = useState('');

    useEffect(() => {
        if (fossilToCreate) {
            setFormData(prev => ({
                ...prev,
                taxonomy: {
                    ...prev.taxonomy,
                    ...fossilToCreate.taxonomy,
                },
                description: fossilToCreate.description || prev.description,
                stratigraphicRange: fossilToCreate.stratigraphicRange || prev.stratigraphicRange,
                ecology: {
                    ...prev.ecology,
                    ...fossilToCreate.ecology,
                },
                imageUrl: fossilToCreate.imageUrl || prev.imageUrl,
            }));
            if (fossilToCreate.taxonomy?.genus && fossilToCreate.taxonomy?.species) {
                const genus = fossilToCreate.taxonomy.genus.charAt(0).toUpperCase();
                const species = fossilToCreate.taxonomy.species.toLowerCase();
                setFossilId(`${genus}_${species}`);
            }
        }
    }, [fossilToCreate]);

    const isFormValid = fossilId.trim() !== '' && formData.taxonomy.genus.trim() !== '' && formData.taxonomy.species.trim() !== '';

    const handleTaxonomyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, taxonomy: { ...prev.taxonomy, [e.target.name]: e.target.value } }));
    };

    const handleEcologyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, ecology: { ...prev.ecology, [e.target.name]: e.target.value } }));
    };

    const handleMainChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;
        
        const newFossil: Microfossil = {
            id: fossilId,
            ...formData
        };

        onAddFossil(newFossil);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] animate-fade-in-fast" onClick={onClose}>
            <div className="bg-slate-800 rounded-xl shadow-2xl p-8 w-full max-w-4xl border border-slate-700 m-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Add New Microfossil to Database</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="fossilId" className="block text-sm font-medium text-slate-300 mb-1">Unique Fossil ID* (e.g., G_sacculifer)</label>
                        <input
                            type="text"
                            id="fossilId"
                            value={fossilId}
                            onChange={(e) => setFossilId(e.target.value)}
                            required
                            placeholder="A unique identifier"
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                        />
                    </div>
                    
                    <FormSection title="Taxonomy" icon={<BookOpen size={18}/>}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.keys(formData.taxonomy).map((key) => (
                                <SubInputField
                                    key={key}
                                    id={`taxonomy-${key}`}
                                    label={`${key.charAt(0).toUpperCase() + key.slice(1)}${key === 'genus' || key === 'species' ? '*' : ''}`}
                                    name={key}
                                    value={formData.taxonomy[key as keyof typeof formData.taxonomy]}
                                    onChange={handleTaxonomyChange}
                                    required={key === 'genus' || key === 'species'}
                                />
                            ))}
                        </div>
                    </FormSection>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <FormSection title="Morphology & Stratigraphy" icon={<Microscope size={18}/>}>
                           <SubInputField id="stratigraphicRange" label="Stratigraphic Range" name="stratigraphicRange" value={formData.stratigraphicRange} onChange={handleMainChange} />
                           <div>
                                <label htmlFor="description" className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleMainChange}
                                    rows={4}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-sm text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition"
                                />
                           </div>
                        </FormSection>

                        <FormSection title="Paleoecology" icon={<Thermometer size={18}/>}>
                            <SubInputField id="temperatureRange" label="Temperature Range" name="temperatureRange" value={formData.ecology.temperatureRange} onChange={handleEcologyChange} />
                            <SubInputField id="depthHabitat" label="Depth Habitat" name="depthHabitat" value={formData.ecology.depthHabitat} onChange={handleEcologyChange} />
                            <div>
                                <label htmlFor="ecology-notes" className="block text-xs font-medium text-slate-400 mb-1">Notes</label>
                                <textarea
                                    id="ecology-notes"
                                    name="notes"
                                    value={formData.ecology.notes}
                                    onChange={handleEcologyChange}
                                    rows={2}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-sm text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition"
                                />
                           </div>
                        </FormSection>
                    </div>

                    <FormSection title="Image" icon={<Image size={18} />}>
                       <SubInputField id="imageUrl" label="Image URL" name="imageUrl" value={formData.imageUrl} onChange={handleMainChange} />
                    </FormSection>


                    <div className="flex justify-end gap-4 pt-6 border-t border-slate-700">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition">Cancel</button>
                        <button type="submit" disabled={!isFormValid} className="px-6 py-2 rounded-lg bg-cyan-600 text-white font-semibold hover:bg-cyan-500 transition disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center gap-2">
                           <Save size={18} />
                           Save Microfossil
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddFossilModal;
