# Clínica Dental Gloria

Sitio web estático de Clínica Dental Gloria (Barcelona) con agente IA
conversacional integrado como chat flotante.

**Demo en vivo:** https://rodrigoratouu-code.github.io/clinica-dental-agente/

---

## Estructura

```
.
├── index.html              # Sitio principal (HTML/CSS puro)
├── agente-dental/          # Chat flotante con IA (Anthropic Claude)
│   ├── agente.css          # Estilos del widget
│   ├── agente.js           # Lógica + llamada a la API
│   ├── config.js           # Datos de la clínica (editable)
│   └── demo.html           # Página de demostración aislada
├── *.webp                  # Imágenes del sitio
└── .env.local.example      # Ejemplo de variables de entorno
```

---

## El agente IA

Chat flotante en la esquina inferior derecha que puede:

- **Reservar citas** — recoge nombre, teléfono, tratamiento y franja horaria,
  luego muestra resumen y ofrece enviarlo por WhatsApp o email.
- **Responder FAQ** — horarios, servicios, precios orientativos, seguros,
  cómo llegar, urgencias 24/7, equipo médico.
- **Presupuestos orientativos** — rangos de precio con disclaimer de que
  la valoración exacta requiere visita gratuita.

Incluye modo claro/oscuro, detección de horario (estado "en línea"/"fuera
de horario"), quick actions y botón de WhatsApp como fallback.

---

## Configurar

1. **API key de Anthropic**

   Edita `agente-dental/config.js` y pega tu key en el campo `API_KEY`:

   ```js
   API_KEY: "sk-ant-...",
   ```

   > ⚠️ **Producción:** no dejes la API key en el frontend. Usa un backend
   > proxy (Vercel Function, Cloudflare Worker, etc.) con la key en variables
   > de entorno. El header `anthropic-dangerous-direct-browser-access: true`
   > es solo para desarrollo local o demos controladas.

2. **Datos de la clínica**

   En `agente-dental/config.js` están todos los datos: dirección, teléfono,
   horarios, servicios, precios orientativos, equipo médico. Edítalos con
   tu información real.

---

## Ejecutar localmente

```bash
python3 -m http.server 8765
```

Luego abre `http://localhost:8765/` en el navegador.

---

## Integrar en otra web

Solo 3 líneas antes de `</body>`:

```html
<link rel="stylesheet" href="agente-dental/agente.css">
<script src="agente-dental/config.js"></script>
<script src="agente-dental/agente.js"></script>
```

---

## Stack

- HTML5 + CSS3 + JavaScript vanilla (sin frameworks)
- API Anthropic Claude (`claude-sonnet-4-20250514`)
- GitHub Pages para hosting estático

---

## Licencia

Uso interno - Clínica Dental Gloria.
