// These types define the shape of the database tables with snake_case properties.
// They are used to provide strong typing for the Supabase client.
// The application itself will use camelCase types defined in `types.ts`.
// Mapping functions in `services/coreService.ts` will convert between the two formats.

// Specific JSON object shapes for type safety and to prevent TS errors.
export type CoreLocation = { lat: number; lon: number };
export type CoreLabAnalysis = {
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
};
export type FossilTaxonomy = {
    kingdom: string;
    phylum: string;
    class: string;
    order: string;
    family: string;
    genus: string;
    species: string;
};
export type FossilEcology = {
    temperatureRange: string;
    depthHabitat: string;
    notes: string;
};

export type SectionFossilRecordInJson = {
    fossil_id: string;
    abundance: 'Abundant' | 'Common' | 'Few' | 'Rare' | 'Barren' | 'Present';
    preservation: 'Good' | 'Moderate' | 'Poor';
    observations: string;
};

export type JsonDataPoint = {
  [key: string]: string | number | boolean | null;
  depth?: number;
  age?: number;
};

// Represents a row in the new parent 'cores' table
export type CoreRow = {
  id: string; // The primary key, e.g., ODP-982A
  user_id: string;
  name: string; // e.g., "Rockall Plateau Sediments"
  location: CoreLocation;
  water_depth: number;
  project: string;
  folder_id: string | null;
  created_at: string;
};

// Represents a row in the new child 'sections' table
export type SectionRow = {
  id: string; // Primary key (UUID)
  core_id: string; // Foreign key to cores.id
  name: string; // e.g., "Hole A"
  section_depth: number;
  sample_interval: number | null;
  recovery_date: string;
  collection_time: string | null;
  epoch: string;
  geological_period: 'Glacial' | 'Interglacial' | 'Indeterminate';
  age_range: string;
  data_points: JsonDataPoint[] | null;
  microfossil_records: SectionFossilRecordInJson[] | null;
  lab_analysis: CoreLabAnalysis | null;
  summary: string | null;
  section_image: string;
  collector: string | null;
  lithology: string | null;
  munsell_color: string | null;
  grain_size: string | null;
  tephra_layers: string | null;
  paleomagnetic_reversals: string | null;
  created_at: string;
}

// Represents a row in the 'microfossils' table
export type MicrofossilRow = {
    id: string;
    taxonomy: FossilTaxonomy;
    description: string | null;
    stratigraphic_range: string | null;
    ecology: FossilEcology;
    image_url: string | null;
    created_at: string;
};

export type FolderRow = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

// This is the structure that the Supabase client will be typed against.
export interface Database {
  public: {
    Tables: {
      cores: {
        Row: CoreRow;
        Insert: {
          id: string;
          user_id: string;
          name: string;
          location: CoreLocation;
          water_depth: number;
          project: string;
          folder_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          location?: CoreLocation;
          water_depth?: number;
          project?: string;
          folder_id?: string | null;
        };
      };
      sections: {
        Row: SectionRow;
        Insert: {
          id?: string;
          core_id: string;
          name: string;
          section_depth: number;
          sample_interval?: number | null;
          recovery_date: string;
          collection_time?: string | null;
          epoch: string;
          geological_period: "Glacial" | "Interglacial" | "Indeterminate";
          age_range: string;
          data_points?: JsonDataPoint[] | null;
          microfossil_records?: SectionFossilRecordInJson[] | null;
          lab_analysis?: CoreLabAnalysis | null;
          summary?: string | null;
          section_image?: string;
          collector?: string | null;
          lithology?: string | null;
          munsell_color?: string | null;
          grain_size?: string | null;
          tephra_layers?: string | null;
          paleomagnetic_reversals?: string | null;
        };
        Update: {
          id?: string;
          core_id?: string;
          name?: string;
          section_depth?: number;
          sample_interval?: number | null;
          recovery_date?: string;
          collection_time?: string | null;
          epoch?: string;
          geological_period?: "Glacial" | "Interglacial" | "Indeterminate";
          age_range?: string;
          data_points?: JsonDataPoint[] | null;
          microfossil_records?: SectionFossilRecordInJson[] | null;
          lab_analysis?: CoreLabAnalysis | null;
          summary?: string | null;
          section_image?: string;
          collector?: string | null;
          lithology?: string | null;
          munsell_color?: string | null;
          grain_size?: string | null;
          tephra_layers?: string | null;
          paleomagnetic_reversals?: string | null;
        };
      };
      microfossils: {
        Row: MicrofossilRow;
        Insert: {
            id: string;
            taxonomy: FossilTaxonomy;
            description?: string | null;
            stratigraphic_range?: string | null;
            ecology: FossilEcology;
            image_url?: string | null;
        };
        Update: {
            id?: string;
            taxonomy?: FossilTaxonomy;
            description?: string | null;
            stratigraphic_range?: string | null;
            ecology?: FossilEcology;
            image_url?: string | null;
        };
      };
      folders: {
        Row: FolderRow;
        Insert: {
          id?: string;
          user_id: string;
          name: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}