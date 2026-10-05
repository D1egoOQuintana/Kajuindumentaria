import Image from "next/image";

type BrandLogoVariant =
  | "horizontal"
  | "horizontal-inverse"
  | "primary";

type BrandLogoProps = {
  alt?: string;
  className?: string;
  priority?: boolean;
  variant: BrandLogoVariant;
};

const logoAssets: Record<
  BrandLogoVariant,
  { height: number; src: string; width: number }
> = {
  horizontal: {
    height: 941,
    src: "/brand/Logo horizontal sin fondo.png",
    width: 1672,
  },
  "horizontal-inverse": {
    height: 1254,
    src: "/brand/logo-horizontal-inverse.png",
    width: 1254,
  },
  primary: {
    height: 1086,
    src: "/brand/Logo sin fondo.png",
    width: 1448,
  },
};

export function BrandLogo({
  alt = "Logo oficial de KAJÚ Indumentaria",
  className,
  priority = false,
  variant,
}: BrandLogoProps) {
  const asset = logoAssets[variant];

  return (
    <span
      className={["brand-logo", `brand-logo--${variant}`, className]
        .filter(Boolean)
        .join(" ")}
    >
      <Image
        alt={alt}
        className="brand-logo__image"
        height={asset.height}
        priority={priority}
        sizes={
          variant.includes("horizontal")
            ? "200px"
            : "220px"
        }
        src={asset.src}
        width={asset.width}
      />
    </span>
  );
}
