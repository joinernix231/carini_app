/**
 * Utilidades para manejo de mapas y ubicaciones
 */

/**
 * Genera un enlace a OpenStreetMap con un marcador en la ubicación especificada
 * @param latitude Latitud
 * @param longitude Longitud
 * @param zoom Nivel de zoom (por defecto 15)
 * @returns URL completa de OpenStreetMap
 */
export function getOpenStreetMapUrl(
    latitude: string | number | null | undefined,
    longitude: string | number | null | undefined,
    zoom: number = 15
): string | null {
    if (!latitude || !longitude) return null;

    const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
    const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;

    if (isNaN(lat) || isNaN(lng)) return null;

    // Formato: https://www.openstreetmap.org/?mlat=LAT&mlon=LNG&zoom=ZOOM
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=${zoom}`;
}

/**
 * Abre el enlace de OpenStreetMap en el navegador del dispositivo
 * @param latitude Latitud
 * @param longitude Longitud
 * @param zoom Nivel de zoom (por defecto 15)
 */
export async function openOpenStreetMap(
    latitude: string | number | null | undefined,
    longitude: string | number | null | undefined,
    zoom: number = 15
): Promise<void> {
    const url = getOpenStreetMapUrl(latitude, longitude, zoom);
    if (!url) {
        console.warn('No se pudo generar URL de OpenStreetMap: coordenadas inválidas');
        return;
    }

    try {
        const { Linking } = await import('react-native');
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
            await Linking.openURL(url);
        } else {
            console.warn('No se pudo abrir la URL:', url);
        }
    } catch (error) {
        console.error('Error abriendo OpenStreetMap:', error);
    }
}

/**
 * Formatea las coordenadas para mostrar
 * @param latitude Latitud
 * @param longitude Longitud
 * @param decimals Número de decimales (por defecto 4)
 * @returns String formateado "lat, lng"
 */
export function formatCoordinates(
    latitude: string | number | null | undefined,
    longitude: string | number | null | undefined,
    decimals: number = 4
): string {
    if (!latitude || !longitude) return 'N/A';

    const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
    const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;

    if (isNaN(lat) || isNaN(lng)) return 'N/A';

    return `${lat.toFixed(decimals)}°, ${lng.toFixed(decimals)}°`;
}

