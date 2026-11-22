# Guia ràpida del calendari de l’Ona

Web estàtica per a GitHub Pages. No necessita instal·lació ni cap servei extern.

## Quin fitxer he d’editar?

- **`content.js`**: frases, fotos i cançons de cada dia.
- **`carta.js`**: el text de la carta personalitzada per a l’Ona.
- **`app.js`**: opcions de prova i funcionament dels botons, dates i finestretes.
- **`style.css`**: colors, mides, decoracions, portelles de garatge i animacions. Les seccions estan titulades dins del fitxer.
- **`carta-icon.svg`**: dibuix vectorial de la icona de la carta.
- **`index.html`**: estructura de la pàgina i textos dels títols i botons.
- **`fotos/` i `musica/`**: desa-hi els fitxers que faràs servir al calendari.

## Carta personalitzada

Obre `carta.js` i substitueix el text que hi ha entre les dues cometes inverses (\`). Conserva la línia `window.adventLetter =` i la cometa inversa final. Escriu la carta entre aquestes cometes; deixa una línia buida entre paràgrafs:

```js
window.adventLetter = `Hola, Ona.

Volia recordar-te com d’especial ets per a mi.

Amb tot el meu amor.`;
```

Pots escriure accents, apòstrofs i salts de línia normalment. Evita posar una cometa inversa dins de la carta. Desa el fitxer i torna a carregar la pàgina per veure els canvis. La carta s’adapta a pantalles petites; si és llarga, podràs desplaçar el text dins del paper.

La carta apareix després d’obrir la bústia i el sobre. Un cop dins del calendari, pots tornar-la a llegir amb la icona de sobre de baix a la dreta.

## Fotos, frases i cançons

`content.js` té 24 files en ordre. La primera és el dia 1 i l’última és el dia 24. A cada fila:

- `photo`: camí a la foto, per exemple `fotos/dia-01.jpg`.
- `photo` també pot ser un vídeo MP4 o WebM, per exemple `fotos/dia-12.mp4`.
- Les imatges tenen un botó **Pantalla completa** al visor; els vídeos es poden obrir amb els controls del reproductor.
- `message`: frase que es mostra aquell dia.
- `music`: camí a la cançó, per exemple `musica/canco.mp3`.

Exemple:

```js
{ photo: "fotos/dia-01.jpg", message: "El nostre primer Nadal plegats.", music: "musica/canco.mp3" },
```

Deixa `photo` o `music` com `""` si aquell dia encara no té cap fitxer. Fes servir noms senzills, sense accents ni espais.

Per al vídeo, posa el fitxer dins de `fotos/` i escriu el camí exacte a `photo`, igual que faries amb una foto. El reproductor apareix automàticament segons l’extensió del fitxer. Els noms i les extensions han de coincidir exactament, incloses les majúscules i minúscules, perquè la web també funcioni quan es publica a GitHub Pages.

## Prova i desbloqueig per dates

Al començament de `app.js`, a `SETTINGS`, hi ha les opcions principals:

- `testMode: true` deixa obrir totes les finestretes. Canvia-ho a `false` per desbloquejar-les segons el dia de desembre de 2026.
- `resetProgressOnLoad: true` fa que cada recàrrega torni a mostrar la bústia i tanqui les finestretes. Canvia-ho a `false` perquè el navegador recordi quines ja has obert.
- `year` canvia l’any del calendari.
- `numberOfDays` canvia el nombre de finestretes; si el canvies, afegeix o treu files a `content.js` perquè coincideixin.

## Canviar l’aspecte

Obre `style.css` i busca els títols de secció. Els colors principals són al principi, dins de `:root`. La secció **Calendari i portelles** controla les finestretes; **Bústia** i **Sobre i carta** controlen l’entrada; **Mida petita / mòbil** adapta la pàgina a pantalles estretes; i **Animacions** és al final.


## Veure la pàgina en un altre ordinador de casa

Obre la terminal de VS Code dins d’aquesta carpeta i executa:

```powershell
py -m http.server 8000 --bind 0.0.0.0
```

Busca l’adreça IPv4 del teu ordinador amb `ipconfig`. Des de l’altre ordinador, connectat a la mateixa xarxa, obre `http://ADREÇA-IP:8000` (substitueix `ADREÇA-IP` per l’adreça IPv4). Deixa la terminal oberta mentre comparteixes la pàgina; prem **Ctrl+C** per aturar-la.

## Publicar-la a GitHub Pages

1. Crea un repositori a GitHub (per exemple `calendari-ona`) i puja-hi el contingut d’aquesta carpeta.
2. Al repositori, ves a **Settings → Pages**.
3. A **Build and deployment**, tria **Deploy from a branch**, selecciona `main` i la carpeta `/ (root)`, i desa.
4. GitHub mostrarà l’adreça pública de la web a la mateixa secció de Pages.

Les fotos i cançons que hi afegeixis es publicaran amb la web i seran visibles per a qui tingui l’enllaç.
