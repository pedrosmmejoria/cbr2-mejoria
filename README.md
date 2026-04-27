# CBR 2.0 — by MEJORÍA

Plataforma de preparación para el examen JTBR de Corredor de Bienes Raíces (Panamá), empaquetada como **PWA** (Progressive Web App). Se instala desde el navegador en cualquier celular o computador como una app más.

---

## Qué es esto

Una webapp basada en React + Vite con soporte PWA (instalable, funciona offline tras la primera visita). Contiene:

- 362 preguntas verificadas en 10 bloques temáticos
- Modo estudio, flashcards, simulacro de examen
- Calculadora tributaria (ITBI, Ganancia de Capital, PFT/VP, catastral)
- Biblioteca de 30 recursos agrupados por bloque
- Progreso, errores e historial de simulacros (almacenamiento local)

---

## Requisitos previos

Necesitas instalar **Node.js** (versión 18 o superior). Bajálo de [nodejs.org](https://nodejs.org/). Es gratis.

Para verificar que está instalado, abre Terminal (Mac) o PowerShell (Windows) y escribe:

```bash
node --version
```

Debe mostrar algo como `v20.x.x`.

---

## Probar localmente (en tu computador)

1. Descomprime el proyecto en una carpeta
2. Abre Terminal en esa carpeta
3. Instala dependencias:

   ```bash
   npm install
   ```

4. Levanta el servidor de desarrollo:

   ```bash
   npm run dev
   ```

5. Abre `http://localhost:5173` en el navegador

Los cambios que hagas al código se reflejan en tiempo real. Para detener: `Ctrl+C` en la terminal.

---

## Compilar para producción

```bash
npm run build
```

Esto crea la carpeta `dist/` con los archivos optimizados, listos para subir a cualquier hosting estático.

---

## Publicar en Vercel (opción recomendada — más rápida)

### Opción A: Desde el navegador (sin Git)

1. Crea cuenta gratis en [vercel.com](https://vercel.com)
2. En el dashboard, haz clic en **Add New → Project**
3. Selecciona **Import Third-Party Git Repository** y luego **Deploy** o usa la opción de **drag-and-drop** del archivo ZIP del proyecto
4. Vercel detecta automáticamente que es Vite, le da a Deploy
5. En 1-2 minutos te entrega un enlace tipo `cbr2-mejoria.vercel.app`

### Opción B: Con Git (si tienes GitHub)

1. Sube el proyecto a un repositorio de GitHub
2. En Vercel: **Import Git Repository** y selecciona tu repo
3. Vercel detecta Vite y despliega automáticamente
4. Cada vez que hagas un push, se redespliega solo

### Conectar dominio propio (opcional)

En el dashboard de Vercel: **Settings → Domains → Add**. Sigue las instrucciones para apuntar tu DNS. Tarda entre 5 minutos y 24 horas en propagar.

---

## Publicar en Netlify (alternativa)

Idéntico flujo: cuenta gratis en [netlify.com](https://netlify.com), arrastra la carpeta `dist/` al área de despliegue (después de `npm run build`), y obtienes un enlace `xxxx.netlify.app`.

---

## Cómo se instala como app en el celular

Una vez publicada y con el enlace en mano:

### Android
1. Abre el enlace en Chrome
2. Aparece banner abajo: **Agregar a pantalla de inicio**
3. Si no aparece: menú (⋮) → **Instalar aplicación**

### iOS
1. Abre el enlace en Safari
2. Toca el botón compartir (cuadrado con flecha)
3. **Agregar a pantalla de inicio**

Aparece el ícono de CBR 2.0 en la pantalla del teléfono y se abre como app, sin barra del navegador.

---

## Cambios futuros en el contenido

Si más adelante agregas o modificas preguntas:

1. Edita `src/App.jsx` (en la sección `QUESTIONS`)
2. Si tienes Git: haz `git push` → Vercel redespliega automáticamente
3. Si no: corre `npm run build` y vuelve a subir la carpeta `dist/` a Vercel
4. Los usuarios reciben la versión nueva la próxima vez que abran la app

---

## Preguntas frecuentes

**¿Funciona offline?** Sí, después de la primera visita. La PWA cachea los archivos.

**¿Dónde se guarda el progreso?** En el navegador del usuario (localStorage). Si limpia datos del navegador, se pierde. Si quieres sincronización entre dispositivos, hace falta agregar backend.

**¿Cuánto cuesta?** Gratis si usas dominio de Vercel. Si quieres dominio propio: ~B/.15/año.

**¿Aparece en App Store o Play Store?** No, las PWA no salen en tiendas. Pero los usuarios la "instalan" desde el navegador igual.

---

## Estructura del proyecto

```
cbr2-pwa/
├── package.json          # dependencias
├── vite.config.js        # configuración build + PWA
├── tailwind.config.js    # Tailwind
├── postcss.config.js     # PostCSS
├── index.html            # HTML raíz
├── public/               # archivos estáticos
│   ├── favicon.svg       # icono navegador
│   ├── icon-192.png      # icono Android
│   ├── icon-512.png      # icono Android grande
│   └── apple-touch-icon.png  # icono iOS
└── src/
    ├── main.jsx          # entrada React
    ├── App.jsx           # toda la app (3,400+ líneas)
    └── index.css         # estilos base + Tailwind
```

---

© Juan Sebastián Molina F. y Empresas Relacionadas — by MEJORÍA. Sin afiliación con MICI ni JTBR.
