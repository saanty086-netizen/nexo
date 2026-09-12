# NEXO STORE

Tienda web + panel de administración para NEXO, con Firebase (Auth + Firestore) como backend.

## Archivos

- `index.html` — Storefront público. Catálogo dinámico desde Firestore, modal de pedido rápido (WhatsApp) y modal de login/registro.
- `admin.html` — Panel privado. Requiere sesión con Firebase Auth y un documento en la colección `admins` con el mismo UID del usuario. Incluye control de vencimientos de clientes y gestor de catálogo.
- `firebase.js` — Inicialización del SDK modular de Firebase v10 y funciones helper de acceso a Firestore.

## Configuración

1. Creá un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. Habilitá **Authentication → Email/Password**.
3. Habilitá **Firestore Database**.
4. Reemplazá los placeholders en `firebase.js` con tu configuración real:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

5. Para dar permisos de administrador a un usuario, creá manualmente en Firestore un documento:
   - Colección: `admins`
   - ID del documento: el `uid` del usuario (lo ves en Authentication → Users)
   - Contenido: cualquier campo, por ejemplo `{ rol: "admin" }`

6. En `index.html`, reemplazá el número de WhatsApp de ejemplo (`5492610000000`) por el número real de la tienda.

## Colecciones de Firestore

**productos**
```
nombre: string
precio: number
categoria: "streaming" | "seguidores"
imagen: string (url, opcional)
caracteristicas: string[]
hayStock: boolean
```

**clientes**
```
nombre: string
whatsapp: string
servicio: string
fechaVencimiento: string (YYYY-MM-DD)
pagado: boolean
fechaPedido: string (ISO)
```

## Reglas de seguridad sugeridas (Firestore)

Ajustar según necesidad — como mínimo, restringir escritura en `productos` y lectura/escritura en `clientes` solo a usuarios autenticados que existan en `admins`.

## Deploy

Cualquier hosting estático sirve (Firebase Hosting, Netlify, Vercel, GitHub Pages). No requiere build step.
