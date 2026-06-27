import React from "react";
import { View } from "react-native";

/**
 * Neta to Nagarika bridge logo — reliable cross-platform approach:
 *  1. Draw a full white ring (circle with border)
 *  2. Cover the bottom portion with the background colour → only the top arch shows
 *  3. Place person dots exactly at the arch endpoints (computed with circle geometry)
 *
 * showFraction = how much of the circle height is visible (0.42 → flat bridge arch)
 */
export default function BridgeLogo({ size = 48 }: { size?: number }) {
  const bg      = "#0f1629";
  const borderW = Math.max(2, size * 0.058);
  const dotD    = size * 0.135;

  // The white ring sits centred in the logo circle
  const archD    = size * 0.70;          // diameter of the white ring
  const archR    = archD / 2;            // radius
  const archLeft = (size - archD) / 2;   // left edge of ring
  const archTop  = size * 0.12;          // top edge of ring

  // How much of the ring we reveal (< 0.5 → flatter than a semicircle)
  const showFraction = 0.42;
  const visibleH = archD * showFraction; // how tall the visible arch is

  // y of the cover (measured from top of logo)
  const coverY = archTop + visibleH;

  // Dot endpoints: where the ring edge crosses the cover line
  // Using circle geometry: x_offset = R * sqrt(1 − ((R − visibleH)/R)²)
  const fromCenter = archR - visibleH;            // signed dist from ring-centre to cover line
  const xOffset    = Math.sqrt(Math.max(0, archR * archR - fromCenter * fromCenter));

  const dotCenterX_L = size / 2 - xOffset;        // x centre of left dot
  const dotCenterX_R = size / 2 + xOffset;        // x centre of right dot
  const dotCenterY   = coverY;                     // y centre of both dots

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, overflow: "hidden" }}>

      {/* Full white ring */}
      <View style={{
        position: "absolute",
        top: archTop,
        left: archLeft,
        width: archD,
        height: archD,
        borderRadius: archR,
        borderWidth: borderW,
        borderColor: "#fff",
        backgroundColor: "transparent",
      }} />

      {/* Cover — hides the bottom part of the ring, leaving only the arch */}
      <View style={{
        position: "absolute",
        top: coverY,
        left: 0,
        width: size,
        height: size,          // tall enough to cover everything below
        backgroundColor: bg,
      }} />

      {/* Left person dot — rendered after cover so it appears on top */}
      <View style={{
        position: "absolute",
        top:  dotCenterY - dotD / 2,
        left: dotCenterX_L - dotD / 2,
        width: dotD,
        height: dotD,
        borderRadius: dotD / 2,
        backgroundColor: "#fff",
      }} />

      {/* Right person dot */}
      <View style={{
        position: "absolute",
        top:  dotCenterY - dotD / 2,
        left: dotCenterX_R - dotD / 2,
        width: dotD,
        height: dotD,
        borderRadius: dotD / 2,
        backgroundColor: "#fff",
      }} />

    </View>
  );
}
