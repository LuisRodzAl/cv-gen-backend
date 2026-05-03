import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class ExportGeminiService {
  private readonly genAI: GoogleGenerativeAI;

  constructor(configService: ConfigService) {
    this.genAI = new GoogleGenerativeAI(configService.getOrThrow<string>('google.apiKey'));
  }

  async generateHtmlFromTemplate(
    cvData: Record<string, unknown>,
    targetRole: string,
    targetCompany: string,
    templateDescription: string,
  ): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `
Eres un experto en diseño de CVs y HTML/CSS. Tu tarea es generar un CV completo en HTML con estilos CSS inline y en <style>, listo para ser renderizado en un navegador y exportado a PDF.

## Datos del CV
${JSON.stringify(cvData, null, 2)}

## Puesto objetivo
Empresa: ${targetCompany}
Rol: ${targetRole}

## Estilo de plantilla a aplicar
${templateDescription}

## Instrucciones
- Genera un documento HTML completo (con <!DOCTYPE html>, <head> y <body>)
- Incluye todos los estilos en una etiqueta <style> en el <head>
- Usa @media print para asegurar que el PDF se vea igual que en pantalla
- El HTML debe ser autónomo, sin dependencias externas (sin Google Fonts CDN, usa font-family stack)
- Aplica fielmente el estilo descrito en la plantilla
- El resultado debe verse profesional y listo para entregar
- Responde ÚNICAMENTE con el HTML, sin texto adicional ni bloques de código markdown
    `.trim();

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  }

  async generateHtmlFromFileTemplate(
    cvData: Record<string, unknown>,
    targetRole: string,
    targetCompany: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `
Eres un experto en diseño de CVs y HTML/CSS. Se te proporciona una imagen o PDF de un formato de CV específico de una empresa.

Tu tarea es:
1. Analizar el diseño, estructura, colores, tipografía y layout del formato proporcionado
2. Generar un CV completo en HTML/CSS que replique fielmente ese formato
3. Rellenar el CV con los datos del candidato proporcionados

## Datos del candidato
${JSON.stringify(cvData, null, 2)}

## Puesto objetivo
Empresa: ${targetCompany}
Rol: ${targetRole}

## Instrucciones
- Analiza la imagen/PDF adjunta y replica su diseño exactamente
- Genera un documento HTML completo (con <!DOCTYPE html>, <head> y <body>)
- Incluye todos los estilos en una etiqueta <style> en el <head>
- Usa @media print para asegurar que el PDF se vea igual que en pantalla
- El HTML debe ser autónomo, sin dependencias externas
- Responde ÚNICAMENTE con el HTML, sin texto adicional ni bloques de código markdown
    `.trim();

    const imagePart = {
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    return result.response.text().trim();
  }
}
