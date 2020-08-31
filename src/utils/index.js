import * as THREE from "three";

// Clamp the value in a given domain
export const clamp = (value, min, max) => {
  return Math.min(max, Math.max(value, min));
};

// Calculate texture factor to maintain the image ratio
export const getTextureFactor = (planeRatio, texture) => {
  let factorX = 1;
  let factorY = 1;

  if (texture) {
    const textureRatio = texture.image.width / texture.image.height;

    if (planeRatio > textureRatio) {
      factorY = textureRatio / planeRatio;
    } else {
      factorX = planeRatio / textureRatio;
    }
  }

  return new THREE.Vector2(factorX, factorY);
};
