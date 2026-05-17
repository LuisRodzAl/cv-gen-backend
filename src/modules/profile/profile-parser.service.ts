import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class ProfileParserService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly logger = new Logger(ProfileParserService.name);

  constructor(configService: ConfigService) {
    this.genAI = new GoogleGenerativeAI(configService.getOrThrow<string>('google.apiKey'));
  }

  async parsePdfBuffer(fileBuffer: Buffer, mimeType: string = 'application/pdf'): Promise<any> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `
Eres un experto analizando CVs. Tu tarea es extraer la información del siguiente CV y estructurarla en un formato JSON exacto.
Extrae la siguiente información: nombre completo, título profesional, resumen, ubicación, habilidades, experiencia laboral y educación.

El JSON DEBE tener la siguiente estructura exacta:
{
  "fullName": "Nombre completo",
  "title": "Título profesional o rol principal (ej. Software Engineer)",
  "summary": "Un breve resumen profesional del candidato basado en el CV",
  "location": "Ubicación (Ciudad, País)",
  "skills": [
    { "name": "Nombre de la habilidad (ej. React)", "category": "Categoría (ej. Frontend, Backend, Soft Skill)", "level": 3 }
  ],
  "experiences": [
    { 
      "company": "Nombre de la empresa", 
      "position": "Cargo ocupado", 
      "startDate": "YYYY-MM-DD", 
      "endDate": "YYYY-MM-DD o null si es trabajo actual", 
      "description": "Descripción de responsabilidades y logros", 
      "technologies": ["Tecnología 1", "Tecnología 2"] 
    }
  ],
  "educations": [
    { 
      "institution": "Nombre de la institución educativa", 
      "degree": "Título obtenido", 
      "startDate": "YYYY-MM-DD", 
      "endDate": "YYYY-MM-DD o null si sigue estudiando" 
    }
  ]
}

Reglas importantes:
1. Para startDate y endDate, usa el formato YYYY-MM-DD. Si solo tienes el año, usa YYYY-01-01. Si tienes mes y año, usa YYYY-MM-01. Si es "presente" o actual, usa null.
2. Extrae las tecnologías de la descripción de la experiencia y ponlas en el array "technologies". Si no hay, usa un array vacío.
3. En la categoría de "skills", intenta clasificar en: Frontend, Backend, Database, Cloud, Soft Skill, Tools, etc.
4. El level de "skills" debe ser un número del 1 al 5 (si no se especifica, usa 3).
5. Responde ÚNICAMENTE con el JSON válido. No uses markdown ni comillas invertidas (\`\`\`).
`;

    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: fileBuffer.toString('base64'),
            mimeType
          }
        }
      ]);

      const text = result.response.text().trim();
      // Remover posibles comillas invertidas de markdown
      const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();

      return JSON.parse(cleanedText);
    } catch (e) {
      this.logger.error('Error parsing JSON from Gemini', e);
      throw new Error('No se pudo extraer la información del CV en un formato válido.');
    }
  }
}
