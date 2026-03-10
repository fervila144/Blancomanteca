# BlancoManteca - E-commerce Artesanal Premium

Este es el código fuente de BlancoManteca, una tienda premium construida con Next.js 15, Tailwind CSS y Firebase.

## 🚀 Opciones de Despliegue en Netlify

### Opción A: Con GitHub (Recomendado)
Es la mejor forma porque cada cambio que hagas aquí se actualizará solo.
1. Crea una cuenta en [GitHub](https://github.com).
2. Crea un nuevo repositorio llamado `blanco-manteca`.
3. Sube tu código (puedes arrastrar los archivos o usar la terminal).
4. En Netlify, elige **"Import from Git"** y selecciona tu repositorio.

### Opción B: Despliegue Manual (Si no usas GitHub)
Si prefieres no usar GitHub, debes construir el proyecto localmente primero:
1. Instala la CLI de Netlify: `npm install -g netlify-cli`.
2. Ejecuta `npm run build` en tu carpeta del proyecto.
3. Ejecuta `netlify deploy --prod`.
4. Cuando te pida la carpeta a publicar, elige `.next` (o sigue las instrucciones de la CLI para Next.js).

## ⚙️ Configuración Requerida
Independientemente del método, debes configurar estas **Environment Variables** en el panel de Netlify (**Site Settings > Environment variables**):
- `GEMINI_API_KEY`: Tu llave de Google AI (para generar descripciones).
- `NODE_VERSION`: `20`
- `NEXT_USE_NETLIFY_EDGE`: `true`

## ✨ Características Premium
- **Rutas Pro**: `/login` y `/register` integradas.
- **Carrusel Mixto**: Banners de galería + Productos destacados.
- **Optimización de Imagen**: Compresión inteligente en el navegador (hasta 5MB).
- **IA Generativa**: Copywriting para productos.

---
© 2026 BlancoManteca - Todos los derechos reservados.
