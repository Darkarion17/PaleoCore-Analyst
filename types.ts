
export type DataPoint = {
  [key: string]: string | number | boolean | null;
  depth?: number;
  age?: number;
};

export interface Taxonomy {
    kingdom: string;
    phylum: string;
    class: string;
    order: string;
    family: string;
    genus: string;
    species: string;
}

export interface EcologicalData {
    temperatureRange: string;
    depthHabitat: string;
    notes: string;
}

export interface Microfossil {
    id: string;
    taxonomy: Taxonomy;
    description: string;
    stratigraphicRange: string;
    ecology: EcologicalData;
    imageUrl: string;
}

export type PartialMicrofossil = Partial<Omit<Microfossil, 'taxonomy' | 'ecology'>> & {
  taxonomy?: Partial<Taxonomy>;
  ecology?: Partial<EcologicalData>;
};

export type FossilAbundance = 'Abundant' | 'Common' | 'Few' | 'Rare' | 'Barren' | 'Present';
export type FossilPreservation = 'Good' | 'Moderate' | 'Poor';

export interface SectionFossilRecord {
    fossilId: string;
    abundance: FossilAbundance;
    preservation: FossilPreservation;
    observations: string;
}

export interface LabAnalysis {
  delta18O?: number | null;
  delta13C?: number | null;
  mgCaRatio?: number | null;
  tex86?: number | null;
  alkenoneSST?: number | null;
  calculatedSST?: number | null;
  baCa?: number | null;
  srCa?: number | null;
  cdCa?: number | null;
  radiocarbonDate?: number | null;
}

// A Core is the main entity, representing a drilling site or expedition core.
export interface Core {
  id: string; // e.g., ODP-982A
  name: string; // e.g., Rockall Plateau Sediments
  location: {
    lat: number;
    lon: number;
  };
  waterDepth: number; // in meters
  project: string;
  user_id?: string;
  folder_id?: string;
  createdAt?: string;
}

// A Section is a specific segment or hole within a Core, with its own data.
export interface Section {
  id: string; // Unique ID for the section (e.g., UUID)
  core_id: string; // Foreign key to the parent Core
  name: string; // e.g., "Hole A" or "Section 1H-1"
  sectionDepth: number; // Section Depth (cmbsf)
  sampleInterval?: number; // in cm
  recoveryDate: string;
  collectionTime?: string; // e.g., 21:56
  epoch: string; // e.g., 'Pleistocene'
  geologicalPeriod: 'Glacial' | 'Interglacial' | 'Indeterminate';
  ageRange: string; // e.g., '0 - 1.2 Ma'
  dataPoints: DataPoint[];
  microfossilRecords: SectionFossilRecord[];
  labAnalysis?: LabAnalysis;
  summary?: string;
  sectionImage: string;
  collector?: string;
  lithology?: string;
  munsellColor?: string;
  grainSize?: string;
  tephraLayers?: string;
  paleomagneticReversals?: string;
  createdAt?: string;
}


export interface Folder {
    id: string;
    name: string;
    user_id: string;
    created_at: string;
}

export interface Source {
    uri: string;
    title: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    sources?: Source[];
}

export interface TiePoint {
    id: string;
    sectionId: string;
    depth: number;
    age: number;
}

export interface SpliceInterval {
    sectionId: string;
    startAge: number | null;
    endAge: number | null;
}

// Type for sample data to be loaded for new users.
export type SampleSection = Omit<Section, 'id' | 'core_id' | 'createdAt'>;
export type SampleCore = Omit<Core, 'user_id' | 'folder_id' | 'createdAt'> & { sections: SampleSection[] };
