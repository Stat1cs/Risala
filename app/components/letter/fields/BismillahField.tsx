/**
 * Bismillah field component
 */

import Image from "next/image";

interface BismillahFieldProps {
  show?: boolean;
}

export function BismillahField({ show = true }: BismillahFieldProps) {
  if (!show) return null;

  return (
    <div
      style={{
        textAlign: "center",
        marginBottom: "1rem",
        marginTop: "-0.5rem",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Image
        src="/Font/bismillah.svg"
        alt="بسم الله الرحمن الرحيم"
        className="bismillah-image"
        width={200}
        height={100}
        style={{
          maxWidth: "100%",
          height: "auto",
          maxHeight: "100px",
          objectFit: "contain",
        }}
        priority
      />
    </div>
  );
}
