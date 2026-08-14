import { ComponentPropsWithoutRef } from "react";

type BrandLogoProps = Omit<ComponentPropsWithoutRef<"img">, "src" | "alt"> & {
  label?: string;
};

/** Logo gốc của quán, dùng thống nhất ở mọi điểm nhận diện trong app. */
export const BrandLogo = ({
  className,
  label = "Chalo Coffee",
  ...props
}: BrandLogoProps) => (
  <span className={`brand-logo-frame ${className ?? ""}`}>
    <img
      src="/brand/chalo-logo.jpg"
      alt={label}
      className="brand-logo-art"
      {...props}
    />
  </span>
);
