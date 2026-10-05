import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { BotanicalBloom } from "@/components/brand/botanical-bloom";
import { Container } from "@/components/layout/container";
import { Footer } from "@/components/layout/footer";
import { PublicHeader } from "@/components/layout/public-header";
import { WhatsAppCTA } from "@/components/product/whatsapp-cta";

export const metadata: Metadata = {
  title: "Lookbook",
  description:
    "Inspiración KAJÚ para combinar jeans y prendas urbanas con una mirada femenina, cálida y actual.",
  alternates: { canonical: "/lookbook" },
};

const looks = [
  {
    image: "/brand/campaign/kaju-jeans-hero-v2.webp",
    alt: "Look urbano KAJÚ con jean de calce relajado",
    index: "01",
    title: "Denim de todos los días",
    description:
      "Un calce cómodo, una prenda protagonista y capas simples para recorrer la ciudad.",
  },
  {
    image: "/brand/campaign/kaju-jeans-oxford.webp",
    alt: "Look KAJÚ con jean oxford",
    index: "02",
    title: "Silueta oxford",
    description:
      "Líneas largas y proporciones equilibradas para un look femenino con presencia.",
  },
  {
    image: "/brand/campaign/kaju-jeans-cargo.webp",
    alt: "Look KAJÚ con jean cargo urbano",
    index: "03",
    title: "Cargo contemporáneo",
    description:
      "Volumen, textura y funcionalidad en una combinación urbana fácil de llevar.",
  },
] as const;

export default function LookbookPage() {
  return (
    <div className="min-h-screen bg-[var(--background-primary)] text-[var(--text-primary)]">
      <PublicHeader />

      <main>
        <header className="relative isolate overflow-hidden border-b border-[var(--border)] pt-32 pb-16 md:pt-40 md:pb-24">
          <BotanicalBloom
            className="absolute -right-20 top-16 -z-10 h-[28rem] w-[28rem] opacity-20"
            motion="breathe"
            variant="cluster"
          />
          <Container className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="label-caps mb-5 text-[var(--brand)]">
                Lookbook · Curaduría KAJÚ
              </p>
              <h1 className="editorial-title max-w-4xl text-[clamp(3.25rem,10vw,7rem)] leading-[0.95]">
                Ideas para vestir la ciudad a tu manera.
              </h1>
            </div>
            <p className="max-w-lg text-base leading-8 text-[var(--text-secondary)] lg:col-span-4">
              Tres siluetas de denim, combinadas desde una mirada práctica y
              femenina. Usa estas referencias como punto de partida y consulta
              por las prendas disponibles.
            </p>
          </Container>
        </header>

        <section aria-labelledby="lookbook-selection" className="py-16 md:py-24">
          <Container>
            <h2 className="sr-only" id="lookbook-selection">
              Selección de looks KAJÚ
            </h2>
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
              {looks.map((look, index) => (
                <article
                  className={[
                    "group",
                    index === 0
                      ? "lg:col-span-5"
                      : index === 1
                        ? "lg:col-span-3 lg:pt-28"
                        : "lg:col-span-4 lg:pt-12",
                  ].join(" ")}
                  key={look.title}
                >
                  <div className="relative aspect-[4/5] overflow-hidden border border-[var(--border)] bg-[var(--surface-emphasis)]">
                    <Image
                      alt={look.alt}
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                      fill
                      priority={index === 0}
                      sizes="(max-width: 1023px) 100vw, 40vw"
                      src={look.image}
                    />
                  </div>
                  <div className="mt-5 border-t border-[var(--border)] pt-4">
                    <p className="label-caps text-[var(--brand)]">
                      {look.index} · Inspiración
                    </p>
                    <h3 className="editorial-heading mt-2 text-3xl">
                      {look.title}
                    </h3>
                    <p className="mt-3 max-w-md text-sm leading-7 text-[var(--text-secondary)]">
                      {look.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <Container className="pb-20 md:pb-28">
          <section className="grid gap-8 border border-[var(--border)] bg-[var(--surface-emphasis)] p-7 md:p-12 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="label-caps text-[var(--brand)]">Tu próximo look</p>
              <h2 className="editorial-heading mt-3 text-3xl md:text-4xl">
                Encuentra el calce que mejor te acompaña.
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-[var(--text-secondary)]">
                Recorre el catálogo o escríbenos para recibir ayuda con talles,
                colores y disponibilidad.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link className="button button--primary" href="/catalogo?categoria=jeans">
                Ver jeans disponibles
              </Link>
              <WhatsAppCTA label="Consultar por WhatsApp" variant="secondary" />
            </div>
          </section>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
