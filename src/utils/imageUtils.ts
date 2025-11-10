// src/utils/imageUtils.ts

const S3_BASE_URL = 'https://joinerdavila.s3.us-east-1.amazonaws.com/';

/**
 * Construye la URL completa de S3 a partir de un nombre de archivo o ruta
 * Si ya es una URL completa, la retorna tal cual
 */
export function getImageUrl(imagePath: string | null | undefined): string | null {
    if (!imagePath) return null;
    
    // Si ya es una URL completa (empieza con http:// o https://), retornarla tal cual
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    
    // Si empieza con /, removerlo
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    
    // Construir la URL completa de S3
    return `${S3_BASE_URL}${cleanPath}`;
}

/**
 * Construye la URL completa de S3 para múltiples imágenes
 */
export function getImageUrls(imagePaths: (string | null | undefined)[]): string[] {
    return imagePaths
        .map(getImageUrl)
        .filter((url): url is string => url !== null);
}

