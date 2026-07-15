(function () {
  const configLoaded =
    typeof window.APP_CONFIG === "object" && window.APP_CONFIG !== null;
  const config = configLoaded ? window.APP_CONFIG : {};
  const placeholders = document.querySelectorAll("[data-config]");

  placeholders.forEach((node) => {
    const key = node.getAttribute("data-config");
    const value = config[key] || "";

    if (node.tagName === "A" && node.getAttribute("href") === "mailto:") {
      node.href = "mailto:" + value;
      node.textContent = value;
      return;
    }

    node.textContent = value;
  });

  const form = document.getElementById("waitlist-form");
  const particleCanvas = document.getElementById("background-particles");

  if (particleCanvas) {
    const ctx = particleCanvas.getContext("2d");
    const particles = [];
    const particleCount = 44;
    const pointer = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      active: false
    };

    const resizeCanvas = () => {
      const ratio = window.devicePixelRatio || 1;
      particleCanvas.width = Math.floor(window.innerWidth * ratio);
      particleCanvas.height = Math.floor(window.innerHeight * ratio);
      particleCanvas.style.width = window.innerWidth + "px";
      particleCanvas.style.height = window.innerHeight + "px";
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const createParticle = () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      baseX: Math.random() * window.innerWidth,
      baseY: Math.random() * window.innerHeight,
      size: Math.random() * 1.8 + 0.8,
      alpha: Math.random() * 0.22 + 0.08,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22
    });

    const resetParticles = () => {
      particles.length = 0;
      for (let i = 0; i < particleCount; i += 1) {
        particles.push(createParticle());
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      particles.forEach((particle) => {
        const dx = pointer.x - particle.x;
        const dy = pointer.y - particle.y;
        const distance = Math.hypot(dx, dy);

        if (pointer.active && distance < 140) {
          const force = (140 - distance) / 1400;
          particle.vx -= dx * force * 0.02;
          particle.vy -= dy * force * 0.02;
        }

        particle.vx += (particle.baseX - particle.x) * 0.0003;
        particle.vy += (particle.baseY - particle.y) * 0.0003;
        particle.vx *= 0.985;
        particle.vy *= 0.985;
        particle.x += particle.vx;
        particle.y += particle.vy;

        ctx.beginPath();
        ctx.fillStyle = "rgba(168, 140, 102," + particle.alpha + ")";
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      window.requestAnimationFrame(drawParticles);
    };

    resizeCanvas();
    resetParticles();
    drawParticles();

    window.addEventListener("resize", () => {
      resizeCanvas();
      resetParticles();
    });

    window.addEventListener("mousemove", (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    });

    window.addEventListener("mouseleave", () => {
      pointer.active = false;
    });
  }

  if (!form) return;

  const button = form.querySelector('button[type="submit"]');
  const feedback = document.getElementById("form-feedback");
  const defaultButtonText = button ? button.textContent : "";

  const setFeedback = (message, type) => {
    feedback.textContent = message;
    feedback.className = "form-feedback" + (type ? " " + type : "");
  };

  const showSuccess = (email, insertedId) => {
    setFeedback(
      "Gracias. " +
        email +
        " ya ha quedado registrado en la lista de espera." +
        (insertedId ? " ID: " + insertedId : ""),
      "success"
    );
    form.reset();
  };

  const submitToCustomEndpoint = async (payload) => {
    const response = await fetch(config.waitlistEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("No se pudo enviar el formulario.");
    }

    return null;
  };

  const submitToSupabaseRest = async (payload) => {
    const { supabaseUrl, supabaseAnonKey, supabaseTable } = config;
    const response = await fetch(
      supabaseUrl.replace(/\/$/, "") + "/rest/v1/" + supabaseTable,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
          Authorization: "Bearer " + supabaseAnonKey,
          Prefer: "return=minimal"
        },
        body: JSON.stringify([payload])
      }
    );

    if (response.ok) {
      return null;
    }

    let errorMessage = "No se pudo guardar el email.";
    const rawText = await response.text();

    if (rawText) {
      try {
        const parsed = JSON.parse(rawText);
        errorMessage =
          parsed.message || parsed.error_description || parsed.error || rawText;
      } catch {
        errorMessage = rawText;
      }
    }

    if (response.status === 409) {
      throw new Error("Ese correo ya estaba apuntado.");
    }

    throw new Error(errorMessage);
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setFeedback("", "");

    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const honeypot = String(formData.get("company") || "").trim();
    const consent = formData.get("consent") === "on";

    if (honeypot) {
      showSuccess(email || "Tu correo");
      return;
    }

    if (!email) {
      setFeedback("Introduce un correo valido.", "error");
      return;
    }

    if (!consent) {
      setFeedback("Debes aceptar la politica de privacidad.", "error");
      return;
    }

    const payload = {
      email,
      consent_launch: true,
      consent_updates: false,
      source: "landing-nfcuidado",
      locale: document.documentElement.lang || "es",
      created_at: new Date().toISOString()
    };

    button.disabled = true;
    button.textContent = "Enviando...";

    try {
      let result = null;

      if (!configLoaded) {
        throw new Error("Falta config.js en el despliegue.");
      }

      switch (config.submitMode) {
        case "custom-endpoint":
          if (!config.waitlistEndpoint) {
            throw new Error("Falta configurar waitlistEndpoint.");
          }
          result = await submitToCustomEndpoint(payload);
          break;
        case "supabase-rest":
          if (!config.supabaseUrl || !config.supabaseAnonKey) {
            throw new Error("Falta configurar Supabase.");
          }
          result = await submitToSupabaseRest(payload);
          break;
        case "mock":
          await new Promise((resolve) => window.setTimeout(resolve, 500));
          break;
        default:
          throw new Error("submitMode no valido o no configurado.");
      }

      showSuccess(email, result && result.id ? result.id : "");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Ha ocurrido un error.",
        "error"
      );
    } finally {
      button.disabled = false;
      button.textContent = defaultButtonText;
    }
  });
})();
