import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getBytes,
  ref,
  uploadBytes,
} from "firebase/storage";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

let testEnvironment: RulesTestEnvironment;

function productData(overrides: Record<string, unknown> = {}) {
  return {
    name: "Jean de prueba",
    slug: "jean-de-prueba",
    description: "Producto válido para probar las reglas.",
    price: 45000,
    category: "jeans",
    sizes: ["S", "M"],
    colors: ["Azul"],
    stockStatus: "available",
    images: [],
    isVisible: true,
    isFeatured: false,
    featuredOrder: 0,
    isNewArrival: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
}

async function seedProduct(
  id = "jean-de-prueba",
  overrides: Record<string, unknown> = {},
) {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), `products/${id}`),
      productData({ slug: id, ...overrides }),
    );
  });
}

function imageMetadata(productId: string) {
  return { contentType: "image/webp", customMetadata: { productId } };
}

beforeAll(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId: "kajuu-rules-test",
    firestore: { rules: readFileSync(resolve("firestore.rules"), "utf8") },
    storage: { rules: readFileSync(resolve("storage.rules"), "utf8") },
  });
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
  await testEnvironment.clearStorage();
});

afterAll(async () => testEnvironment.cleanup());

describe("reglas de Firestore", () => {
  it("permite leer productos visibles y bloquea los ocultos", async () => {
    await seedProduct("visible");
    await seedProduct("oculto", { isVisible: false });

    const publicDb = testEnvironment.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(publicDb, "products/visible")));
    await assertFails(getDoc(doc(publicDb, "products/oculto")));
    await assertSucceeds(
      getDocs(
        query(
          collection(publicDb, "products"),
          where("isVisible", "==", true),
        ),
      ),
    );
    await assertFails(getDocs(collection(publicDb, "products")));
  });

  it("bloquea todas las escrituras públicas y de cuentas sin claim admin", async () => {
    await seedProduct();
    const publicDb = testEnvironment.unauthenticatedContext().firestore();
    const regularDb = testEnvironment
      .authenticatedContext("regular-user")
      .firestore();

    for (const database of [publicDb, regularDb]) {
      await assertFails(
        setDoc(doc(database, "products/nuevo"), productData({ slug: "nuevo" })),
      );
      await assertFails(
        updateDoc(doc(database, "products/jean-de-prueba"), { price: 1 }),
      );
      await assertFails(deleteDoc(doc(database, "products/jean-de-prueba")));
    }
  });

  it("permite CRUD válido únicamente a una cuenta administradora", async () => {
    const adminDb = testEnvironment
      .authenticatedContext("admin-user", { admin: true })
      .firestore();
    const productRef = doc(adminDb, "products/jean-de-prueba");
    const validCreate = productData({
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await assertSucceeds(setDoc(productRef, validCreate));
    await assertSucceeds(
      updateDoc(productRef, {
        description: "Descripción actualizada de forma segura.",
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(deleteDoc(productRef));
  });

  it("rechaza ID distinto, campos extra y tipos anidados inválidos", async () => {
    const adminDb = testEnvironment
      .authenticatedContext("admin-user", { admin: true })
      .firestore();
    const validTimestamps = {
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await assertFails(
      setDoc(
        doc(adminDb, "products/id-distinto"),
        productData({ ...validTimestamps }),
      ),
    );
    await assertFails(
      setDoc(
        doc(adminDb, "products/con-campo-extra"),
        productData({
          ...validTimestamps,
          slug: "con-campo-extra",
          internalRole: "admin",
        }),
      ),
    );
    await assertFails(
      setDoc(
        doc(adminDb, "products/talle-invalido"),
        productData({
          ...validTimestamps,
          slug: "talle-invalido",
          sizes: [42],
        }),
      ),
    );
    await assertFails(
      setDoc(
        doc(adminDb, "products/imagen-invalida"),
        productData({
          ...validTimestamps,
          slug: "imagen-invalida",
          images: [
            {
              url: "http://inseguro.example/foto.webp",
              alt: "",
              position: 7,
            },
          ],
        }),
      ),
    );
  });

  it("impide el bypass por actualización y protege createdAt", async () => {
    await seedProduct();
    const adminDb = testEnvironment
      .authenticatedContext("admin-user", { admin: true })
      .firestore();
    const productRef = doc(adminDb, "products/jean-de-prueba");

    await assertFails(
      updateDoc(productRef, {
        description: "x".repeat(501),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(productRef, {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(productRef, {
        extraData: "schema-pollution",
        updatedAt: serverTimestamp(),
      }),
    );
  });
});

describe("reglas de Storage", () => {
  it("admite imágenes de administrador y lectura pública", async () => {
    const adminStorage = testEnvironment
      .authenticatedContext("admin-user", { admin: true })
      .storage();
    const imageRef = ref(adminStorage, "products/jean-de-prueba/foto.webp");
    await assertSucceeds(
      uploadBytes(
        imageRef,
        new Uint8Array([1, 2, 3]),
        imageMetadata("jean-de-prueba"),
      ),
    );

    const publicStorage = testEnvironment.unauthenticatedContext().storage();
    await assertSucceeds(
      getBytes(ref(publicStorage, "products/jean-de-prueba/foto.webp")),
    );
  });

  it("bloquea cargas y borrados públicos", async () => {
    const publicStorage = testEnvironment.unauthenticatedContext().storage();
    const imageRef = ref(publicStorage, "products/jean-de-prueba/foto.webp");

    await assertFails(
      uploadBytes(
        imageRef,
        new Uint8Array([1, 2, 3]),
        imageMetadata("jean-de-prueba"),
      ),
    );
    await assertFails(deleteObject(imageRef));
  });

  it("bloquea formatos, metadatos y rutas no permitidas", async () => {
    const adminStorage = testEnvironment
      .authenticatedContext("admin-user", { admin: true })
      .storage();

    await assertFails(
      uploadBytes(
        ref(adminStorage, "products/jean-de-prueba/data.txt"),
        new Uint8Array([1]),
        {
          contentType: "text/plain",
          customMetadata: { productId: "jean-de-prueba" },
        },
      ),
    );
    await assertFails(
      uploadBytes(
        ref(adminStorage, "products/jean-de-prueba/foto.webp"),
        new Uint8Array([1]),
        imageMetadata("otro-producto"),
      ),
    );
    await assertFails(
      uploadBytes(
        ref(adminStorage, "products/../foto.webp"),
        new Uint8Array([1]),
        imageMetadata(".."),
      ),
    );
  });

  it("bloquea archivos vacíos o de 5 MB y permite borrado admin", async () => {
    const adminStorage = testEnvironment
      .authenticatedContext("admin-user", { admin: true })
      .storage();
    const imageRef = ref(adminStorage, "products/jean-de-prueba/foto.webp");

    await assertFails(
      uploadBytes(
        imageRef,
        new Uint8Array(0),
        imageMetadata("jean-de-prueba"),
      ),
    );
    await assertFails(
      uploadBytes(
        imageRef,
        new Uint8Array(5 * 1024 * 1024),
        imageMetadata("jean-de-prueba"),
      ),
    );
    await assertSucceeds(
      uploadBytes(
        imageRef,
        new Uint8Array([1]),
        imageMetadata("jean-de-prueba"),
      ),
    );
    await assertSucceeds(deleteObject(imageRef));
  });
});
