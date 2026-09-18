// firebase.js
// SDK modular de Firebase v10 para la web

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  increment
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// -----------------------------
// Configuración de Firebase
// -----------------------------
const firebaseConfig = {
  apiKey: "AIzaSyD16l3a-H3llIYRK_7La-3IUiCIM7uRi3k",
  authDomain: "nexo-aeb5a.firebaseapp.com",
  databaseURL: "https://nexo-aeb5a-default-rtdb.firebaseio.com",
  projectId: "nexo-aeb5a",
  storageBucket: "nexo-aeb5a.firebasestorage.app",
  messagingSenderId: "553737684793",
  appId: "1:553737684793:web:0267a5bbfbc2c0c575cae8"
};

// -----------------------------
// Inicialización
// -----------------------------
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// -----------------------------
// Helpers: Autenticación
// -----------------------------

/**
 * Inicia sesión con Google usando un popup.
 * @returns {Promise<import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js").UserCredential>}
 */
export async function loginConGoogle() {
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(auth, provider);
}

/**
 * Inicia sesión de forma anónima (sin correo ni contraseña).
 * @returns {Promise<import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js").UserCredential>}
 */
export async function loginAnonimo() {
  return await signInAnonymously(auth);
}

/**
 * Crea (o reutiliza) un verificador reCAPTCHA invisible, requerido por Firebase
 * antes de enviar un código SMS. containerId debe ser el id de un <div> vacío en el DOM.
 * @param {string} containerId
 * @returns {RecaptchaVerifier}
 */
export function crearRecaptcha(containerId) {
  if (!window.__recaptchaVerifier) {
    window.__recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible"
    });
  }
  return window.__recaptchaVerifier;
}

/**
 * Envía el código SMS al número indicado. El número debe incluir código de país,
 * ej: "+5492610000000".
 * @param {string} numeroTelefono
 * @param {string} recaptchaContainerId
 * @returns {Promise<import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js").ConfirmationResult>}
 */
export async function enviarCodigoSms(numeroTelefono, recaptchaContainerId) {
  const verifier = crearRecaptcha(recaptchaContainerId);
  return await signInWithPhoneNumber(auth, numeroTelefono, verifier);
}

/**
 * Confirma el código SMS recibido y completa el login.
 * @param {import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js").ConfirmationResult} confirmationResult
 * @param {string} codigo
 * @returns {Promise<import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js").UserCredential>}
 */
export async function confirmarCodigoSms(confirmationResult, codigo) {
  return await confirmationResult.confirm(codigo);
}

// -----------------------------
// Referencias de colecciones
// -----------------------------
const productosRef = collection(db, "productos");
const clientesRef = collection(db, "clientes");

// -----------------------------
// Helpers: Productos
// -----------------------------

/**
 * Obtiene todos los documentos de la colección 'productos'.
 * @returns {Promise<Array<Object>>}
 */
export async function obtenerProductos() {
  const snapshot = await getDocs(productosRef);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

/**
 * Guarda un nuevo producto en la colección 'productos'.
 * @param {Object} producto
 * @returns {Promise<string>} id del documento creado
 */
export async function guardarProducto(producto) {
  const docRef = await addDoc(productosRef, producto);
  return docRef.id;
}

/**
 * Actualiza campos específicos de un producto existente.
 * @param {string} id
 * @param {Object} campos
 * @returns {Promise<void>}
 */
export async function actualizarProducto(id, campos) {
  const productoDoc = doc(db, "productos", id);
  await updateDoc(productoDoc, campos);
}

// -----------------------------
// Helpers: Descuento / cupón (input unificado "codigoDescuento")
// -----------------------------

/**
 * Valida un único código (código de descuento del admin o cupón de la
 * colección "cupones") contra Firestore.
 * @param {string} codigoInput
 * @param {{id: string, precio: number}} producto
 * @returns {Promise<{valid:boolean, codigo?:string, precioFinal?:number, montoDescontado?:number, reason?:string}>}
 */
export async function validarCodigoDescuento(codigoInput, producto) {
  const codigo = (codigoInput || "").trim().toUpperCase();
  if (!codigo) return { valid: false, reason: "EMPTY" };

  // 1) Código único de descuento (configuracion/descuento)
  const configSnap = await getDoc(doc(db, "configuracion", "descuento"));
  const cfg = configSnap.exists() ? configSnap.data() : {};
  const codigoGuardado = (cfg.codigo || "").trim().toUpperCase();
  const porcentaje = Number(cfg.porcentaje) || 0;
  const aplicaAlProducto = (cfg.productoId || "todos") === "todos" || cfg.productoId === producto.id;

  if (cfg.activo === true && codigoGuardado === codigo && porcentaje > 0 && aplicaAlProducto) {
    const precioFinal = Math.max(0, Math.round(producto.precio * (1 - porcentaje / 100)));
    return { valid: true, codigo: codigoGuardado, precioFinal };
  }

  // 2) Cupón (colección "cupones", doc ID = código en mayúsculas)
  const cuponSnap = await getDoc(doc(db, "cupones", codigo));
  if (!cuponSnap.exists()) return { valid: false, reason: "NOT_FOUND" };

  const c = cuponSnap.data();
  if (c.active === false) return { valid: false, reason: "INACTIVE" };
  if (c.validUntil && new Date(c.validUntil + "T23:59:59") < new Date()) {
    return { valid: false, reason: "EXPIRED" };
  }
  if ((c.usedCount || 0) >= c.usageLimit) return { valid: false, reason: "LIMIT" };
  if ((c.productoId || "todos") !== "todos" && c.productoId !== producto.id) {
    return { valid: false, reason: "NOT_APPLICABLE" };
  }

  let montoDescontado = c.discountType === "percentage" ? producto.precio * (c.value / 100) : c.value;
  montoDescontado = Math.min(montoDescontado, producto.precio);
  const precioFinal = Math.round((producto.precio - montoDescontado) * 100) / 100;

  return { valid: true, codigo, precioFinal, montoDescontado: Math.round(montoDescontado * 100) / 100 };
}

/**
 * Incrementa el contador de usos de un cupón aplicado.
 * @param {string} codigo
 */
export async function incrementarUsoCupon(codigo) {
  await updateDoc(doc(db, "cupones", codigo), { usedCount: increment(1) });
}

// -----------------------------
// Helpers: Clientes
// -----------------------------

/**
 * Obtiene todos los documentos de la colección 'clientes',
 * ordenados por fechaVencimiento de forma ascendente.
 * @returns {Promise<Array<Object>>}
 */
export async function obtenerClientes() {
  const q = query(clientesRef, orderBy("fechaVencimiento", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

/**
 * Guarda un nuevo cliente en la colección 'clientes'.
 * @param {Object} cliente
 * @returns {Promise<string>} id del documento creado
 */
export async function guardarCliente(cliente) {
  const docRef = await addDoc(clientesRef, cliente);
  return docRef.id;
}

/**
 * Actualiza el estado de pago de un cliente.
 * @param {string} id
 * @param {boolean} pagado
 * @returns {Promise<void>}
 */
export async function actualizarEstadoPago(id, pagado) {
  const clienteDoc = doc(db, "clientes", id);
  await updateDoc(clienteDoc, { pagado });
}
