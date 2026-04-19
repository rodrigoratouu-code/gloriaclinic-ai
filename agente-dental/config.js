/* ============================================================
   CONFIGURACIÓN DEL AGENTE DENTAL
   Edita este archivo con los datos reales de tu clínica.
   ============================================================ */

window.AGENTE_CONFIG = {

  /* ---------- API (Anthropic Claude) ---------- */
  // ⚠️ AVISO DE SEGURIDAD:
  // Colocar la API key aquí expone tu clave a cualquier visitante.
  // Para producción, crea un pequeño backend (Vercel/Netlify Function,
  // Cloudflare Worker, etc.) que proxee las llamadas y guarde la key
  // en variables de entorno. Para pruebas locales, pega la key aquí:
  API_KEY: "TU_ANTHROPIC_API_KEY_AQUI",
  MODEL: "claude-sonnet-4-20250514",
  MAX_TOKENS: 1024,

  /* ---------- Datos de la clínica ---------- */
  NOMBRE_CLINICA: "Clínica Dental Gloria",
  DIRECCION: "Calle Padilla, 366, 08025 Barcelona",
  TELEFONO: "+34 644 864 324",
  WHATSAPP_NUMBER: "34644864324", // sin + ni espacios, formato internacional
  EMAIL_CONTACTO: "info@gloriaclinicadental.com",

  HORARIOS: "Lunes a viernes 9:00-20:00, sábados 10:00-14:00. Urgencias 24/7.",

  // Horario en que el agente responde "en tiempo real".
  // Fuera de este horario muestra un mensaje diferente.
  HORARIO_ATENCION: {
    lunes:     { abre: "09:00", cierra: "20:00" },
    martes:    { abre: "09:00", cierra: "20:00" },
    miercoles: { abre: "09:00", cierra: "20:00" },
    jueves:    { abre: "09:00", cierra: "20:00" },
    viernes:   { abre: "09:00", cierra: "20:00" },
    sabado:    { abre: "10:00", cierra: "14:00" },
    domingo:   null // cerrado (salvo urgencias 24/7)
  },

  EQUIPO: [
    { nombre: "Dra. Gloria González", rol: "Directora Médica - Implantología (20+ años, Máster en Implantología, Miembro SEPA)" },
    { nombre: "Dr. Sebastian Rosa",   rol: "Ortodoncista - Invisalign Platinum" },
    { nombre: "Dra. Laura Fernández", rol: "Odontopediatra - Máster UB" }
  ],

  SERVICIOS: [
    "Odontología general (revisiones, limpiezas, empastes, endodoncias)",
    "Implantes dentales (cirugía guiada, garantía 10 años)",
    "Ortodoncia (Invisalign, brackets metálicos/estéticos, lingual)",
    "Estética dental (blanqueamiento, carillas, diseño digital de sonrisa)",
    "Periodoncia (gingivitis, curetajes, cirugía periodontal)",
    "Urgencias dentales 24/7",
    "Odontopediatría"
  ],

  TECNOLOGIA: [
    "Escáner intraoral 3D (sin impresiones incómodas)",
    "Radiografía digital (90% menos radiación)",
    "Sedación consciente",
    "Cirugía guiada por ordenador"
  ],

  PRECIOS_ORIENTATIVOS: {
    "primera_visita":   "GRATIS (incluye revisión, diagnóstico y plan de tratamiento)",
    "limpieza":         "50 - 80 €",
    "blanqueamiento":   "300 - 500 €",
    "implante":         "900 - 1.500 € (garantía 10 años)",
    "ortodoncia_invisalign": "2.500 - 4.500 €",
    "ortodoncia_brackets":   "2.000 - 3.500 €",
    "empaste":          "60 - 120 €",
    "endodoncia":       "150 - 300 €",
    "extraccion":       "60 - 150 €",
    "carilla":          "400 - 700 €"
  },

  FACILIDADES_PAGO: "Financiación hasta 36 meses sin intereses. Aceptamos todas las formas de pago.",

  SEGUROS_ACEPTADOS: [
    "Adeslas", "Sanitas", "DKV", "Mapfre", "Asisa"
  ],

  COMO_LLEGAR:
    "Calle Padilla, 366, 08025 Barcelona. " +
    "Zona bien comunicada con transporte público. " +
    "Si vienes en coche hay parking público cercano.",

  URGENCIAS_24_7: "Sí, atendemos urgencias 24/7 en el +34 644 864 324.",

  /* ---------- UI / Tema (paleta Gloria Clinic) ---------- */
  TEMA: {
    // Modo claro - paleta corporativa
    light: {
      primary:       "#0A4D68",   // color-primary (azul profundo)
      primaryHover:  "#088395",   // color-primary-light
      accent:        "#05BFDB",   // color-accent
      bg:            "#FFFFFF",
      bgSoft:        "#F0F4F8",   // color-neutral-200
      text:          "#102A43",   // color-neutral-900
      textSoft:      "#334E68",   // color-neutral-700
      border:        "#D9E2EC",   // color-neutral-300
      userBubble:    "#0A4D68",
      userText:      "#FFFFFF",
      botBubble:     "#F0F4F8",
      botText:       "#102A43"
    },
    // Modo oscuro
    dark: {
      primary:       "#05BFDB",   // accent como primary (más luminoso)
      primaryHover:  "#38D3E8",
      accent:        "#088395",
      bg:            "#0D1B26",
      bgSoft:        "#142834",
      text:          "#E8F0F5",
      textSoft:      "#8FA8B8",
      border:        "#1F3342",
      userBubble:    "#05BFDB",
      userText:      "#0D1B26",
      botBubble:     "#1A2F3E",
      botText:       "#E8F0F5"
    }
  },

  /* ---------- Mensajes ---------- */
  MENSAJE_BIENVENIDA:
    "¡Hola! 👋 Soy el asistente virtual de la Clínica Dental Gloria. " +
    "Puedo ayudarte a reservar cita, resolver dudas sobre tratamientos, " +
    "precios orientativos u horarios. ¿En qué puedo ayudarte?",

  MENSAJE_FUERA_HORARIO:
    "Ahora mismo estamos fuera del horario de atención, pero puedo ayudarte igualmente. " +
    "Si tu consulta es urgente, llámanos o escríbenos por WhatsApp y te atenderemos en cuanto abramos.",

  PLACEHOLDER_INPUT: "Escribe tu mensaje...",

  /* ---------- Comportamiento ---------- */
  GUARDAR_CITAS_LOCALSTORAGE: true, // guarda las citas en localStorage como JSON
  CLAVE_LOCALSTORAGE: "citas_dentales"
};
