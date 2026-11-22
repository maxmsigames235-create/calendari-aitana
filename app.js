/*
 * LÒGICA DE LA PÀGINA
 * Aquest fitxer controla les finestretes, la carta, la bústia i la pantalla completa.
 * Les frases, fotos i cançons s’editen a content.js; l’aspecte s’edita a style.css.
 */
(() => {
  // ── 1. OPCIONS FÀCILS DE CANVIAR ──────────────────────────────────────────
  const SETTINGS = {
    year: 2026,                  // Any del calendari.
    numberOfDays: 24,            // Nombre de finestretes.
    testMode: false,              // true = obre tots els dies; false = respecta les dates.
    resetProgressOnLoad: true    // true = cada recàrrega comença amb la carta i finestretes tancades.
  };

  const STORAGE_KEYS = {
    openedDays: "advent-aitana-2026-open",
    letterSeen: "advent-aitana-letter-seen"
  };

  // ── 2. ELEMENTS DE LA PÀGINA ──────────────────────────────────────────────
  const calendar = document.getElementById("calendar");
  const dayDialog = document.getElementById("window-dialog");
  const welcome = document.getElementById("welcome");
  const envelopeScene = document.getElementById("envelope-scene");
  const letterOverlay = document.getElementById("letter-overlay");
  const letterShortcut = document.getElementById("letter-shortcut");
  const fullscreenButton = document.getElementById("fullscreen-toggle");
  const lockedNotice = document.getElementById("locked-notice");
  const dailyContent = window.adventContent || [];
  let mailboxStarted = false; // Evita activar diverses obertures si es clica més d’un cop.
  let lockedNoticeTimeout;
  let browserFullscreenByF11 = false;
  let previousViewportHeight = window.innerHeight;

  // ── 3. ESTAT I DATES ──────────────────────────────────────────────────────
  // En mode de prova esborrem l’estat desat a cada càrrega perquè tot comenci de nou.
  if (SETTINGS.resetProgressOnLoad) {
    localStorage.removeItem(STORAGE_KEYS.openedDays);
    localStorage.removeItem(STORAGE_KEYS.letterSeen);
  }

  function readOpenedDays() {
    try {
      return new Set(JSON.parse(localStorage.getItem(STORAGE_KEYS.openedDays) || "[]"));
    } catch {
      return new Set();
    }
  }

  const openedDays = readOpenedDays();
  const now = new Date();
  const lastUnlockedDay = SETTINGS.testMode
    ? 0
    : now.getFullYear() === SETTINGS.year && now.getMonth() === 11
      ? Math.min(now.getDate(), SETTINGS.numberOfDays)
      : now.getFullYear() > SETTINGS.year
        ? SETTINGS.numberOfDays
        : 0;

  // ── 4. DIBUIXAR EL CALENDARI ──────────────────────────────────────────────
  function makeShutter(day) {
    const shutter = document.createElement("span");
    shutter.className = "shutter";

    // La xifra va a la portella única i s’enfila amb ella en obrir-se.
    const digit = document.createElement("span");
    digit.className = "shutter-digit";
    digit.textContent = String(day);
    shutter.append(digit);
    return shutter;
  }

  function makeLock() {
    const lock = document.createElement("span");
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const shackle = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const body = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const keyhole = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    lock.className = "day-lock";
    lock.setAttribute("aria-hidden", "true");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("focusable", "false");
    shackle.setAttribute("d", "M8 10V7a4 4 0 0 1 8 0v3");
    body.setAttribute("x", "5");
    body.setAttribute("y", "10");
    body.setAttribute("width", "14");
    body.setAttribute("height", "11");
    body.setAttribute("rx", "2");
    keyhole.setAttribute("cx", "12");
    keyhole.setAttribute("cy", "15");
    keyhole.setAttribute("r", "1");
    icon.append(shackle, body, keyhole);
    lock.append(icon);
    return lock;
  }

  function showLockedNotice(day) {
    lockedNotice.textContent = `Encara no la pots obrir. Torna el dia ${day} de desembre.`;
    lockedNotice.classList.add("visible");
    window.clearTimeout(lockedNoticeTimeout);
    lockedNoticeTimeout = window.setTimeout(() => {
      lockedNotice.classList.remove("visible");
    }, 3200);
  }

  function renderCalendar() {
    calendar.replaceChildren();

    for (let day = 1; day <= SETTINGS.numberOfDays; day += 1) {
      const isOpen = openedDays.has(day);
      const isLocked = !SETTINGS.testMode && day > lastUnlockedDay;
      const button = document.createElement("button");

      button.type = "button";
      button.dataset.day = String(day);
      button.className = [
        "day",
        isOpen ? "open" : "",
        day === lastUnlockedDay ? "today" : "",
        isLocked ? "locked" : "",
        day === SETTINGS.numberOfDays ? "christmas-eve" : ""
      ].filter(Boolean).join(" ");
      button.setAttribute("aria-label", isOpen ? `Dia ${day}, obert` : isLocked ? `Dia ${day}, encara tancat` : `Obre el dia ${day}`);
      button.setAttribute("aria-disabled", String(isLocked));
      const number = document.createElement("span");
      number.className = "day-number";
      number.textContent = String(day);
      button.append(number, makeShutter(day));
      if (isLocked) button.append(makeLock());

      button.addEventListener("click", () => {
        if (isLocked) {
          showLockedNotice(day);
          return;
        }
        openDay(day);
      });
      calendar.append(button);
    }

    updateCalendarHint();
  }

  function updateCountdown() {
    const now = new Date();
    const currentSeasonYear = Math.max(SETTINGS.year, now.getFullYear());
    let nextOpening = new Date(currentSeasonYear, 11, 1);

    if (now >= nextOpening) {
      if (now.getFullYear() === currentSeasonYear && now.getMonth() === 11 && now.getDate() < SETTINGS.numberOfDays) {
        nextOpening = new Date(now.getFullYear(), 11, now.getDate() + 1);
      } else {
        nextOpening = new Date(currentSeasonYear + 1, 11, 1);
      }
    }

    const secondsLeft = Math.max(0, Math.ceil((nextOpening.getTime() - now.getTime()) / 1000));
    const daysLeft = Math.floor(secondsLeft / 86400);
    const hours = String(Math.floor((secondsLeft % 86400) / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, "0");
    const seconds = String(secondsLeft % 60).padStart(2, "0");

    document.getElementById("countdown-label").textContent = `FINS AL DIA ${nextOpening.getDate()} DE DESEMBRE`;
    document.getElementById("countdown-time").textContent = daysLeft > 0
      ? `${daysLeft}d ${hours}:${minutes}:${seconds}`
      : `${hours}:${minutes}:${seconds}`;
  }

  function renderSnow() {
    document.querySelectorAll(".snow, .welcome-snow, .envelope-snow").forEach((snow) => {
      const flakeCount = snow.classList.contains("envelope-snow")
        ? 38
        : snow.classList.contains("welcome-snow")
          ? 20
          : 32;

      for (let index = 0; index < flakeCount; index += 1) {
        const flake = document.createElement("span");
        const duration = 10 + Math.random() * 14;
        flake.className = "snowflake";
        flake.textContent = "❄";
        flake.setAttribute("aria-hidden", "true");
        flake.style.setProperty("--left", `${Math.random() * 100}%`);
        flake.style.setProperty("--size", `${9 + Math.random() * 12}px`);
        flake.style.setProperty("--duration", `${duration}s`);
        flake.style.setProperty("--delay", `${-Math.random() * duration}s`);
        flake.style.setProperty("--sway", `${Math.round((Math.random() - 0.5) * 90)}px`);
        const opacity = snow.classList.contains("envelope-snow")
          ? 0.18 + Math.random() * 0.42
          : 0.35 + Math.random() * 0.55;
        flake.style.setProperty("--opacity", `${opacity}`);
        snow.append(flake);
      }
    });
  }

  function updateCalendarHint() {
    const hint = document.getElementById("hint");

    if (SETTINGS.testMode) {
      hint.textContent = "Fes clic a una finestreta per descobrir la sorpresa del dia.";
    } else if (lastUnlockedDay === 0) {
      hint.textContent = "Les finestretes començaran a obrir-se l’1 de desembre.";
    } else if (lastUnlockedDay < SETTINGS.numberOfDays) {
      hint.textContent = `Ja pots obrir fins al dia ${lastUnlockedDay}. La resta t’espera.`;
    } else {
      hint.textContent = "Ja és Nadal. Totes les finestretes t’esperen.";
    }
  }

  // ── 5. CONTINGUT D’UNA FINESTRETA ─────────────────────────────────────────
  function openDay(day) {
    const item = dailyContent[day - 1] || {};
    openedDays.add(day);

    localStorage.setItem(STORAGE_KEYS.openedDays, JSON.stringify([...openedDays]));

    // Canvia només la casella oberta; així la resta del calendari no repeteix l’animació.
    const openedWindow = calendar.querySelector(`[data-day="${day}"]`);
    if (openedWindow) {
      openedWindow.classList.add("open");
      openedWindow.setAttribute("aria-label", `Dia ${day}, obert`);
    }

    document.getElementById("modal-date").textContent = `DESEMBRE ${SETTINGS.year} · DIA ${String(day).padStart(2, "0")}`;
    document.getElementById("window-title").textContent = day === SETTINGS.numberOfDays ? "Bon Nadal, BUNICAAAA" : "Una sorpresa per a tu";
    document.getElementById("modal-message").textContent = item.message || "T’estimo.";
    showPhoto(item.photo, day);
    showMusic(item.music);
    dayDialog.showModal();
    startMusic();
  }

  function showPhoto(photoPath, day) {
    const photoBox = document.getElementById("modal-photo");
    photoBox.replaceChildren();

    if (!photoPath) {
      photoBox.innerHTML = '<span class="photo-placeholder">La nostra foto d’avui<br><small>Afegeix-la a la carpeta fotos</small></span>';
      return;
    }

    // Si photo apunta a un vídeo, crea un reproductor; si no, mostra una imatge.
    const isVideo = /\.(mp4|webm|ogv|ogg|mov)$/i.test(photoPath);

    if (isVideo) {
      const video = document.createElement("video");
      video.controls = true;
      video.playsInline = true;
      video.autoplay = true;
      video.muted = false;
      video.volume = 1;
      video.preload = "metadata";
      video.setAttribute("aria-label", `Vídeo del dia ${day}`);
      video.onerror = () => {
        const errorCode = video.error?.code;
        const errorMessage = errorCode === 4
          ? "El navegador no admet aquest format de vídeo."
          : errorCode === 2
            ? "No s’ha pogut carregar el fitxer de vídeo."
            : "El vídeo no s’ha pogut reproduir.";
        photoBox.textContent = `${errorMessage} (error ${errorCode || "desconegut"}). Comprova el camí i el nom del fitxer.`;
      };
      video.src = photoPath;
      photoBox.append(video);
      // L’obertura de la finestreta és un clic de l’usuari; aprofita’l per iniciar vídeo i so.
      video.play().catch(() => {}); // Si el navegador ho bloqueja, es pot iniciar amb els controls.
      return;
    }

    const viewer = document.createElement("div");
    const image = document.createElement("img");
    const fullscreen = document.createElement("button");
    const fullscreenStatus = document.createElement("span");

    viewer.className = "image-viewer";
    image.src = photoPath;
    image.alt = `Record del dia ${day}`;
    image.onerror = () => { photoBox.textContent = "No s’ha trobat la foto. Revisa el nom del fitxer."; };
    fullscreen.type = "button";
    fullscreen.className = "image-fullscreen";
    fullscreen.textContent = "Pantalla completa";
    fullscreen.setAttribute("aria-label", "Obre la imatge a pantalla completa");
    fullscreenStatus.className = "image-fullscreen-status";
    fullscreenStatus.setAttribute("role", "status");
    fullscreenStatus.hidden = true;
    fullscreen.addEventListener("click", async () => {
      fullscreenStatus.hidden = true;
      try {
        if (document.fullscreenElement === viewer) {
          await document.exitFullscreen();
        } else {
          await viewer.requestFullscreen();
        }
      } catch {
        fullscreenStatus.textContent = "No s’ha pogut activar la pantalla completa en aquest navegador.";
        fullscreenStatus.hidden = false;
      }
    });
    viewer.append(image, fullscreen, fullscreenStatus);
    photoBox.append(viewer);
  }

  function showMusic(musicPath) {
    const musicBox = document.getElementById("music-wrap");
    musicBox.replaceChildren();

    if (!musicPath) {
      const note = document.createElement("p");
      note.className = "music-missing";
      note.textContent = "La nostra cançó d’avui";
      musicBox.append(note);
      return;
    }

    const audio = document.createElement("audio");
    audio.controls = true;
    audio.preload = "none";
    audio.src = musicPath;
    audio.setAttribute("aria-label", "Música del dia");
    musicBox.append(audio);
  }

  function startMusic() {
    const audio = document.querySelector("#music-wrap audio");
    if (!audio) return;

    audio.play().catch(() => {
      const notice = document.createElement("p");
      notice.className = "music-error";
      notice.setAttribute("role", "status");
      notice.textContent = "La música no s’ha pogut iniciar sola. Prem el botó de reproducció.";
      document.getElementById("music-wrap").append(notice);
    });
  }

  // ── 6. BÚSTIA I CARTA ──────────────────────────────────────────────────────
  function getLetterText() {
    return window.adventLetter || "Escriu aquí la teva carta personalitzada a content.js.";
  }

  // La carta completa és el full que ja està dins del sobre, abans que es cliqui.
  document.getElementById("emerged-letter-copy").textContent = getLetterText();

  function showLetterAgain() {
    document.getElementById("letter-copy").textContent = getLetterText();
    letterOverlay.hidden = false;
    letterOverlay.classList.remove("letter-in");
    requestAnimationFrame(() => letterOverlay.classList.add("letter-in"));
  }

  function toggleVillageFeature(feature) {
    const isOn = feature.classList.toggle(
      feature.classList.contains("village-door") || feature.classList.contains("village-window")
        ? "is-open"
        : feature.classList.contains("village-chimney")
          ? "is-smoking"
          : "is-on"
    );
    feature.setAttribute("aria-pressed", String(isOn));

    if (feature.classList.contains("village-door")) {
      feature.setAttribute("aria-label", `${isOn ? "Tanca" : "Obre"} la porta`);
    } else if (feature.classList.contains("village-window")) {
      const position = feature === welcome.querySelector(".village-window") ? "esquerra" : "dreta";
      feature.setAttribute("aria-label", `${isOn ? "Tanca" : "Obre"} la finestra ${position}`);
    } else if (feature.classList.contains("village-chimney")) {
      feature.setAttribute("aria-label", `${isOn ? "Desactiva" : "Activa"} el fum de la xemeneia`);
    } else {
      const colour = feature.classList.contains("light-gold") ? "daurat" : "vermell";
      feature.setAttribute("aria-label", `${isOn ? "Apaga" : "Encén"} el llum ${colour} de l’arbre`);
    }
  }

  function animateTreeStar(star) {
    const tree = star.closest(".village-tree");
    if (!tree) return;

    star.classList.remove("is-magical");
    tree.classList.remove("is-magical");
    void tree.getBoundingClientRect();
    star.classList.add("is-magical");
    tree.classList.add("is-magical");
  }

  welcome.addEventListener("click", (event) => {
    const feature = event.target.closest(".village-window, .village-door, .village-chimney, .tree-light, .tree-star");
    if (!feature) return;
    if (feature.classList.contains("tree-star")) {
      animateTreeStar(feature);
      return;
    }
    toggleVillageFeature(feature);
  });

  welcome.addEventListener("keydown", (event) => {
    if ((event.key !== "Enter" && event.key !== " ") || !event.target.matches(".village-window, .village-door, .village-chimney, .tree-light, .tree-star")) return;
    event.preventDefault();
    if (event.target.classList.contains("tree-star")) {
      animateTreeStar(event.target);
      return;
    }
    toggleVillageFeature(event.target);
  });

  document.getElementById("mailbox-button").addEventListener("click", () => {
    if (mailboxStarted) return;
    mailboxStarted = true;
    welcome.classList.add("mailbox-open");
    window.setTimeout(() => {
      envelopeScene.removeAttribute("aria-hidden");
      envelopeScene.classList.add("visible");
    }, 900); // Espera que s’obri la tapa de la bústia abans de mostrar el sobre.
  });

  document.getElementById("envelope-button").addEventListener("click", (event) => {
    welcome.classList.add("envelope-open"); // Obre la solapa del sobre.
    event.currentTarget.disabled = true;    // Evita que la seqüència comenci més d’un cop.
    document.getElementById("emerged-letter-copy").textContent = getLetterText();
    window.setTimeout(() => envelopeScene.classList.add("letter-out"), 1120); // Espera que s’obri la solapa i després fa sortir el full.
  });

  function enterCalendar() {
    letterOverlay.hidden = true;
    welcome.classList.add("welcome-gone");
    localStorage.setItem(STORAGE_KEYS.letterSeen, "yes");
    letterShortcut.classList.add("visible");
  }

  document.getElementById("enter-button").addEventListener("click", enterCalendar);
  document.getElementById("emerged-enter-button").addEventListener("click", enterCalendar);
  letterShortcut.addEventListener("click", showLetterAgain);
  letterOverlay.addEventListener("click", (event) => {
    if (event.target === letterOverlay) letterOverlay.hidden = true;
  });

  // ── 7. FINESTRETA I PANTALLA COMPLETA ─────────────────────────────────────
  document.getElementById("close-dialog").addEventListener("click", () => dayDialog.close());
  document.addEventListener("fullscreenchange", () => {
    const viewer = document.querySelector("#modal-photo .image-viewer");
    const fullscreen = document.querySelector("#modal-photo .image-fullscreen");
    if (!viewer || !fullscreen) return;

    const isFullscreen = document.fullscreenElement === viewer;
    fullscreen.textContent = isFullscreen ? "Surt de pantalla completa" : "Pantalla completa";
    fullscreen.setAttribute("aria-label", isFullscreen ? "Surt de la pantalla completa" : "Obre la imatge a pantalla completa");
  });
  dayDialog.addEventListener("cancel", (event) => event.preventDefault());
  dayDialog.addEventListener("close", () => {
    dayDialog.querySelectorAll("audio, video").forEach((media) => {
      media.pause();
      media.currentTime = 0;
    });
  });

  function isBrowserFullscreen() {
    const screenHeight = window.screen.availHeight || window.screen.height;
    const browserChromeHidden = window.outerHeight > 0 && window.outerHeight <= window.innerHeight + 2;
    return browserChromeHidden && screenHeight > 0 && window.innerHeight >= screenHeight - 2;
  }

  function updateFullscreenButton() {
    const isDocumentFullscreen = Boolean(document.fullscreenElement);
    const isBrowserFullscreenMode = !isDocumentFullscreen && (browserFullscreenByF11 || isBrowserFullscreen());
    const isFullscreen = isDocumentFullscreen || isBrowserFullscreenMode;

    fullscreenButton.classList.toggle("is-fullscreen", isFullscreen);
    fullscreenButton.setAttribute(
      "aria-label",
      isBrowserFullscreenMode
        ? "Per sortir, prem F11"
        : isFullscreen
          ? "Surt de la pantalla completa"
          : "Activa la pantalla completa"
    );
    fullscreenButton.title = isBrowserFullscreenMode
      ? "Prem F11 per sortir de la pantalla completa del navegador"
      : isFullscreen
        ? "Surt de la pantalla completa"
        : "Activa la pantalla completa";
  }

  fullscreenButton.addEventListener("click", async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (isBrowserFullscreen()) {
      return;
    } else {
      await document.documentElement.requestFullscreen();
    }
    updateFullscreenButton();
  });

  document.addEventListener("fullscreenchange", updateFullscreenButton);
  window.addEventListener("keydown", (event) => {
    if (event.key !== "F11" && event.code !== "F11") return;
    browserFullscreenByF11 = !browserFullscreenByF11;
    updateFullscreenButton();
  });
  window.addEventListener("resize", () => {
    const viewportHeight = window.innerHeight;
    const screenHeight = window.screen.availHeight || window.screen.height;

    if (viewportHeight > previousViewportHeight + 60 && viewportHeight >= screenHeight - 2) {
      browserFullscreenByF11 = true;
    } else if (viewportHeight < previousViewportHeight - 60) {
      browserFullscreenByF11 = false;
    }

    previousViewportHeight = viewportHeight;
    updateFullscreenButton();
  });
  updateFullscreenButton();

  // ── 8. INICIAR ────────────────────────────────────────────────────────────
  if (!SETTINGS.resetProgressOnLoad && localStorage.getItem(STORAGE_KEYS.letterSeen) === "yes") {
    welcome.hidden = true;
    letterShortcut.classList.add("visible");
  }

  updateCountdown();
  window.setInterval(updateCountdown, 1000);
  renderSnow();
  renderCalendar();
})();
