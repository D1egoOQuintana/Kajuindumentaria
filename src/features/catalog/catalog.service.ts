import "server-only";

import type { Query, QuerySnapshot } from "firebase-admin/firestore";
import { unstable_cache } from "next/cache";

import { mockProducts } from "@/features/catalog/mock-products";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { productSchema } from "@/lib/validators/product.schema";
import type { Product, ProductCategory } from "@/types/product";

const MAX_PUBLIC_PRODUCTS = 200;
const MAX_FEATURED_PRODUCTS = 24;
const CACHE_OPTIONS = { revalidate: 60, tags: ["products"] };

function canUseLocalCatalog(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.KAJUU_USE_MOCK_CATALOG === "true"
  );
}

function getDevelopmentProducts(): Product[] {
  return mockProducts
    .filter((product) => product.isVisible)
    .sort(
      (first, second) =>
        second.createdAt.getTime() - first.createdAt.getTime(),
    );
}

function parseSnapshot(snapshot: QuerySnapshot): Product[] {
  return snapshot.docs.flatMap((document) => {
    const result = productSchema.safeParse({
      id: document.id,
      ...document.data(),
    });
    return result.success ? [result.data] : [];
  });
}

async function executeCatalogQuery(
  label: string,
  query: Query,
  developmentFallback: () => Product[],
): Promise<Product[]> {
  try {
    return parseSnapshot(await query.get());
  } catch (error) {
    if (canUseLocalCatalog()) {
      console.warn(
        `No se pudo cargar ${label} desde Firestore. Se usará el catálogo local habilitado explícitamente.`,
        error,
      );
      return developmentFallback();
    }
    throw new Error(`No se pudo cargar ${label}.`, { cause: error });
  }
}

function requirePublicProductsCollection() {
  if (!isFirebaseAdminConfigured()) {
    if (canUseLocalCatalog()) return null;
    throw new Error(
      "Firebase Admin no está configurado para servir el catálogo de producción.",
    );
  }
  return getAdminDb().collection("products");
}

async function loadVisibleProducts(): Promise<Product[]> {
  const products = requirePublicProductsCollection();
  if (!products) return getDevelopmentProducts();

  return executeCatalogQuery(
    "el catálogo",
    products
      .where("isVisible", "==", true)
      .orderBy("createdAt", "desc")
      .limit(MAX_PUBLIC_PRODUCTS),
    getDevelopmentProducts,
  );
}

async function loadFeaturedProducts(): Promise<Product[]> {
  const products = requirePublicProductsCollection();
  const fallback = () =>
    getDevelopmentProducts()
      .filter((product) => product.isFeatured)
      .sort(
        (first, second) =>
          (first.featuredOrder ?? 0) - (second.featuredOrder ?? 0),
      );
  if (!products) return fallback();

  return (
    await executeCatalogQuery(
      "los productos destacados",
      products
        .where("isVisible", "==", true)
        .where("isFeatured", "==", true)
        .limit(MAX_FEATURED_PRODUCTS),
      fallback,
    )
  ).sort(
    (first, second) =>
      (first.featuredOrder ?? 0) - (second.featuredOrder ?? 0),
  );
}

async function loadNewArrivalProducts(): Promise<Product[]> {
  const products = requirePublicProductsCollection();
  const fallback = () =>
    getDevelopmentProducts().filter((product) => product.isNewArrival);
  if (!products) return fallback();

  return executeCatalogQuery(
    "los últimos ingresos",
    products
      .where("isVisible", "==", true)
      .where("isNewArrival", "==", true)
      .orderBy("createdAt", "desc")
      .limit(MAX_PUBLIC_PRODUCTS),
    fallback,
  );
}

async function loadProductsByCategory(
  category: ProductCategory,
): Promise<Product[]> {
  const products = requirePublicProductsCollection();
  const fallback = () =>
    getDevelopmentProducts().filter(
      (product) => product.category === category,
    );
  if (!products) return fallback();

  return executeCatalogQuery(
    `la categoría ${category}`,
    products
      .where("isVisible", "==", true)
      .where("category", "==", category)
      .orderBy("createdAt", "desc")
      .limit(MAX_PUBLIC_PRODUCTS),
    fallback,
  );
}

async function loadProductBySlug(slug: string): Promise<Product | undefined> {
  const products = requirePublicProductsCollection();
  if (!products) {
    return getDevelopmentProducts().find((product) => product.slug === slug);
  }

  try {
    const snapshot = await products.doc(slug).get();
    if (!snapshot.exists || snapshot.data()?.isVisible !== true) return undefined;

    const result = productSchema.safeParse({
      id: snapshot.id,
      ...snapshot.data(),
    });
    return result.success ? result.data : undefined;
  } catch (error) {
    if (canUseLocalCatalog()) {
      console.warn(
        "No se pudo cargar el producto desde Firestore. Se usará el catálogo local habilitado explícitamente.",
        error,
      );
      return getDevelopmentProducts().find((product) => product.slug === slug);
    }
    throw new Error("No se pudo cargar el producto.", { cause: error });
  }
}

const getCachedVisibleProducts = unstable_cache(
  loadVisibleProducts,
  ["public-visible-products-v3"],
  CACHE_OPTIONS,
);

const getCachedFeaturedProducts = unstable_cache(
  loadFeaturedProducts,
  ["public-featured-products-v3"],
  CACHE_OPTIONS,
);

const getCachedNewArrivalProducts = unstable_cache(
  loadNewArrivalProducts,
  ["public-new-arrival-products-v3"],
  CACHE_OPTIONS,
);

const getCachedProductsByCategory = unstable_cache(
  loadProductsByCategory,
  ["public-products-by-category-v3"],
  CACHE_OPTIONS,
);

const getCachedProductBySlug = unstable_cache(
  loadProductBySlug,
  ["public-product-by-slug-v3"],
  CACHE_OPTIONS,
);

export async function getVisibleProducts(): Promise<Product[]> {
  return getCachedVisibleProducts();
}

export async function getFeaturedProducts(): Promise<Product[]> {
  return getCachedFeaturedProducts();
}

export async function getNewArrivalProducts(): Promise<Product[]> {
  return getCachedNewArrivalProducts();
}

export async function getProductsByCategory(
  category: ProductCategory,
): Promise<Product[]> {
  return getCachedProductsByCategory(category);
}

export async function getProductBySlug(
  slug: string,
): Promise<Product | undefined> {
  return getCachedProductBySlug(slug);
}
