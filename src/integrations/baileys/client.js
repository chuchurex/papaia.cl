/**
 * WhatsApp Client via Baileys
 * "Guerrilla Mode" - Connects as a Web Client
 */

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import { logger } from '../../utils/logger.js';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { orquestador } from '../../agents/orquestador/index.js';
import { crearCaptacion } from '../../models/captacion.js';
import { mensajeBienvenida } from '../../agents/orquestador/prompts.js';

// Store session in a local folder
const AUTH_FOLDER = 'baileys_auth_info';
let sock;
let qrCodeData = null; // Store QR code to serve via API
let captaciones = new Map(); // Store local (TODO: mover a compartido)

export async function initBaileys() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket.default({
    version,
    auth: state,
    printQRInTerminal: true, // Also print to logs
    logger: logger.child({ module: 'baileys' }),
    browser: ['PAPAIA', 'Chrome', '1.0.0'],
    generateHighQualityLinkPreview: true,
  });

  // Handle connection updates
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      logger.info('QR Code received');
      // Convert to Data URL for frontend
      qrCodeData = await QRCode.toDataURL(qr);
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      logger.warn('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
      if (shouldReconnect) {
        initBaileys();
      } else {
        logger.error('Connection closed. You are logged out.');
        qrCodeData = null; // Reset QR
      }
    } else if (connection === 'open') {
      logger.info('opened connection');
      qrCodeData = null; // Clear QR when connected
    }
  });

  // Handle credentials update
  sock.ev.on('creds.update', saveCreds);

  // Handle incoming messages
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message) continue;
      if (msg.key.fromMe) continue; // Ignore own messages

      try {
        await procesarMensajeBaileys(msg);
      } catch (error) {
        logger.error('Error processing Baileys message', error);
      }
    }
  });
}

/**
 * Process incoming Baileys message
 */
async function procesarMensajeBaileys(msg) {
  const telefono = msg.key.remoteJid.replace('@s.whatsapp.net', '');
  const nombre = msg.pushName || 'Usuario';
  const tipo = Object.keys(msg.message)[0];

  logger.info('Baileys message received', { telefono, tipo });

  // 1. Get or create captacion
  // NOTE: This uses the same in-memory store logic as webhook.js.
  // Ideally we should have a shared store service.
  let captacion = captaciones.get(telefono);

  if (!captacion) {
    logger.info('Nueva captación detectada');
    captacion = crearCaptacion(telefono, nombre);
    captaciones.set(telefono, captacion);

    // Send welcome
    await enviarMensaje(telefono, mensajeBienvenida());
    return;
  }

  // 2. Convert to internal format for Orchestrator
  const mensajeInterno = convertirMensaje(msg, tipo);

  // 3. Process with Orchestrator
  const resultado = await orquestador.procesarMensaje(mensajeInterno, captacion);

  // 4. Update state
  captaciones.set(telefono, resultado.captacion);

  // 5. Send response
  if (resultado.respuesta) {
    await enviarMensaje(telefono, resultado.respuesta);
  }
}

function convertirMensaje(msg, tipo) {
  const content = msg.message;

  const base = {
    id: msg.key.id,
    timestamp: msg.messageTimestamp,
    from: msg.key.remoteJid,
  };

  if (tipo === 'conversation' || tipo === 'extendedTextMessage') {
    return {
      ...base,
      type: 'text',
      text: { body: content.conversation || content.extendedTextMessage?.text }
    };
  }

  if (tipo === 'imageMessage') {
    return {
      ...base,
      type: 'image',
      image: {
        id: msg.key.id, // We use message ID as temporary media ID
        baileysMsg: msg // Pass full msg to download later
      }
    };
  }

  if (tipo === 'audioMessage') {
    return {
      ...base,
      type: 'audio',
      audio: {
        id: msg.key.id,
        baileysMsg: msg
      }
    };
  }

  if (tipo === 'locationMessage') {
    return {
      ...base,
      type: 'location',
      location: {
        latitude: content.locationMessage.degreesLatitude,
        longitude: content.locationMessage.degreesLongitude
      }
    };
  }

  return { ...base, type: 'unknown' };
}

/**
 * Send text message
 */
export async function enviarMensaje(telefono, texto) {
  if (!sock) throw new Error('Baileys not initialized');

  const id = telefono.includes('@') ? telefono : `${telefono}@s.whatsapp.net`;

  await sock.sendMessage(id, { text: texto });
}

/**
 * Get current QR Code
 */
export function getQRCode() {
  return qrCodeData;
}

/**
 * Get captaciones (for API)
 */
export function getCaptaciones() {
  return Array.from(captaciones.values());
}
