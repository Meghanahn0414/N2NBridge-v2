import React from "react";
import { View, Image } from "react-native";

export default function BridgeLogo({ size = 48 }: { size?: number }) {
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      overflow: "hidden",
      backgroundColor: "#0f1629",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <Image
        source={require("../assets/images/n2n-logo.jpeg")}
        style={{ width: size * 1.52, height: size * 1.52 }}
        resizeMode="contain"
      />
    </View>
  );
}
