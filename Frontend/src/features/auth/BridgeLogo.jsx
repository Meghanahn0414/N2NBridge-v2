import React from "react";
import n2nLogo from "../../assets/images/n2n-bridge-logo.png";

export default function BridgeLogo({ size = 42 }) {
  return (
    <img
      src={n2nLogo}
      alt="N2N Bridge"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        display: "block",
        flexShrink: 0,
      }}
    />
  );
}
