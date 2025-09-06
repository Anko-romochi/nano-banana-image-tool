
import { GoogleGenAI, Modality } from "@google/genai";

interface GenerateImageParams {
    refImage1: File | null;
    refImage2: File | null;
    bgImage: File | null;
    prompt1: string;
    prompt2: string;
    promptOverall: string;
    sketchImage: string; // base64 data URL
}

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("Missing API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            // remove the `data:...;base64,` prefix
            resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(file);
    });

    return {
        inlineData: {
            data: await base64EncodedDataPromise,
            mimeType: file.type,
        },
    };
};

const base64ToGenerativePart = (base64DataUrl: string) => {
    const [meta, data] = base64DataUrl.split(',');
    const mimeType = meta.match(/:(.*?);/)?.[1] ?? 'image/png';
    return {
        inlineData: {
            data,
            mimeType,
        },
    };
};

export const generateImage = async ({
    refImage1,
    refImage2,
    bgImage,
    prompt1,
    prompt2,
    promptOverall,
    sketchImage,
}: GenerateImageParams): Promise<string | null> => {
    try {
        const model = 'gemini-2.5-flash-image-preview';

        const combinedPrompt = `
You are an expert AI image generator. Your task is to create a single, cohesive image based on the provided elements. Follow these instructions carefully:

**Overall Composition Prompt:**
${promptOverall || "A fantasy art scene."}

---

**Character 1 (Associated with Reference Image 1 and RED sketch):**
- **Description:** ${prompt1 || "The character from reference image 1."}
- **Pose:** The pose for this character is indicated by the **RED** lines in the sketch image.

**Character 2 (Associated with Reference Image 2 and BLUE sketch):**
- **Description:** ${prompt2 || "The character from reference image 2."}
- **Pose:** The pose for this character is indicated by the **BLUE** lines in the sketch image.

---

**Instructions:**
1.  Use the provided reference images to understand the appearance of the characters.
2.  Use the sketch image to determine the exact pose and placement of each character. The RED sketch is for Character 1, and the BLUE sketch is for Character 2.
3.  Use the optional background image as the setting. If no background image is provided, create a background that fits the "Overall Composition Prompt".
4.  Synthesize all these elements into a single, high-quality image.
`;

        const parts: any[] = [{ text: combinedPrompt }];

        // Order matters for some models, prompt first.
        if (refImage1) {
            parts.push(await fileToGenerativePart(refImage1));
        }
        if (refImage2) {
            parts.push(await fileToGenerativePart(refImage2));
        }
        if (bgImage) {
            parts.push(await fileToGenerativePart(bgImage));
        }
        
        parts.push(base64ToGenerativePart(sketchImage));


        const response = await ai.models.generateContent({
            model: model,
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        // Find the first image part in the response
        for (const candidate of response.candidates || []) {
            for (const part of candidate.content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return part.inlineData.data;
                }
            }
        }

        return null;

    } catch (error) {
        console.error("Error generating image with Gemini:", error);
        throw new Error("Failed to generate image. Please check your inputs and API key.");
    }
};
