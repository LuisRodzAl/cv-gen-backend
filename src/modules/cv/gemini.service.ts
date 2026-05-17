import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ProfileModel } from 'src/generated/prisma/models/Profile';
import type { WorkExperienceModel } from 'src/generated/prisma/models/WorkExperience';
import type { EducationModel } from 'src/generated/prisma/models/Education';
import type { SkillModel } from 'src/generated/prisma/models/Skill';
import type { CertificateModel } from 'src/generated/prisma/models/Certificate';

export interface ProfileWithRelations extends ProfileModel {
  experiences: WorkExperienceModel[];
  educations: EducationModel[];
  skills: SkillModel[];
  certificates: CertificateModel[];
}

@Injectable()
export class GeminiService {
  private readonly genAI: GoogleGenerativeAI;

  constructor(configService: ConfigService) {
    this.genAI = new GoogleGenerativeAI(configService.getOrThrow<string>('google.apiKey'));
  }

  async generateCv(
    profile: ProfileWithRelations,
    jobDescription: string,
    targetRole: string,
    targetCompany: string,
    primaryCvJson?: Record<string, any> | null,
  ): Promise<Record<string, unknown>> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const certificatesSection = profile.certificates.length > 0
      ? `### Certificados disponibles\n${profile.certificates.map((c) =>
          `- ${c.name} — ${c.issuer}${c.issueDate ? ` (${c.issueDate.toISOString().slice(0, 7)})` : ''}${c.description ? `: ${c.description}` : ''}`
        ).join('\n')}`
      : '';

    const prompt = `
Eres un experto en redacción de CVs profesionales. Tu tarea es adaptar el perfil del candidato a la oferta de trabajo proporcionada, optimizando el contenido con las palabras clave del puesto.

## Perfil del candidato
Nombre: ${profile.fullName}
Título: ${profile.title ?? 'No especificado'}
Resumen: ${profile.summary ?? 'No especificado'}
Ubicación: ${profile.location ?? 'No especificada'}

${primaryCvJson ? `## CV Principal del Candidato (Información Base Sugerida)
La siguiente información es el CV que el candidato marcó como "Principal". Puedes usar su redacción o detalles como referencia principal para mejorar la adaptación a la nueva oferta de trabajo.
${JSON.stringify(primaryCvJson, null, 2)}` : ''}

### Experiencia laboral
${profile.experiences.map((e) => `- ${e.position} en ${e.company} (${e.startDate.toISOString().slice(0, 7)} - ${e.endDate ? e.endDate.toISOString().slice(0, 7) : 'Presente'})\n  ${e.description}\n  Tecnologías: ${e.technologies.join(', ')}`).join('\n')}

### Educación
${profile.educations.map((e) => `- ${e.degree} en ${e.institution} (${e.startDate.toISOString().slice(0, 7)} - ${e.endDate ? e.endDate.toISOString().slice(0, 7) : 'Presente'})`).join('\n')}

### Habilidades
${profile.skills.map((s) => `- ${s.name}${s.category ? ` (${s.category})` : ''}${s.level ? ` - Nivel ${s.level}/5` : ''}`).join('\n')}

${certificatesSection}

## Oferta de trabajo
Empresa: ${targetCompany}
Puesto: ${targetRole}
Descripción: ${jobDescription}

Estructura requerida:
{
  "titles": {
    "summary": "Resumen Profesional",
    "experiences": "Experiencia Laboral",
    "educations": "Educación",
    "skills": "Habilidades",
    "certificates": "Certificados",
    "keywords": "Palabras Clave (ATS)"
  },
  "summary": "Resumen profesional adaptado al puesto (2-3 oraciones)",
  "experiences": [{ "company": "", "position": "", "startDate": "", "endDate": "", "description": "descripción optimizada con keywords del puesto", "technologies": [] }],
  "educations": [{ "institution": "", "degree": "", "startDate": "", "endDate": "" }],
  "skills": [{ "name": "", "category": "", "level": null }],
  "certificates": [{ "name": "", "issuer": "", "issueDate": "" }],
  "keywords": ["lista de palabras clave del puesto incluidas en el CV"]
}

Para la sección "certificates": incluye ÚNICAMENTE los certificados que sean relevantes para el puesto descrito. Si ninguno es relevante, devuelve un array vacío.
Los valores de "titles" deben estar en el idioma en el que estás generando o modificando el CV. Por defecto, usa español, pero si el usuario te pide traducirlo, asegúrate de traducir también TODOS los títulos dentro del objeto "titles".

Responde ÚNICAMENTE con el JSON, sin texto adicional ni bloques de código.
    `.trim();

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned) as Record<string, unknown>;
  }

  async modifyCv(
    currentCvJson: Record<string, any>,
    userPrompt: string,
  ): Promise<Record<string, unknown>> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `
Eres un experto en redacción de CVs. El usuario tiene un CV generado en formato JSON y te ha pedido que lo modifiques con la siguiente instrucción.

Instrucción del usuario: "${userPrompt}"

CV Actual (JSON):
${JSON.stringify(currentCvJson, null, 2)}

Aplica la instrucción del usuario al CV actual. Debes devolver el CV completo, manteniendo la misma estructura JSON, pero con los cambios solicitados aplicados.

Estructura requerida:
{
  "titles": {
    "summary": "Resumen",
    "experiences": "Experiencia",
    "educations": "Educación",
    "skills": "Habilidades",
    "certificates": "Certificados",
    "keywords": "Palabras Clave"
  },
  "summary": "...",
  "experiences": [{ "company": "...", "position": "...", "startDate": "...", "endDate": "...", "description": "...", "technologies": [] }],
  "educations": [{ "institution": "...", "degree": "...", "startDate": "...", "endDate": "..." }],
  "skills": [{ "name": "...", "category": "...", "level": null }],
  "certificates": [{ "name": "...", "issuer": "...", "issueDate": "..." }],
  "keywords": ["..."]
}

MUY IMPORTANTE: Si el usuario te pide cambiar el idioma, asegúrate de traducir TAMBIÉN los valores dentro del objeto "titles". No cambies las llaves (keys), solo los valores.

Responde ÚNICAMENTE con el nuevo JSON válido, sin bloques de código ni texto extra.
    `.trim();

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    return JSON.parse(cleaned) as Record<string, unknown>;
  }

  async parseHtmlCv(htmlContent: string): Promise<Record<string, unknown>> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `
Eres un experto en extracción y normalización de datos. El usuario te ha proporcionado un CV en formato HTML.
Tu tarea es extraer toda la información relevante de este HTML y estructurarla en el siguiente formato JSON.

Estructura requerida:
{
  "titles": {
    "summary": "Resumen Profesional",
    "experiences": "Experiencia Laboral",
    "educations": "Educación",
    "skills": "Habilidades",
    "certificates": "Certificados",
    "keywords": "Palabras Clave (ATS)"
  },
  "summary": "Resumen extraído del HTML",
  "experiences": [{ "company": "...", "position": "...", "startDate": "...", "endDate": "...", "description": "...", "technologies": [] }],
  "educations": [{ "institution": "...", "degree": "...", "startDate": "...", "endDate": "..." }],
  "skills": [{ "name": "...", "category": "...", "level": null }],
  "certificates": [{ "name": "...", "issuer": "...", "issueDate": "..." }],
  "keywords": ["..."]
}

HTML del CV:
${htmlContent}

Responde ÚNICAMENTE con el JSON válido, sin bloques de código ni texto extra. Si falta alguna sección, deja el array o campo vacío.
    `.trim();

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    return JSON.parse(cleaned) as Record<string, unknown>;
  }
}
