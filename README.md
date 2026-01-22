# PAPAIA

> **"El CRM Invisible"** - Agente conversacional para captacion inmobiliaria via WhatsApp

## Que es PAPAIA?

PAPAIA es una arquitectura cognitiva que transforma inputs desordenados (audios, fotos, ubicacion) en activos inmobiliarios de alto valor, operando completamente dentro de WhatsApp.

- **Interfaz Unica**: WhatsApp. Si el usuario sabe enviar un audio, sabe usar el sistema.
- **Backend Inteligente**: Orquestador que convierte inputs en datos estructurados usando IA.
- **Integracion**: Inyecta datos en CRMs existentes (Prop360, portales inmobiliarios).

## Arquitectura de Agentes

PAPAIA utiliza 4 agentes cognitivos especializados:

| Agente | Funcion |
|--------|---------|
| **Orquestador** | Guia el proceso de captacion via texto |
| **Transcriptor** | Speech-to-text + extraccion de datos inmobiliarios |
| **Fotografo** | Seleccion, categorizacion y mejora automatica de fotos |
| **Publicador** | Genera publicaciones profesionales y distribuye a CRMs |

## Stack Tecnologico

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **IA/LLM**: Google Gemini 1.5 Pro (Vertex AI)
- **Vision**: Google Cloud Vision API
- **Geolocalizacion**: Google Maps Platform
- **WhatsApp**: Baileys / Cloud API (Meta)
- **Base de datos**: Firestore
- **Almacenamiento**: Google Cloud Storage

## Quick Start

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd papaia

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Ejecutar en desarrollo
npm run dev

# 5. Produccion
npm start
```

## Variables de Entorno

Ver `.env.example` para la lista completa. Las principales son:

| Variable | Descripcion |
|----------|-------------|
| `GOOGLE_CLOUD_PROJECT` | ID del proyecto en GCP |
| `GOOGLE_APPLICATION_CREDENTIALS` | Ruta al archivo de credenciales |
| `CALLBELL_API_KEY` | API Key de Callbell para WhatsApp |
| `GOOGLE_MAPS_API_KEY` | API Key de Google Maps |
| `PORT` | Puerto del servidor (default: 3000) |

## Estructura del Proyecto

```
papaia/
├── src/
│   ├── index.js              # Entry point - Servidor Express
│   ├── agents/               # Los 4 agentes cognitivos
│   │   ├── orquestador/      # Coordinacion del flujo
│   │   ├── transcriptor/     # Procesamiento de audio/texto
│   │   ├── fotografo/        # Procesamiento de imagenes
│   │   └── publicador/       # Generacion de publicaciones
│   ├── integrations/         # Integraciones externas
│   │   ├── baileys/          # Cliente WhatsApp (Baileys)
│   │   ├── callbell/         # WhatsApp via Callbell
│   │   ├── google/           # Gemini, Vision, Maps
│   │   └── crm/              # Adaptadores de CRMs
│   ├── models/               # Esquemas de datos
│   └── utils/                # Utilidades (logger, validators)
├── public/                   # Frontend - Dashboard
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── .env.example              # Template de variables
└── package.json
```

## API Endpoints

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/qr` | QR para autenticacion WhatsApp |
| `GET` | `/api/captaciones` | Lista de captaciones activas |
| `GET` | `/api/stats` | Estadisticas del sistema |
| `POST` | `/webhook/callbell` | Webhook de Callbell |

## Scripts Disponibles

```bash
npm run dev      # Desarrollo con hot-reload
npm start        # Produccion
npm test         # Ejecutar tests
```

## Estado del Proyecto

**Version**: 0.1.0 (MVP)

Este es un MVP con las siguientes caracteristicas:
- Dashboard funcional
- Conexion WhatsApp via Baileys
- Estructura de agentes definida
- Modelos de datos listos

**Proximos pasos**:
- Integracion completa con Gemini
- Persistencia en Firestore
- Publicacion real en CRMs

## Documentacion Adicional

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura detallada del sistema

## Licencia

MIT
