import { ImageAnnotatorClient } from "@google-cloud/vision";

/**
 * GoogleVisionOcr - OCR via Google Cloud Vision API
 * 
 * Gebruikt textDetection voor het herkennen van tekst in afbeeldingen.
 * Service account credentials worden geladen via GOOGLE_APPLICATION_CREDENTIALS_JSON env var.
 */

let visionClient: ImageAnnotatorClient | null = null;

function getVisionClient(): ImageAnnotatorClient {
  if (visionClient) {
    return visionClient;
  }

  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  
  if (!credentialsJson) {
    throw new Error(
      "GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set. " +
      "Please configure your Google Cloud Vision credentials."
    );
  }

  try {
    // Clean the input - remove any whitespace, newlines, or quotes that Vercel might add
    let cleanedInput = credentialsJson.trim();
    
    // Remove surrounding quotes if present
    if ((cleanedInput.startsWith('"') && cleanedInput.endsWith('"')) ||
        (cleanedInput.startsWith("'") && cleanedInput.endsWith("'"))) {
      cleanedInput = cleanedInput.slice(1, -1);
    }
    
    console.log("Parsing Google credentials, input length:", cleanedInput.length);
    console.log("First 50 chars:", cleanedInput.substring(0, 50));
    
    let jsonString = cleanedInput;
    
    // Check if it's base64 encoded (doesn't start with {)
    if (!cleanedInput.startsWith('{')) {
      console.log("Detected base64 encoded credentials, decoding...");
      
      // Remove any whitespace/newlines that might have been added
      const cleanBase64 = cleanedInput.replace(/\s/g, '');
      console.log("Clean base64 length:", cleanBase64.length);
      
      // Decode base64
      jsonString = Buffer.from(cleanBase64, 'base64').toString('utf-8');
      console.log("Decoded JSON length:", jsonString.length);
      console.log("Decoded first 100 chars:", jsonString.substring(0, 100));
      console.log("Decoded last 100 chars:", jsonString.substring(jsonString.length - 100));
      
      // Check if decoded string looks like valid JSON
      if (!jsonString.startsWith('{')) {
        console.error("Decoded string doesn't start with {, first char code:", jsonString.charCodeAt(0));
      }
      if (!jsonString.endsWith('}')) {
        console.error("Decoded string doesn't end with }, last char code:", jsonString.charCodeAt(jsonString.length - 1));
        // Try to trim any trailing whitespace or invisible characters
        jsonString = jsonString.replace(/[\s\x00-\x1F\x7F]+$/, '');
        console.log("After trim, last 50 chars:", jsonString.substring(jsonString.length - 50));
      }
    }
    
    const credentials = JSON.parse(jsonString);
    
    // Ensure newlines in private_key are actual newlines
    if (credentials.private_key && typeof credentials.private_key === 'string') {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }
    
    console.log("Credentials parsed successfully, project_id:", credentials.project_id);
    console.log("Client email:", credentials.client_email);
    
    visionClient = new ImageAnnotatorClient({
      credentials,
      projectId: credentials.project_id || process.env.GOOGLE_PROJECT_ID,
    });
    console.log("Vision client created successfully");
    return visionClient;
  } catch (error) {
    console.error("Error parsing Google credentials:", {
      error: error instanceof Error ? error.message : error,
      inputLength: credentialsJson?.length,
      first100chars: credentialsJson?.substring(0, 100),
      last50chars: credentialsJson?.substring(credentialsJson.length - 50),
    });
    throw new Error("Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON format: " + (error instanceof Error ? error.message : "unknown"));
  }
}

export interface OcrResult {
  rawText: string;
  confidence: number;
  blocks: TextBlock[];
}

export interface TextBlock {
  text: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Voert OCR uit op een afbeelding buffer
 * Gebruikt documentTextDetection voor betere structuur bij documenten/recepten
 * 
 * @param imageBuffer - Buffer van de afbeelding
 * @returns OcrResult met herkende tekst en confidence
 */
export async function performOcr(imageBuffer: Buffer): Promise<OcrResult> {
  const client = getVisionClient();

  try {
    // Gebruik documentTextDetection voor betere structuur bij documenten
    // Dit geeft pages/blocks/paragraphs/words structuur
    const [result] = await client.documentTextDetection({
      image: {
        content: imageBuffer,
      },
    });

    const fullTextAnnotation = result.fullTextAnnotation;
    
    if (!fullTextAnnotation || !fullTextAnnotation.text) {
      // Fallback naar textDetection als documentTextDetection geen resultaat geeft
      return await performBasicOcr(imageBuffer, client);
    }

    // Bouw tekst op vanuit de structuur (pages → blocks → paragraphs)
    // Dit geeft betere leesbare tekst dan de raw output
    const structuredText = buildStructuredText(fullTextAnnotation);
    
    // Parse de blokken voor gedetailleerde info
    const blocks: TextBlock[] = [];
    
    for (const page of fullTextAnnotation.pages || []) {
      for (const block of page.blocks || []) {
        const vertices = block.boundingBox?.vertices || [];
        const x = vertices[0]?.x || 0;
        const y = vertices[0]?.y || 0;
        const width = (vertices[2]?.x || 0) - x;
        const height = (vertices[2]?.y || 0) - y;
        
        // Verzamel tekst uit paragraphs in dit block
        let blockText = "";
        for (const paragraph of block.paragraphs || []) {
          for (const word of paragraph.words || []) {
            const wordText = word.symbols?.map(s => s.text).join("") || "";
            blockText += wordText + " ";
          }
          blockText += "\n";
        }
        
        if (blockText.trim()) {
          blocks.push({
            text: blockText.trim(),
            boundingBox: { x, y, width, height },
          });
        }
      }
    }

    // Bereken confidence op basis van de document-level confidence
    let totalConfidence = 0;
    let wordCount = 0;
    
    for (const page of fullTextAnnotation.pages || []) {
      for (const block of page.blocks || []) {
        if (block.confidence) {
          totalConfidence += block.confidence;
          wordCount++;
        }
      }
    }
    
    const confidence = wordCount > 0 ? totalConfidence / wordCount : 0.5;

    return {
      rawText: structuredText || fullTextAnnotation.text || "",
      confidence: Math.round(confidence * 100) / 100,
      blocks,
    };
  } catch (error) {
    console.error("Google Vision OCR error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      code: (error as { code?: string })?.code,
    });
    throw error;
  }
}

/**
 * Bouw gestructureerde tekst op vanuit de fullTextAnnotation
 * Sorteert blocks op positie (boven naar onder, links naar rechts)
 * om kolom-layouts correct te lezen
 */
function buildStructuredText(fullTextAnnotation: { pages?: Array<{ blocks?: Array<{ boundingBox?: { vertices?: Array<{ x?: number | null; y?: number | null }> }; paragraphs?: Array<{ words?: Array<{ symbols?: Array<{ text?: string | null }> }> }> }> }> }): string {
  const textBlocks: Array<{ text: string; y: number; x: number }> = [];
  
  for (const page of fullTextAnnotation.pages || []) {
    for (const block of page.blocks || []) {
      const vertices = block.boundingBox?.vertices || [];
      const y = vertices[0]?.y || 0;
      const x = vertices[0]?.x || 0;
      
      let blockText = "";
      for (const paragraph of block.paragraphs || []) {
        let paragraphText = "";
        for (const word of paragraph.words || []) {
          const wordText = word.symbols?.map(s => s.text || "").join("") || "";
          paragraphText += wordText + " ";
        }
        blockText += paragraphText.trim() + "\n";
      }
      
      if (blockText.trim()) {
        textBlocks.push({ text: blockText.trim(), y, x });
      }
    }
  }
  
  // Sorteer blocks op Y-positie (boven naar onder), dan X (links naar rechts)
  // Met een tolerantie voor blocks op ongeveer dezelfde hoogte
  const yTolerance = 20; // pixels
  textBlocks.sort((a, b) => {
    // Als de Y-posities dichtbij zijn, sorteer op X
    if (Math.abs(a.y - b.y) < yTolerance) {
      return a.x - b.x;
    }
    return a.y - b.y;
  });
  
  return textBlocks.map(b => b.text).join("\n");
}

/**
 * Fallback naar basic textDetection
 */
async function performBasicOcr(imageBuffer: Buffer, client: ImageAnnotatorClient): Promise<OcrResult> {
  const [result] = await client.textDetection({
    image: {
      content: imageBuffer,
    },
  });

  const textAnnotations = result.textAnnotations;
  
  if (!textAnnotations || textAnnotations.length === 0) {
    return {
      rawText: "",
      confidence: 0,
      blocks: [],
    };
  }

  const fullText = textAnnotations[0].description || "";
  
  const blocks: TextBlock[] = textAnnotations.slice(1).map((annotation) => {
    const vertices = annotation.boundingPoly?.vertices || [];
    const x = vertices[0]?.x || 0;
    const y = vertices[0]?.y || 0;
    const width = (vertices[1]?.x || 0) - x;
    const height = (vertices[2]?.y || 0) - y;

    return {
      text: annotation.description || "",
      boundingBox: { x, y, width, height },
    };
  });

  const confidence = fullText.length > 50 ? 0.85 : fullText.length > 10 ? 0.7 : 0.5;

  return {
    rawText: fullText,
    confidence,
    blocks,
  };
}

/**
 * Valideert of de afbeelding geschikt is voor OCR
 * @param mimeType - MIME type van de afbeelding
 * @param sizeBytes - Grootte in bytes
 * @returns Object met valid boolean en eventuele error message
 */
export function validateImage(
  mimeType: string,
  sizeBytes: number
): { valid: boolean; error?: string } {
  const allowedMimes = (process.env.OCR_ALLOWED_MIME || "image/jpeg,image/png,image/webp").split(",");
  const maxBytes = parseInt(process.env.OCR_MAX_BYTES || "8000000", 10);

  if (!allowedMimes.includes(mimeType)) {
    return {
      valid: false,
      error: `Bestandstype niet ondersteund. Gebruik: ${allowedMimes.join(", ")}`,
    };
  }

  if (sizeBytes > maxBytes) {
    const maxMb = Math.round(maxBytes / 1024 / 1024);
    return {
      valid: false,
      error: `Bestand is te groot. Maximum: ${maxMb}MB`,
    };
  }

  return { valid: true };
}
