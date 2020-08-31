const gridShader = {
  vertexShader: `
    varying vec2 vUv;
    
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      vUv = uv;
    }
  `,
  fragmentShader: `
    uniform sampler2D uTexture;
    uniform vec2 uTextureFactor;
    varying vec2 vUv;

    // Calculate to maintain image aspect ratio
    vec2 centeredAspectRatio(vec2 uvs, vec2 factor){
      return uvs * factor - factor / 2. + 0.5;
    }

    void main() {
      gl_FragColor = texture2D(uTexture, centeredAspectRatio(vUv, uTextureFactor));
    }
  `,
};

export default gridShader;
