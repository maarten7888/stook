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
  columnCount?: number; // 1 of 2 kolommen gedetecteerd
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
    // Detecteert kolommen en leest eerst linkerkolom, dan rechterkolom
    const { text: structuredText, columnCount } = buildStructuredText(fullTextAnnotation);
    
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
      columnCount,
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
 * Detecteert of er 1 of 2 kolommen zijn op basis van x-coordinaten clustering
 * @param xPositions - Array van x-coordinaten van alle blocks
 * @returns 1 of 2 (aantal kolommen)
 */
function detectColumnCount(xPositions: number[]): number {
  if (xPositions.length < 3) {
    return 1; // Te weinig data voor kolomdetectie
  }
  
  // Sorteer x-posities
  const sorted = [...xPositions].sort((a, b) => a - b);
  
  // Bereken de mediaan x-positie
  const medianX = sorted[Math.floor(sorted.length / 2)];
  
  // Bereken de breedte van de pagina (max - min)
  const pageWidth = sorted[sorted.length - 1] - sorted[0];
  
  // Als de pagina breed is en er zijn duidelijk 2 clusters
  // (veel blocks links van mediaan, veel rechts van mediaan)
  const leftCount = sorted.filter(x => x < medianX).length;
  const rightCount = sorted.filter(x => x >= medianX).length;
  
  // Check of er een duidelijke scheiding is
  // Als beide helften minstens 30% van de blocks bevatten
  // EN de pagina breed genoeg is (minstens 400 pixels)
  const minBlocksPerColumn = Math.floor(xPositions.length * 0.3);
  const hasTwoColumns = 
    leftCount >= minBlocksPerColumn && 
    rightCount >= minBlocksPerColumn &&
    pageWidth > 400; // Minimaal 400 pixels breed voor 2 kolommen
  
  return hasTwoColumns ? 2 : 1;
}

/**
 * Wijs elk block toe aan een kolom (0 = links, 1 = rechts)
 * @param x - X-coordinaat van het block
 * @param columnThreshold - X-positie die de kolommen scheidt
 * @returns 0 voor linkerkolom, 1 voor rechterkolom
 */
function assignToColumn(x: number, columnThreshold: number): number {
  return x < columnThreshold ? 0 : 1;
}

/**
 * Bouw gestructureerde tekst op vanuit de fullTextAnnotation
 * Detecteert kolommen en leest eerst linkerkolom volledig, dan rechterkolom
 * om ingredient/stap mix te voorkomen bij 2-koloms kookboeken
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildStructuredText(fullTextAnnotation: any): { text: string; columnCount: number } {
  const textBlocks: Array<{ text: string; y: number; x: number; width: number }> = [];
  const xPositions: number[] = [];
  
  for (const page of fullTextAnnotation.pages || []) {
    for (const block of page.blocks || []) {
      const vertices = block.boundingBox?.vertices || [];
      const y = vertices[0]?.y || 0;
      const x = vertices[0]?.x || 0;
      const width = (vertices[2]?.x || 0) - x;
      
      let blockText = "";
      for (const paragraph of block.paragraphs || []) {
        let paragraphText = "";
        for (const word of paragraph.words || []) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const wordText = word.symbols?.map((s: any) => s.text || "").join("") || "";
          paragraphText += wordText + " ";
        }
        blockText += paragraphText.trim() + "\n";
      }
      
      if (blockText.trim()) {
        textBlocks.push({ text: blockText.trim(), y, x, width });
        // Gebruik center x voor kolomdetectie (x + width/2)
        xPositions.push(x + width / 2);
      }
    }
  }
  
  // Detecteer aantal kolommen
  const columnCount = detectColumnCount(xPositions);
  
  if (columnCount === 1) {
    // 1 kolom: sorteer op Y, dan X (huidige logica)
    const yTolerance = 20; // pixels
    textBlocks.sort((a, b) => {
      if (Math.abs(a.y - b.y) < yTolerance) {
        return a.x - b.x;
      }
      return a.y - b.y;
    });
    
    return {
      text: textBlocks.map(b => b.text).join("\n"),
      columnCount: 1,
    };
  }
  
  // 2 kolommen: bereken scheidingslijn (mediaan x-positie)
  const sortedX = [...xPositions].sort((a, b) => a - b);
  const columnThreshold = sortedX[Math.floor(sortedX.length / 2)];
  
  // Wijs blocks toe aan kolommen
  const leftColumn: typeof textBlocks = [];
  const rightColumn: typeof textBlocks = [];
  
  for (const block of textBlocks) {
    const centerX = block.x + block.width / 2;
    const column = assignToColumn(centerX, columnThreshold);
    
    if (column === 0) {
      leftColumn.push(block);
    } else {
      rightColumn.push(block);
    }
  }
  
  // Sorteer elke kolom op Y-positie (boven naar onder)
  const yTolerance = 20;
  const sortByY = (a: typeof textBlocks[0], b: typeof textBlocks[0]) => {
    if (Math.abs(a.y - b.y) < yTolerance) {
      return a.x - b.x;
    }
    return a.y - b.y;
  };
  
  leftColumn.sort(sortByY);
  rightColumn.sort(sortByY);
  
  // Combineer: eerst linkerkolom volledig, dan rechterkolom
  const combinedText = [
    ...leftColumn.map(b => b.text),
    ...rightColumn.map(b => b.text),
  ].join("\n");
  
  return {
    text: combinedText,
    columnCount: 2,
  };
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
      columnCount: 1,
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
    columnCount: 1, // Geen kolomdetectie mogelijk zonder fullTextAnnotation structuur
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
