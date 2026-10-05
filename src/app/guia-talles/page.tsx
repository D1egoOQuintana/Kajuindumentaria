import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Footer } from "@/components/layout/footer";
import { PublicHeader } from "@/components/layout/public-header";
import { WhatsAppCTA } from "@/components/product/whatsapp-cta";

export const metadata: Metadata = {
  title: "Guía de talles",
  description:
    "Aprende a tomar tus medidas y consulta el calce de cada prenda KAJÚ antes de comprar.",
  alternates: { canonical: "/guia-talles" },
};

const measurements = [
  {
    number: "01",
    title: "Contorno de busto",
    description:
      "Rodea la parte de mayor volumen con la cinta paralela al piso, sin ajustar de más.",
  },
  {
    number: "02",
    title: "Contorno de cintura",
    description:
      "Mide la zona más angosta del torso con una postura natural y respiración relajada.",
  },
  {
    number: "03",
    title: "Contorno de cadera",
    description:
      "Rodea la parte más amplia de la cadera manteniendo la cinta recta y sin comprimir.",
  },
] as const;

export default function SizeGuidePage() {
  return (
    <div className="min-h-screen bg-[var(--background-primary)] text-[var(--text-primary)]">
      <PublicHeader />

      <main>
        <header className="border-b border-[var(--border)] pt-32 pb-16 md:pt-40 md:pb-20">
          <Container className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="label-caps mb-5 text-[var(--brand)]">
                Guía de talles · KAJÚ
              </p>
              <h1 className="editorial-title text-[clamp(3.25rem,10vw,6rem)] leading-[0.98]">
                El mejor talle empieza con una buena medida.
              </h1>
            </div>
            <div className="lg:col-span-5">
              <p className="text-base leading-8 text-[var(--text-secondary)]">
                Cada modelo puede tener un calce diferente. Toma tus medidas,
                revisa las variantes indicadas en la ficha y consúltanos antes
                de comprar si estás entre dos talles.
              </p>
            </div>
          </Container>
        </header>

        <section aria-labelledby="measure-title" className="py-16 md:py-24">
          <Container>
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <p className="label-caps text-[var(--brand)]">Cómo medirte</p>
                <h2 className="editorial-heading mt-3 text-4xl" id="measure-title">
                  Tres referencias simples.
                </h2>
                <p className="mt-5 max-w-md leading-7 text-[var(--text-secondary)]">
                  Usa una cinta métrica flexible sobre ropa liviana. Si puedes,
                  pide ayuda para mantenerla paralela al piso.
                </p>
              </div>

              <ol className="grid gap-px border border-[var(--border)] bg-[var(--border)] md:grid-cols-3">
                {measurements.map((measurement) => (
                  <li className="bg-[var(--background-primary)] p-6 md:p-8" key={measurement.number}>
                    <span className="label-caps text-[var(--brand)]">
                      {measurement.number}
                    </span>
                    <h3 className="editorial-heading mt-8 text-2xl">
                      {measurement.title}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                      {measurement.description}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </Container>
        </section>

        <Container className="pb-20 md:pb-28">
          <section className="grid gap-8 bg-[var(--text-primary)] p-7 text-white md:p-12 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="label-caps text-[#e8d6c0]">Asesoramiento personal</p>
              <h2 className="editorial-heading mt-3 text-3xl md:text-4xl">
                ¿Tienes dudas con un modelo?
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-white/75">
                Envíanos el nombre de la prenda y tus medidas. Te ayudamos a
                revisar el calce disponible antes de coordinar la compra.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <WhatsAppCTA label="Consultar mi talle" variant="inverse" />
              <Link className="button border border-white/40 text-white" href="/catalogo">
                Ver catálogo
              </Link>
            </div>
          </section>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
