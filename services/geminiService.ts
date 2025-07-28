
import { GoogleGenAI, GenerateContentResponse, Type, Content } from "@google/genai";
import type { Section, DataPoint, Microfossil, PartialMicrofossil, Taxonomy, EcologicalData, TiePoint } from '../types';
import { COMMON_DATA_KEYS } from "../constants";

if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const formatSectionDataForChat = (section: Section): string => {
    let dataSummary = 'No data points provided for this section.';
    if (section.dataPoints && section.dataPoints.length > 0) {
        const headers = Object.keys(section.dataPoints[0]);
        const samplePoints = section.dataPoints.slice(0, 5);
        dataSummary = `The section has a data series of ${section.dataPoints.length} points with columns: ${headers.join(', ')}.`;
    }

    return `
      Section Data:
      - Core ID: ${section.core_id}, Section Name: ${section.name}
      - Depth: ${section.sectionDepth} cmbsf
      - Age/Epoch: ${section.ageRange}, ${section.epoch}, ${section.geologicalPeriod} period
      - ${dataSummary}
    `;
};

export const getAnalysisFromAIStream = async (section: Section, query: string): Promise<AsyncGenerator<GenerateContentResponse>> => {
    if (!process.env.API_KEY) {
        throw new Error("Error: API key is not configured. Please contact the administrator.");
    }
    
    const model = 'gemini-2.5-flash';
    const systemInstruction = `You are a world-class paleoceanographer. Analyze the provided sediment section data to answer the user's question. Be concise, scientific, and refer to specific data points or trends where possible. If the user asks for recent information or studies, use your search tool.`;

    const sectionContext = formatSectionDataForChat(section);
    const finalPrompt = `${sectionContext}\n\nUser Question: "${query}"`;
    
    const searchKeywords = ['search', 'find studies', 'what is new on', 'latest research', 'recent articles'];
    const useSearch = searchKeywords.some(keyword => query.toLowerCase().includes(keyword));

    const contents: Content[] = [{ role: 'user', parts: [{ text: finalPrompt }] }];

    return ai.models.generateContentStream({
        model: model,
        contents: contents,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.5,
            ...(useSearch && { tools: [{ googleSearch: {} }] })
        },
    });
};


export const generateSectionSummary = async (section: Section, microfossils: Microfossil[]): Promise<string> => {
    if (!process.env.API_KEY) {
        return "Error: API key is not configured.";
    }
    
    const model = 'gemini-2.5-flash';
    const systemInstruction = `You are a paleoceanography expert. Your task is to provide a concise, integrated scientific summary of a sediment section. Focus on key findings, trends, and potential climatic implications suggested by the combined datasets. If data for a section is missing or sparse, note that. Structure your response with a brief overview followed by key bullet points.`;

    // Sanitize and summarize data for the prompt
    const dataForPrompt = {
        metadata: {
            coreId: section.core_id,
            sectionName: section.name,
            ageRange: section.ageRange,
            epoch: section.epoch,
            geologicalPeriod: section.geologicalPeriod,
        },
        labAnalysis: section.labAnalysis,
        fossilRecords: section.microfossilRecords.map(r => {
            const fossil = microfossils.find(f => f.id === r.fossilId);
            return {
                species: fossil ? `${fossil.taxonomy.genus} ${fossil.taxonomy.species}` : r.fossilId,
                abundance: r.abundance,
                preservation: r.preservation,
                observations: r.observations,
            };
        }),
        dataSeriesSummary: section.dataPoints.length > 0 ? {
            rowCount: section.dataPoints.length,
            columns: Object.keys(section.dataPoints[0] || {}),
            samplePoints: section.dataPoints.slice(0, 3)
        } : "Not provided"
    };

    const prompt = `Please generate a scientific summary for the following sediment section data:
    ${JSON.stringify(dataForPrompt, (key, value) => (value === null || value === '' || (Array.isArray(value) && value.length === 0)) ? undefined : value, 2)}
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        // Remove markdown-like characters (* and #) from the AI's response.
        const cleanedSummary = response.text.replace(/[*#]/g, '');
        return cleanedSummary;
    } catch (error) {
        console.error("Gemini Summary Error:", error);
        return `AI Summary Error: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`;
    }
};

export const mapCsvHeaders = async (headers: string[]): Promise<Record<string, string | null>> => {
    if (!process.env.API_KEY) throw new Error("API key is not configured.");
    
    const model = 'gemini-2.5-flash';
    const knownKeys = Object.keys(COMMON_DATA_KEYS);
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            mapping: {
                type: Type.OBJECT,
                properties: headers.reduce((acc, header) => {
                    acc[header] = { type: Type.STRING, description: `The mapped key for '${header}'. Should be one of [${knownKeys.join(', ')}] or null.` };
                    return acc;
                }, {} as Record<string, any>)
            }
        },
        required: ['mapping']
    };

    const prompt = `
      You are an expert data processor for paleoceanography. Your task is to map CSV headers to a standard set of keys.
      
      Here are the standard keys:
      ${knownKeys.join(', ')}

      Here are the headers from the user's CSV file:
      ${headers.join(', ')}

      Please provide a mapping for each header. If a header clearly corresponds to one of the standard keys, provide that key. If a header does not match any standard key or is ambiguous, map it to null.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            },
        });
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse.mapping;
    } catch (error) {
        console.error("Gemini Header Mapping Error:", error);
        // Fallback to a null mapping on error
        return headers.reduce((acc, header) => ({...acc, [header]: null }), {});
    }
};

export const identifyFossilFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
    if (!process.env.API_KEY) return "Error: API key is not configured.";

    const model = 'gemini-2.5-flash';
    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: mimeType,
        },
    };
    const textPart = {
        text: `You are a micropaleontologist. Please identify the microfossil in this image. Provide a probable identification, describe its key morphological features, and mention its typical paleoecological significance. Format your response clearly with the following headings:
### Identification
### Morphological Description
### Paleoecological Significance`,
    };

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [imagePart, textPart] },
        });
        return response.text;
    } catch (error) {
        console.error("Gemini Image Analysis Error:", error);
        return `AI Analysis Error: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`;
    }
};

// Helper to parse the AI's markdown response from image analysis
export const parseFossilAnalysis = (analysisText: string): PartialMicrofossil => {
    const parsedData: PartialMicrofossil & { taxonomy: Partial<Taxonomy>, ecology: Partial<EcologicalData> } = {
        taxonomy: {} as Partial<Taxonomy>,
        ecology: {} as Partial<EcologicalData>,
        description: '',
    };

    const sections: Record<string, string> = {};
    const lines = analysisText.split('\n');
    let currentSection: string | null = null;
    
    for (const line of lines) {
        const match = line.match(/^###\s+(.*)/);
        if (match) {
            currentSection = match[1].trim().toLowerCase();
            sections[currentSection] = '';
        } else if (currentSection && line.trim()) {
            sections[currentSection] += `${line.trim().replace(/^-|^\*/, '').trim()} `;
        }
    }
    
    // Extract Identification (Genus and species)
    if (sections['identification']) {
        const idText = sections['identification'].trim();
        // Assuming format "Genus species" or "G. species"
        const nameParts = idText.split(/\s+/);
        if (nameParts.length >= 2) {
            parsedData.taxonomy.genus = nameParts[0];
            parsedData.taxonomy.species = nameParts[1];
        } else {
             parsedData.taxonomy.genus = idText;
        }
    }
    
    // Extract Description
    if (sections['morphological description']) {
        parsedData.description = sections['morphological description'].trim();
    }
    
    // Extract Ecology
    if (sections['paleoecological significance']) {
        parsedData.ecology.notes = sections['paleoecological significance'].trim();
    }

    return parsedData as PartialMicrofossil;
};


export const generateAgeModel = async (sections: Section[], tiePoints: TiePoint[]): Promise<Section[]> => {
    if (!process.env.API_KEY) throw new Error("API key is not configured.");

    const model = 'gemini-2.5-flash';
    const systemInstruction = `You are a highly skilled paleoceanographic data scientist. Your task is to create an age model for a set of sediment sections from the same core.
    You will be given the sections, each with a series of data points at different depths, and a list of stratigraphic tie-points.
    A tie-point provides a known age for a specific depth in a specific section.
    
    Your instructions are:
    1. For each section, use the provided tie-points that belong to that section.
    2. Perform linear interpolation between the tie-points to calculate an age for every single 'depth' value in the 'dataPoints' array of that section.
    3. If a section has only one tie-point, you cannot interpolate. In this case, do not add an age to any data point for that section.
    4. If a section has no tie-points, do not add an age to any data point for that section.
    5. For depths outside the range of the provided tie-points, perform linear extrapolation using the two nearest tie-points.
    6. Return the full dataset as a JSON object containing an array of all the original sections, but with the 'dataPoints' arrays updated. Each data point object that could be calculated must now have a new 'age' property.
    
    Ensure your output is ONLY the JSON object and nothing else.`;

    // Create a lean version of the data for the prompt to save tokens
    const promptData = {
        sections: sections.map(s => ({
            id: s.id,
            name: s.name,
            dataPoints: s.dataPoints.map(dp => ({ depth: dp.depth })) // Only send depth
        })),
        tiePoints: tiePoints.map(tp => ({
            sectionId: tp.sectionId,
            depth: tp.depth,
            age: tp.age,
        })),
    };

    const prompt = `
      Here is the data:
      ${JSON.stringify(promptData, null, 2)}
    `;

    // Define the schema for the expected response
    const dataPointSchema = {
        type: Type.OBJECT,
        properties: {
            depth: { type: Type.NUMBER },
            age: { type: Type.NUMBER, nullable: true }
            // Note: The schema doesn't include other proxy values,
            // we will merge the result back with the original data.
        },
        required: ['depth'],
    };

    const sectionSchema = {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING },
            dataPoints: {
                type: Type.ARRAY,
                items: dataPointSchema,
            },
        },
        required: ['id', 'dataPoints'],
    };

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            calibratedSections: {
                type: Type.ARRAY,
                items: sectionSchema,
            },
        },
        required: ['calibratedSections'],
    };
    
    try {
        const result = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonResponse = JSON.parse(result.text);
        const calibratedSectionsFromAI = jsonResponse.calibratedSections;

        // Merge the AI-calculated ages back into the original full sections data
        const finalSections = sections.map(originalSection => {
            const calibratedData = calibratedSectionsFromAI.find((cs: any) => cs.id === originalSection.id);
            if (calibratedData) {
                const ageMap = new Map(calibratedData.dataPoints.map((dp: any) => [dp.depth, dp.age]));
                const updatedDataPoints = originalSection.dataPoints.map(dp => {
                    const calculatedAge = ageMap.get(dp.depth);
                    return {
                        ...dp,
                        age: (calculatedAge !== undefined && calculatedAge !== null && typeof calculatedAge === 'number') ? parseFloat(calculatedAge.toFixed(4)) : undefined,
                    };
                });
                return { ...originalSection, dataPoints: updatedDataPoints };
            }
            return originalSection;
        });

        return finalSections;

    } catch (error) {
        console.error("Gemini Age Model Error:", error);
        throw new Error(`AI Age Model Error: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`);
    }
};
