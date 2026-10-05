import { describe, expect, it } from "vitest";

import { createProductWhatsAppUrl } from "@/lib/utils/whatsapp";

describe("createProductWhatsAppUrl", () => {
  it("codifica el nombre del producto y usa HTTPS", () => {
    const url = new URL(
      createProductWhatsAppUrl({
        phoneNumber: "5491100000000",
        productName: "Top & Jean",
      }),
    );
    expect(url.protocol).toBe("https:");
    expect(url.hostname).toBe("wa.me");
    expect(url.searchParams.get("text")).toContain("Top & Jean");
  });

  it("falla de forma explícita si WhatsApp no está configurado", () => {
    expect(() =>
      createProductWhatsAppUrl({ phoneNumber: "", productName: "Jean" }),
    ).toThrow("El número de WhatsApp no está configurado.");
  });
});
