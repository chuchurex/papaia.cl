# Arquitectura de PAPAIA

Este documento describe la arquitectura tecnica del sistema PAPAIA.

## Vision General

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIO                                  │
│                    (Corredor Inmobiliario)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        WHATSAPP                                  │
│              (Baileys / Cloud API / Callbell)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVIDOR EXPRESS                             │
│                       (src/index.js)                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    API ENDPOINTS                            │ │
│  │  /health  /api/qr  /api/captaciones  /webhook/callbell     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE AGENTES                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────┐ │
│  │ ORQUESTADOR  │ │ TRANSCRIPTOR │ │  FOTOGRAFO   │ │PUBLICAR│ │
│  │  Coordina    │ │ Audio→Datos  │ │ Fotos→Proc.  │ │→ CRMs  │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SERVICIOS EXTERNOS                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │   GEMINI    │ │   VISION    │ │    MAPS     │ │ FIRESTORE │ │
│  │    (LLM)    │ │ (Imagenes)  │ │   (Geo)     │ │   (DB)    │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      OUTPUTS                                     │
│          CRMs (Prop360) │ Portales │ Dashboard Web              │
└─────────────────────────────────────────────────────────────────┘
```

## Componentes Principales

### 1. Servidor Express (`src/index.js`)

Entry point de la aplicacion. Responsabilidades:
- Servir el dashboard estatico (`/public`)
- Exponer API REST
- Manejar webhooks de WhatsApp
- Inicializar cliente de WhatsApp (Baileys)

### 2. Sistema de Agentes (`src/agents/`)

Arquitectura de 4 agentes cognitivos especializados:

#### 2.1 Orquestador (`agents/orquestador/`)
- **Funcion**: Coordina el flujo de captacion
- **Entrada**: Mensajes de WhatsApp
- **Salida**: Instrucciones a otros agentes
- **Estado**: Maneja la maquina de estados de captacion

#### 2.2 Transcriptor (`agents/transcriptor/`)
- **Funcion**: Procesa audio y texto
- **Entrada**: Notas de voz, mensajes de texto
- **Salida**: Datos estructurados de propiedad
- **Tecnologia**: Gemini 1.5 Pro (nativo para audio)

#### 2.3 Fotografo (`agents/fotografo/`)
- **Funcion**: Procesa imagenes de propiedades
- **Entrada**: Fotos enviadas por WhatsApp
- **Salida**: Fotos categorizadas y mejoradas
- **Tecnologia**: Google Vision API

#### 2.4 Publicador (`agents/publicador/`)
- **Funcion**: Genera publicaciones para CRMs
- **Entrada**: Datos estructurados + fotos procesadas
- **Salida**: Publicaciones formateadas
- **Destinos**: Prop360, portales inmobiliarios

### 3. Integraciones (`src/integrations/`)

#### 3.1 WhatsApp
- **Baileys** (`integrations/baileys/`): Cliente principal
- **Callbell** (`integrations/callbell/`): Alternativa empresarial
- **Cloud API** (`integrations/whatsapp/`): Meta oficial

#### 3.2 Google Cloud (`integrations/google/`)
- **Gemini**: LLM para procesamiento de lenguaje
- **Vision**: Analisis de imagenes
- **Maps**: Geolocalizacion y validacion de direcciones

#### 3.3 CRMs (`integrations/crm/`)
- Adaptador base extensible
- Implementacion para Prop360

### 4. Modelos de Datos (`src/models/`)

#### Captacion
```javascript
{
  id: string,
  telefono: string,
  estado: EstadoCaptacion,
  datosExtraidos: {
    tipo_propiedad: string,
    operacion: string,
    precio: { valor: number, moneda: string },
    superficie: { construida: number, terreno: number },
    direccion: { calle, numero, comuna, region },
    caracteristicas: { dormitorios, banos, estacionamientos },
    usps: string[]
  },
  audios: AudioFile[],
  fotos: FotoFile[],
  camposFaltantes: string[],
  createdAt: Date,
  updatedAt: Date
}
```

#### Estados de Captacion
```
INICIO → RECIBIENDO_DATOS → PROCESANDO_AUDIO → PROCESANDO_FOTOS
       → VALIDANDO → LISTO_PARA_PUBLICAR → ESPERANDO_APROBACION
       → PUBLICANDO → COMPLETADO
```

### 5. Frontend (`public/`)

Dashboard SPA vanilla (sin framework):
- `index.html`: Estructura HTML
- `app.js`: Logica de navegacion y API calls
- `styles.css`: Estilos con CSS moderno

## Flujo de Datos

### Captacion de Propiedad

```
1. Usuario envia mensaje/audio/foto por WhatsApp
                    │
                    ▼
2. Baileys recibe y parsea el mensaje
                    │
                    ▼
3. Orquestador analiza el contexto y decide accion
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
4. Transcriptor  Fotografo   (espera)
   procesa       procesa
   audio/texto   fotos
        │           │
        └─────┬─────┘
              ▼
5. Orquestador valida completitud
              │
              ▼
6. Si faltan datos → solicita al usuario
   Si completo → Publicador genera contenido
              │
              ▼
7. Publicador envia a CRMs
              │
              ▼
8. Notifica al usuario via WhatsApp
```

## Seguridad

### Credenciales
- Todas las credenciales en `.env` (nunca en codigo)
- `.gitignore` configurado para excluir secretos
- Sesiones de WhatsApp en directorios ignorados

### Validacion
- Inputs validados antes de procesar
- Sanitizacion de datos de usuario
- Rate limiting en endpoints

## Escalabilidad

### Actual (MVP)
- Servidor unico
- Almacenamiento en memoria
- Una instancia de WhatsApp

### Futuro
- Cloud Functions para agentes
- Firestore para persistencia
- Multiples instancias de WhatsApp
- Cola de mensajes (Pub/Sub)

## Dependencias Clave

| Paquete | Version | Uso |
|---------|---------|-----|
| express | ^4.18.2 | Servidor HTTP |
| @whiskeysockets/baileys | ^7.0.0-rc.9 | Cliente WhatsApp |
| @google-cloud/aiplatform | ^3.10.0 | Gemini API |
| @google-cloud/vision | ^4.2.0 | Analisis de imagenes |
| @googlemaps/google-maps-services-js | ^3.3.42 | Geolocalizacion |
| pino | ^10.2.1 | Logging estructurado |

## Configuracion

### Variables de Entorno Requeridas

```bash
# Google Cloud (requerido)
GOOGLE_CLOUD_PROJECT=
GOOGLE_APPLICATION_CREDENTIALS=

# WhatsApp - elegir uno
CALLBELL_API_KEY=        # Opcion 1: Callbell
WHATSAPP_TOKEN=          # Opcion 2: Cloud API

# Servicios Google
GOOGLE_MAPS_API_KEY=

# Aplicacion
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
```

## Testing

```bash
npm test                    # Todos los tests
npm run test:agents         # Tests de agentes
npm run test:integration    # Tests de integracion
```

## Deployment

### Desarrollo
```bash
npm run dev
```

### Produccion
```bash
npm start
```

El servidor escucha en el puerto definido en `PORT` (default: 3000).
