// firebase.js
// SDK modular de Firebase v10 para la web

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// -----------------------------
// Configuración de Firebase
// -----------------------------
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

// -----------------------------
// Inicialización
// -----------------------------
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

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
