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

## Instrucciones
Genera un CV optimizado en formato JSON con la siguiente estructura:
{
  "summary": "Resumen profesional adaptado al puesto (2-3 oraciones)",
  "experiences": [{ "company": "", "position": "", "startDate": "", "endDate": "", "description": "descripción optimizada con keywords del puesto", "technologies": [] }],
  "educations": [{ "institution": "", "degree": "", "startDate": "", "endDate": "" }],
  "skills": [{ "name": "", "category": "", "level": null }],
  "certificates": [{ "name": "", "issuer": "", "issueDate": "" }],
  "keywords": ["lista de palabras clave del puesto incluidas en el CV"]
}

Para la sección "certificates": incluye ÚNICAMENTE los certificados que sean relevantes para el puesto descrito. Si ninguno es relevante, devuelve un array vacío.

Responde ÚNICAMENTE con el JSON, sin texto adicional ni bloques de código.
    `.trim();

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    return JSON.parse(text) as Record<string, unknown>;
  }
}
