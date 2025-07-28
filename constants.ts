
import type { Microfossil, SampleCore } from './types';

// =================================================================
// INITIAL MICROPALEONTOLOGY WIKI & FOSSIL DATABASE
// This is used to seed the user's local database on first load.
// =================================================================
export const INITIAL_MICROFOSSIL_DATABASE: Record<string, Microfossil> = {
    'G_ruber': {
        id: 'G_ruber',
        taxonomy: {
            kingdom: 'Rhizaria', phylum: 'Foraminifera', class: 'Globothalamea', order: 'Rotaliida',
            family: 'Globigerinidae', genus: 'Globigerinoides', species: 'ruber'
        },
        description: 'Test is a high trochospire. Chambers are globular, embracing. Primary aperture is a high arch over the umbilicus, bordered by a lip. Supplementary apertures are present at the spiral sutures of the final chambers. Wall is cancellate, spinose.',
        stratigraphicRange: 'Middle Miocene to Recent',
        ecology: {
            temperatureRange: 'Subtropical to Tropical (14-30°C)',
            depthHabitat: 'Epipelagic (0-75m)',
            notes: 'A common proxy for surface water conditions. Symbiont-bearing species, prefers oligotrophic waters.'
        },
        imageUrl: 'data:image/svg+xml,%3Csvg%20width%3D%22600%22%20height%3D%22600%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22600%22%20height%3D%22600%22%20fill%3D%22%231e293b%22%20%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%20font-style%3D%22italic%22%20font-size%3D%2248%22%20fill%3D%22%2394a3b8%22%3EG.%20ruber%3C%2Ftext%3E%3C%2Fsvg%3E',
    },
    'N_pachyderma': {
        id: 'N_pachyderma',
        taxonomy: {
            kingdom: 'Rhizaria', phylum: 'Foraminifera', class: 'Globothalamea', order: 'Rotaliida',
            family: 'Globorotaliidae', genus: 'Neogloboquadrina', species: 'pachyderma'
        },
        description: 'Test is a low, compact trochospire, typically with 4-4.5 chambers in the final whorl. Aperture is umbilical-extraumbilical. Wall texture can be crystalline and heavily encrusted, especially in sinistral (left-coiling) forms. Coiling direction is temperature-dependent.',
        stratigraphicRange: 'Middle Miocene to Recent',
        ecology: {
            temperatureRange: 'Polar to Subpolar (<8°C)',
            depthHabitat: 'Epipelagic to Mesopelagic (0-200m)',
            notes: 'The coiling direction is a key paleoceanographic proxy: sinistral (left-coiling) forms dominate in polar waters, while dextral (right-coiling) forms prefer subpolar waters.'
        },
        imageUrl: 'data:image/svg+xml,%3Csvg%20width%3D%22600%22%20height%3D%22600%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22600%22%20height%3D%22600%22%20fill%3D%22%231e293b%22%20%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%20font-style%3D%22italic%22%20font-size%3D%2248%22%20fill%3D%22%2394a3b8%22%3EN.%20pachyderma%3C%2Ftext%3E%3C%2Fsvg%3E',
    },
    'G_bulloides': {
        id: 'G_bulloides',
        taxonomy: {
            kingdom: 'Rhizaria', phylum: 'Foraminifera', class: 'Globothalamea', order: 'Rotaliida',
            family: 'Globigerinidae', genus: 'Globigerina', species: 'bulloides'
        },
        description: 'Test is a low trochospire with rapidly enlarging, globular chambers (typically 3.5-4 in the final whorl). The umbilicus is deep and open. The primary aperture is a high umbilical arch. The wall is cancellate and spinose.',
        stratigraphicRange: 'Late Eocene to Recent',
        ecology: {
            temperatureRange: 'Subpolar to Transitional (8-18°C)',
            depthHabitat: 'Epipelagic (0-100m)',
            notes: 'Often associated with upwelling zones and high surface water productivity. Non-symbiotic.'
        },
        imageUrl: 'data:image/svg+xml,%3Csvg%20width%3D%22600%22%20height%3D%22600%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22600%22%20height%3D%22600%22%20fill%3D%22%231e293b%22%20%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%20font-style%3D%22italic%22%20font-size%3D%2248%22%20fill%3D%22%2394a3b8%22%3EG.%20bulloides%3C%2Ftext%3E%3C%2Fsvg%3E',
    }
};

// =================================================================
// SAMPLE CORE AND SECTION DATA FOR DEMONSTRATION PURPOSES
// =================================================================
export const SAMPLE_DATA: SampleCore[] = [
    {
        id: 'ODP-982',
        name: 'North Atlantic Drilling Project',
        location: { lat: 57.51, lon: -15.86 },
        waterDepth: 1134,
        project: 'Ocean Drilling Program Leg 162',
        sections: [
            {
                name: 'Hole 982A',
                sectionDepth: 200,
                sampleInterval: 10,
                recoveryDate: '1995-07-22',
                collectionTime: '14:30',
                epoch: 'Pleistocene',
                geologicalPeriod: 'Glacial',
                ageRange: '0 - 0.8 Ma',
                dataPoints: [
                    { depth: 0, age: 5, d18O: 1.5 },
                    { depth: 10, age: 15, d18O: 2.8 },
                    { depth: 20, age: 25, d18O: 3.1 },
                ],
                microfossilRecords: [
                    { fossilId: 'N_pachyderma', abundance: 'Abundant', preservation: 'Good', observations: 'Dominantly sinistral coiling.' },
                    { fossilId: 'G_bulloides', abundance: 'Common', preservation: 'Moderate', observations: '' },
                ],
                labAnalysis: { delta18O: 3.1, delta13C: 0.8 },
                summary: 'High-resolution record from the North Atlantic showing distinct glacial-interglacial cycles of the late Pleistocene. Dominated by polar foraminifera N. pachyderma.',
                sectionImage: `data:image/svg+xml,${encodeURIComponent(`<svg width="800" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="100" fill="#1e293b" /><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#94a3b8">ODP-982A</text></svg>`)}`,
                collector: 'JOIDES Resolution',
                lithology: 'Nannofossil Ooze',
                munsellColor: '10YR 6/2',
            }
        ]
    },
    {
        id: 'V28-238',
        name: 'Pacific Paleoceanography Initiative',
        location: { lat: 1.2, lon: 160.5 },
        waterDepth: 3490,
        project: 'Lamont-Doherty Core Research',
        sections: [
            {
                name: 'Main Section',
                sectionDepth: 1500,
                sampleInterval: 20,
                recoveryDate: '1982-03-15',
                collectionTime: '10:00',
                epoch: 'Pliocene',
                geologicalPeriod: 'Interglacial',
                ageRange: '2.5 - 3.5 Ma',
                dataPoints: [
                    { depth: 0, age: 2.5, d18O: -0.5 },
                    { depth: 20, age: 2.8, d18O: -0.2 },
                    { depth: 40, age: 3.2, d18O: 0.1 },
                ],
                microfossilRecords: [
                    { fossilId: 'G_ruber', abundance: 'Abundant', preservation: 'Good', observations: 'Tropical warm-water species dominating the assemblage.' },
                ],
                summary: 'Classic core from the Western Pacific warm pool, providing key insights into Pliocene climate and the Walker circulation. Contains well-preserved tropical foraminifera.',
                sectionImage: `data:image/svg+xml,${encodeURIComponent(`<svg width="800" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="100" fill="#1e293b" /><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#94a3b8">V28-238</text></svg>`)}`,
                collector: 'R/V Vema',
                lithology: 'Foraminiferal Ooze',
            }
        ]
    }
];


// =================================================================
// COMMON DATA KEYS FOR CSV PARSING
// This helps map different user-provided headers to a standard format.
// =================================================================
export const COMMON_DATA_KEYS: Record<string, string[]> = {
    depth: ['depth', 'depth(m)', 'depth (m)', 'profundidad', 'mbsf', 'csf-a'],
    age: ['age', 'age(ka)', 'age (ka)', 'edad', 'edad (ka)'],
    d18O: ['d18o', 'delta18o', 'δ18o', 'd18o_vs_pdb'],
    d13C: ['d13c', 'delta13c', 'δ13c', 'd13c_vs_pdb'],
    CaCO3: ['caco3', 'caco3(%)', 'caco3 %', 'caco3wt%'],
    mgCa: ['mgca', 'mg/ca'],
    temperature: ['temp', 'sst', 'temperature'],
};

// =================================================================
// GEOGRAPHICAL REGIONS FOR MAP FILTERING
// Defines bounding boxes for major oceanic regions.
// =================================================================
export const REGIONS: Record<string, { minLon: number; maxLon: number; minLat: number; maxLat: number }> = {
    'Atlantic Ocean': { minLon: -70, maxLon: 20, minLat: -60, maxLat: 70 },
    'Pacific Ocean': { minLon: 120, maxLon: -70, minLat: -60, maxLat: 65 }, // Crosses date line
    'Indian Ocean': { minLon: 20, maxLon: 120, minLat: -60, maxLat: 30 },
    'Mediterranean Sea': { minLon: -6, maxLon: 36, minLat: 30, maxLat: 46 },
    'Antarctic Ocean': { minLon: -180, maxLon: 180, minLat: -90, maxLat: -60 },
    'Arctic Ocean': { minLon: -180, maxLon: 180, minLat: 65, maxLat: 90 },
};
