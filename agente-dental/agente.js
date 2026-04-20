/* ============================================================
   AGENTE DENTAL - Chat flotante con Claude (Anthropic API)
   Vanilla JS. Se autoinicializa al cargar la página.
   ============================================================ */

(function () {
  "use strict";

  /* ---------- 0. Espera config ---------- */
  if (!window.AGENTE_CONFIG) {
    console.error("[agente] Falta config.js. Cárgalo antes de agente.js.");
    return;
  }
  const CFG = window.AGENTE_CONFIG;

  // Ruta base del script (para cargar recursos como android-button.png
  // desde cualquier página donde se incluya el agente).
  const SCRIPT_BASE = (() => {
    try {
      const s = document.currentScript ||
                document.querySelector('script[src*="agente.js"]');
      return s ? new URL(".", s.src).href : "";
    } catch (e) { return ""; }
  })();

  /* ---------- 1. Utilidades ---------- */
  const DIAS = ["domingo","lunes","martes","miercoles","jueves","viernes","sabado"];

  function estaEnHorario() {
    const now = new Date();
    const dia = DIAS[now.getDay()];
    const h = CFG.HORARIO_ATENCION?.[dia];
    if (!h) return false;
    const [ah, am] = h.abre.split(":").map(Number);
    const [ch, cm] = h.cierra.split(":").map(Number);
    const minsNow = now.getHours() * 60 + now.getMinutes();
    return minsNow >= ah * 60 + am && minsNow <= ch * 60 + cm;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }

  // Convierte **negrita** y \n a HTML simple
  function formatMsg(str) {
    return escapeHtml(str)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
  }

  function $(sel, root) { return (root || document).querySelector(sel); }

  /* ---------- 2. Estado ---------- */
  const state = {
    open: false,
    theme: localStorage.getItem("ad_theme") || "light",
    history: [],              // [{role, content}]
    patientName: localStorage.getItem("ad_patient_name") || null,
    sending: false
  };

  /* ---------- 3. System prompt ---------- */
  function buildSystemPrompt() {
    const fueraHorario = !estaEnHorario();
    const nombre = state.patientName ? ` El paciente se llama ${state.patientName}.` : "";

    return `Eres el asistente virtual de ${CFG.NOMBRE_CLINICA}, una clínica dental.${nombre}

**TU ROL**
- Eres cálido, profesional, empático y breve.
- Hablas SIEMPRE en español.
- NUNCA das diagnósticos médicos ni prescribes tratamientos concretos.
- Para cualquier valoración clínica recomiendas visita presencial.
- Si no sabes algo, ofreces el teléfono ${CFG.TELEFONO}.

**TUS CAPACIDADES**
1. Reservar citas: recoge de forma conversacional (no como formulario) estos datos:
   - Nombre completo
   - Teléfono de contacto
   - Tipo de tratamiento o motivo
   - Franja horaria preferida (día + hora aproximada)
   Cuando TENGAS LOS 4 DATOS, responde con un JSON exactamente con este formato (y solo eso dentro del bloque):

   [CITA_RESERVADA]
   {"nombre":"...","telefono":"...","tratamiento":"...","franja":"..."}
   [/CITA_RESERVADA]

   Después del bloque añade un mensaje cálido de confirmación diciendo que la clínica le contactará para confirmar.

2. Preguntas frecuentes - responde usando estos datos:
   - Dirección: ${CFG.DIRECCION}
   - Teléfono: ${CFG.TELEFONO}
   - Email: ${CFG.EMAIL_CONTACTO}
   - Horarios: ${CFG.HORARIOS}
   - Servicios: ${CFG.SERVICIOS.join("; ")}
   - Tecnología: ${(CFG.TECNOLOGIA || []).join("; ")}
   - Equipo: ${(CFG.EQUIPO || []).map(e => `${e.nombre} (${e.rol})`).join("; ")}
   - Facilidades de pago: ${CFG.FACILIDADES_PAGO || ""}
   - Seguros aceptados: ${CFG.SEGUROS_ACEPTADOS.join(", ")}
   - Urgencias: ${CFG.URGENCIAS_24_7 || ""}
   - Cómo llegar: ${CFG.COMO_LLEGAR}

3. Presupuestos orientativos (SIEMPRE añade disclaimer "es orientativo, la valoración exacta requiere visita gratuita"):
${Object.entries(CFG.PRECIOS_ORIENTATIVOS).map(([k,v]) => `   - ${k}: ${v}`).join("\n")}
   Recuerda siempre: **la primera consulta es GRATUITA** y hay financiación hasta 36 meses sin intereses.

**ESTILO**
- Mensajes cortos (máx 3-4 líneas salvo que sea necesario).
- Usa saltos de línea para claridad.
- Puedes usar **negrita** para destacar precios o datos clave.
- Una pregunta por turno al recoger cita.
${fueraHorario ? "- Estamos FUERA de horario de atención. Menciona que la clínica responderá en cuanto abra." : ""}`;
  }

  /* ---------- 4. DOM del chat ---------- */
  const ICON_CHAT = `<img src="${SCRIPT_BASE}android-button.png" alt="Asistente virtual" class="ad-bubble-img" draggable="false">`;
  const ICON_CLOSE = `<svg viewBox="0 0 24 24"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
  const ICON_SEND  = `<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`;
  const ICON_SUN   = `<svg viewBox="0 0 24 24"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/></svg>`;
  const ICON_MOON  = `<svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>`;
  const ICON_WA    = `<svg viewBox="0 0 24 24"><path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.48 1.69.62.71.23 1.35.2 1.86.12.57-.08 1.77-.72 2.02-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/><path d="M20.52 3.48A11.9 11.9 0 0 0 12.02 0C5.46 0 .13 5.33.13 11.89c0 2.1.55 4.14 1.59 5.95L0 24l6.33-1.66a11.87 11.87 0 0 0 5.69 1.45h.01c6.56 0 11.89-5.33 11.89-11.89 0-3.18-1.24-6.17-3.5-8.42zM12.03 21.8h-.01a9.88 9.88 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.64-.24-.37A9.87 9.87 0 0 1 2.17 11.9c0-5.46 4.43-9.89 9.88-9.89 2.64 0 5.12 1.03 6.98 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.46-4.43 9.9-9.89 9.9z"/></svg>`;

  const root = document.createElement("div");
  root.className = "ad-root";
  root.setAttribute("data-theme", state.theme);
  root.innerHTML = `
    <button class="ad-bubble" id="ad-bubble" aria-label="Abrir chat">${ICON_CHAT}</button>

    <div class="ad-window" id="ad-window" role="dialog" aria-label="Chat de la clínica">
      <div class="ad-header">
        <div class="ad-avatar">🦷</div>
        <div class="ad-header-info">
          <p class="ad-header-title">${escapeHtml(CFG.NOMBRE_CLINICA)}</p>
          <div class="ad-header-status">
            <span class="ad-status-dot ${estaEnHorario() ? "" : "ad-off"}"></span>
            <span id="ad-status-text">${estaEnHorario() ? "En línea" : "Fuera de horario"}</span>
          </div>
        </div>
        <div class="ad-header-actions">
          <button class="ad-icon-btn" id="ad-theme-toggle" aria-label="Cambiar tema">
            ${state.theme === "dark" ? ICON_SUN : ICON_MOON}
          </button>
          <button class="ad-icon-btn" id="ad-close" aria-label="Cerrar chat">${ICON_CLOSE}</button>
        </div>
      </div>

      <div class="ad-quick" id="ad-quick">
        <button data-q="Quiero reservar una cita">📅 Reservar cita</button>
        <button data-q="¿Qué horarios tenéis?">🕒 Horarios</button>
        <button data-q="¿Cuánto cuesta un blanqueamiento?">💰 Precios</button>
        <button data-q="¿Qué seguros aceptáis?">🛡️ Seguros</button>
        <button data-q="¿Cómo llego a la clínica?">📍 Cómo llegar</button>
      </div>

      <div class="ad-messages" id="ad-messages" aria-live="polite"></div>

      <div class="ad-input-wrap">
        <textarea id="ad-input" class="ad-input" rows="1"
          placeholder="${escapeHtml(CFG.PLACEHOLDER_INPUT)}"></textarea>
        <button class="ad-send" id="ad-send" aria-label="Enviar">${ICON_SEND}</button>
      </div>

      <div class="ad-footer">
        <span>Asistente virtual · ${CFG.NOMBRE_CLINICA}</span>
        <a class="ad-wa" href="https://wa.me/${encodeURIComponent(CFG.WHATSAPP_NUMBER)}"
           target="_blank" rel="noopener">${ICON_WA} WhatsApp</a>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  /* ---------- 5. Refs DOM ---------- */
  const els = {
    bubble:       $("#ad-bubble", root),
    window:       $("#ad-window", root),
    close:        $("#ad-close", root),
    themeToggle:  $("#ad-theme-toggle", root),
    messages:     $("#ad-messages", root),
    input:        $("#ad-input", root),
    send:         $("#ad-send", root),
    quick:        $("#ad-quick", root),
    statusText:   $("#ad-status-text", root)
  };

  /* ---------- 6. Render mensajes ---------- */
  function addMsg(role, text, options) {
    options = options || {};
    const div = document.createElement("div");
    div.className = "ad-msg " + (role === "user" ? "ad-msg-user" : "ad-msg-bot");
    div.innerHTML = formatMsg(text);
    els.messages.appendChild(div);
    scrollBottom();
    if (!options.skipHistory && role !== "_system") {
      state.history.push({ role, content: text });
    }
  }

  function addCard(data) {
    const card = document.createElement("div");
    card.className = "ad-card";
    card.innerHTML = `
      <h4>✅ Cita registrada</h4>
      <div class="ad-card-row"><strong>Nombre</strong><span>${escapeHtml(data.nombre)}</span></div>
      <div class="ad-card-row"><strong>Teléfono</strong><span>${escapeHtml(data.telefono)}</span></div>
      <div class="ad-card-row"><strong>Tratamiento</strong><span>${escapeHtml(data.tratamiento)}</span></div>
      <div class="ad-card-row"><strong>Franja</strong><span>${escapeHtml(data.franja)}</span></div>
      <div class="ad-card-actions">
        <button class="ad-btn-primary" id="ad-card-wa">Contactar por WhatsApp</button>
        <button class="ad-btn-secondary" id="ad-card-mail">Enviar por email</button>
      </div>
    `;
    els.messages.appendChild(card);
    scrollBottom();

    $("#ad-card-wa", card).addEventListener("click", () => {
      const msg = `Hola, me gustaría confirmar una cita:\n` +
                  `• Nombre: ${data.nombre}\n` +
                  `• Teléfono: ${data.telefono}\n` +
                  `• Tratamiento: ${data.tratamiento}\n` +
                  `• Franja: ${data.franja}`;
      window.open(`https://wa.me/${CFG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
    });
    $("#ad-card-mail", card).addEventListener("click", () => {
      const subject = `Nueva solicitud de cita - ${data.nombre}`;
      const body = `Nombre: ${data.nombre}%0D%0A` +
                   `Teléfono: ${data.telefono}%0D%0A` +
                   `Tratamiento: ${data.tratamiento}%0D%0A` +
                   `Franja preferida: ${data.franja}`;
      window.location.href =
        `mailto:${CFG.EMAIL_CONTACTO}?subject=${encodeURIComponent(subject)}&body=${body}`;
    });
  }

  function showTyping() {
    hideTyping();
    const t = document.createElement("div");
    t.className = "ad-typing";
    t.id = "ad-typing";
    t.innerHTML = "<span></span><span></span><span></span>";
    els.messages.appendChild(t);
    scrollBottom();
  }
  function hideTyping() {
    const t = $("#ad-typing", els.messages);
    if (t) t.remove();
  }

  function scrollBottom() {
    requestAnimationFrame(() => {
      els.messages.scrollTop = els.messages.scrollHeight;
    });
  }

  /* ---------- 7. Procesar respuesta del bot (detectar cita) ---------- */
  function handleBotResponse(text) {
    const match = text.match(/\[CITA_RESERVADA\]([\s\S]*?)\[\/CITA_RESERVADA\]/);
    if (!match) {
      addMsg("assistant", text);
      return;
    }

    let data;
    try {
      data = JSON.parse(match[1].trim());
    } catch {
      addMsg("assistant", text);
      return;
    }

    // Limpia el bloque y muestra el resto como texto normal
    const clean = text.replace(match[0], "").trim();
    if (clean) addMsg("assistant", clean);

    addCard(data);
    saveAppointment(data);

    if (!state.patientName && data.nombre) {
      state.patientName = data.nombre;
      localStorage.setItem("ad_patient_name", data.nombre);
    }
  }

  function saveAppointment(data) {
    if (!CFG.GUARDAR_CITAS_LOCALSTORAGE) return;
    try {
      const key = CFG.CLAVE_LOCALSTORAGE || "citas_dentales";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      list.push({ ...data, timestamp: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(list, null, 2));
    } catch (e) {
      console.warn("[agente] No se pudo guardar cita en localStorage:", e);
    }
  }

  /* ---------- 8. Llamada a Anthropic ---------- */
  async function callClaude(userMsg) {
    // Historial para la API: mapea 'assistant'/'user', filtra system
    const messages = state.history
      .filter(m => m.role === "user" || m.role === "assistant")
      .map(m => ({ role: m.role, content: m.content }));
    messages.push({ role: "user", content: userMsg });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CFG.API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: CFG.MODEL,
        max_tokens: CFG.MAX_TOKENS,
        system: buildSystemPrompt(),
        messages
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API ${res.status}: ${err}`);
    }
    const data = await res.json();
    const text = data?.content?.[0]?.text || "";
    return text;
  }

  /* ---------- 9. Enviar mensaje ---------- */
  async function send(text) {
    text = (text || els.input.value).trim();
    if (!text || state.sending) return;

    state.sending = true;
    els.send.disabled = true;
    addMsg("user", text);
    els.input.value = "";
    autoResize();
    showTyping();

    try {
      if (!CFG.API_KEY || CFG.API_KEY === "TU_ANTHROPIC_API_KEY_AQUI") {
        throw new Error("Falta configurar API_KEY en config.js");
      }
      const reply = await callClaude(text);
      hideTyping();
      state.history.push({ role: "assistant", content: reply });
      handleBotResponse(reply);
    } catch (e) {
      hideTyping();
      addMsg(
        "assistant",
        `Lo siento, no puedo responder ahora mismo. Puedes llamarnos al **${CFG.TELEFONO}** ` +
        `o escribirnos por WhatsApp.\n\n_(${e.message})_`,
        { skipHistory: true }
      );
      console.error("[agente]", e);
    } finally {
      state.sending = false;
      els.send.disabled = false;
      els.input.focus();
    }
  }

  /* ---------- 10. UI events ---------- */
  function openWindow() {
    state.open = true;
    els.window.classList.add("ad-open");
    els.bubble.classList.add("ad-hidden");
    if (state.history.length === 0) {
      const bienvenida = estaEnHorario()
        ? CFG.MENSAJE_BIENVENIDA
        : `${CFG.MENSAJE_FUERA_HORARIO}\n\n${CFG.MENSAJE_BIENVENIDA}`;
      addMsg("assistant", bienvenida, { skipHistory: true });
      state.history.push({ role: "assistant", content: CFG.MENSAJE_BIENVENIDA });
    }
    setTimeout(() => els.input.focus(), 200);
  }
  function closeWindow() {
    state.open = false;
    els.window.classList.remove("ad-open");
    els.bubble.classList.remove("ad-hidden");
  }
  function toggleTheme() {
    state.theme = state.theme === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", state.theme);
    localStorage.setItem("ad_theme", state.theme);
    els.themeToggle.innerHTML = state.theme === "dark" ? ICON_SUN : ICON_MOON;
  }
  function autoResize() {
    els.input.style.height = "auto";
    els.input.style.height = Math.min(els.input.scrollHeight, 100) + "px";
  }

  els.bubble.addEventListener("click", openWindow);
  els.close.addEventListener("click", closeWindow);
  els.themeToggle.addEventListener("click", toggleTheme);
  els.send.addEventListener("click", () => send());
  els.input.addEventListener("input", autoResize);
  els.input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
  els.quick.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-q]");
    if (btn) send(btn.dataset.q);
  });

  // Actualiza estado cada minuto (por si cambia el horario)
  setInterval(() => {
    const online = estaEnHorario();
    els.statusText.textContent = online ? "En línea" : "Fuera de horario";
    const dot = $(".ad-status-dot", root);
    if (dot) dot.classList.toggle("ad-off", !online);
  }, 60000);

  console.log("[agente] ✅ Agente dental cargado. Haz clic en la burbuja para abrir el chat.");
})();
