/**
 * Cliente de Google Maps Platform
 * Para geolocalización y USPs de ubicación
 */

import { Client } from '@googlemaps/google-maps-services-js';
import { logger } from '../../utils/logger.js';

const MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

let client = null;

function getClient() {
  if (!client) {
    client = new Client({});
  }
  return client;
}

/**
 * Busca lugares cercanos a una ubicación
 * @param {Object} options - Opciones de búsqueda
 * @param {Object} options.location - {lat, lng}
 * @param {number} options.radius - Radio en metros
 * @param {string} options.type - Tipo de lugar (opcional)
 * @returns {Promise<Object[]>} Lugares encontrados
 */
export async function nearbySearch({ location, radius = 500, type }) {
  const mapsClient = getClient();

  logger.debug('Buscando lugares cercanos', { location, radius, type });

  try {
    const response = await mapsClient.placesNearby({
      params: {
        location: `${location.lat},${location.lng}`,
        radius,
        type,
        key: MAPS_API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      logger.warn('Maps API respuesta no OK', { status: response.data.status });
      return [];
    }

    return response.data.results || [];

  } catch (error) {
    logger.error('Error en nearbySearch', { error: error.message });
    return [];
  }
}

/**
 * Geocodifica una dirección a coordenadas
 * @param {string} address - Dirección a geocodificar
 * @returns {Promise<Object|null>} Coordenadas {lat, lng} o null
 */
export async function geocode(address) {
  const mapsClient = getClient();

  logger.debug('Geocodificando dirección', { address });

  try {
    const response = await mapsClient.geocode({
      params: {
        address,
        region: 'cl', // Priorizar Chile
        key: MAPS_API_KEY
      }
    });

    if (response.data.status !== 'OK' || !response.data.results.length) {
      return null;
    }

    const result = response.data.results[0];
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
      components: parseAddressComponents(result.address_components)
    };

  } catch (error) {
    logger.error('Error geocodificando', { error: error.message });
    return null;
  }
}

/**
 * Geocodificación inversa (coordenadas a dirección)
 * @param {Object} location - {lat, lng}
 * @returns {Promise<Object|null>} Información de dirección
 */
export async function reverseGeocode(location) {
  const mapsClient = getClient();

  logger.debug('Geocodificación inversa', { location });

  try {
    const response = await mapsClient.reverseGeocode({
      params: {
        latlng: `${location.lat},${location.lng}`,
        key: MAPS_API_KEY
      }
    });

    if (response.data.status !== 'OK' || !response.data.results.length) {
      return null;
    }

    const result = response.data.results[0];
    return {
      formattedAddress: result.formatted_address,
      components: parseAddressComponents(result.address_components)
    };

  } catch (error) {
    logger.error('Error en geocodificación inversa', { error: error.message });
    return null;
  }
}

/**
 * Obtiene detalles de un lugar
 * @param {string} placeId - ID del lugar
 * @returns {Promise<Object|null>} Detalles del lugar
 */
export async function placeDetails(placeId) {
  const mapsClient = getClient();

  try {
    const response = await mapsClient.placeDetails({
      params: {
        place_id: placeId,
        fields: ['name', 'formatted_address', 'geometry', 'type', 'rating'],
        key: MAPS_API_KEY
      }
    });

    return response.data.result || null;

  } catch (error) {
    logger.error('Error obteniendo detalles', { error: error.message });
    return null;
  }
}

// Helpers

function parseAddressComponents(components) {
  const parsed = {};

  const mapping = {
    street_number: 'numero',
    route: 'calle',
    locality: 'comuna',
    administrative_area_level_1: 'region',
    country: 'pais',
    postal_code: 'codigoPostal'
  };

  for (const component of components) {
    for (const type of component.types) {
      if (mapping[type]) {
        parsed[mapping[type]] = component.long_name;
      }
    }
  }

  return parsed;
}

export const maps = {
  nearbySearch,
  geocode,
  reverseGeocode,
  placeDetails
};
