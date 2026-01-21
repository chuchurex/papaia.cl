# PAPAIA 🍈

> **"El CRM Invisible"** - Agente conversacional para captación inmobiliaria vía WhatsApp

## ¿Qué es PAPAIA?

PAPAIA es una arquitectura cognitiva que transforma inputs desordenados (audios, fotos, ubicación) en activos inmobiliarios de alto valor, operando completamente dentro de WhatsApp.

- **Interfaz Única**: WhatsApp. Si el usuario sabe enviar un audio, sabe usar el sistema.
- **Backend**: Orquestador que convierte inputs en datos estructurados.
- **Integración**: Inyecta datos en CRMs existentes (Prop360, portales inmobiliarios).

## Los 4 Agentes

| Agente | Función |
|--------|---------|
| 🎯 **Orquestador** | Guía el proceso de captación vía texto |
| 🎙️ **Transcriptor** | Speech-to-text + extracción de datos |
| 📸 **Estudio Fotográfico** | Selección y mejora automática de fotos |
| 📢 **Publicador** | Genera publicaciones y distribuye a CRMs |

## Stack Tecnológico

- **Runtime**: Node.js 20+
- **IA/LLM**: Gemini 1.5 Pro (Vertex AI)
- **Visión**: Vertex AI Vision
- **Geolocalización**: Google Maps Platform
- **Orquestación**: Cloud Workflows + Functions
- **WhatsApp**: Cloud API (Meta)
- **Base de datos**: Firestore

## Quick Start

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Desarrollo
npm run dev

# Tests
npm test
```

## Estructura del Proyecto

```
papaia/
├── src/
│   ├── agents/          # Los 4 agentes core
│   ├── integrations/    # WhatsApp, Google Cloud, CRMs
│   ├── models/          # Schemas de datos
│   └── utils/           # Utilidades
├── functions/           # Cloud Functions
├── workflows/           # Cloud Workflows
└── tests/               # Tests
```

## Equipo

- **CEO**: Estrategia, Producto y Gestión del Cambio
- **Víctor (CCO)**: Feedback del mercado inmobiliario
- **Joaquín (CTO)**: Arquitectura de agentes
- **Gemini**: Memoria del proyecto y soporte IA

---

**"Papaia"** = Super fácil en Chile 🇨🇱
