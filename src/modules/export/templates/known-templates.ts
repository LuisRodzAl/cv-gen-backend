export const KNOWN_TEMPLATES: Record<string, string> = {
  harvard: `
    CV clásico estilo Harvard. Una sola columna. Fuente serif (Georgia o Times New Roman).
    Nombre centrado en grande arriba. Secciones separadas por línea horizontal.
    Orden: Nombre/Contacto, Resumen, Experiencia, Educación, Habilidades.
    Colores: solo negro y blanco. Muy formal y limpio.
    Márgenes amplios (2.5cm). Tamaño de fuente 11-12pt.
  `,
  ats: `
    CV optimizado para sistemas ATS (Applicant Tracking Systems).
    Una sola columna, sin tablas, sin columnas múltiples, sin imágenes.
    Fuente sans-serif simple (Arial o Calibri). Texto plano y directo.
    Secciones con encabezados en mayúsculas y negrita.
    Keywords del puesto visibles y repetidas naturalmente.
    Sin colores de fondo, sin bordes decorativos.
  `,
  modern: `
    CV moderno con dos columnas. Columna izquierda (30%) con color de fondo oscuro
    para datos de contacto, habilidades y educación. Columna derecha (70%) blanca
    para experiencia y resumen. Fuente sans-serif moderna (Roboto o Open Sans).
    Color de acento: azul oscuro (#1a3a5c). Iconos simples para contacto.
    Nombre grande en la parte superior con título del puesto debajo.
  `,
  minimal: `
    CV minimalista. Una columna. Mucho espacio en blanco.
    Tipografía ligera, tamaños de fuente variados para jerarquía visual.
    Sin líneas divisorias, solo espaciado para separar secciones.
    Nombre en grande, resto en gris oscuro (#333). Muy elegante y moderno.
  `,
};
