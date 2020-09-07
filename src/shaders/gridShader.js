const gridShader = {
  vertexShader: `
    varying vec2 vUv;

    uniform vec2 uResolution;
    uniform vec2 uDistanceDiffFromCamera;
    uniform float uMouseDownProgress;

    #define PI 3.1415926535897932384626433832795

    void main() {
      vec3 distortedPosition = position;
      vec2 globalPosition = position.xy + uDistanceDiffFromCamera;

      if (uMouseDownProgress > 0.0) {
        distortedPosition.x = position.x + pow(abs(clamp(globalPosition.y, -10.0, 10.0) * clamp(globalPosition.x, -1.0, 1.0)), 2.0) * 0.015 * sign(globalPosition.x) * uMouseDownProgress;
        distortedPosition.y = position.y + globalPosition.y * 0.025 * uMouseDownProgress;
      } 
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(distortedPosition, 1.0);
      vUv = uv;
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    
    uniform sampler2D uTexture;
    uniform vec2 uTextureFactor;
    uniform float uMouseDownProgress;
    uniform float uBrightness;

    // Calculate to maintain image aspect ratio
    vec2 centeredAspectRatio(vec2 uvs, vec2 factor){
      return uvs * factor - factor / 2. + 0.5;
    }

    // Function used to get the distortion effect
    vec2 computeUV (vec2 uv, float k, float kcube) {
      vec2 t = uv - 0.5;
      float r2 = t.x * t.x + t.y * t.y;
      float f = 0.0;
      if (kcube == 0.0) {
        f = 1.0 + r2 * k;
      } else {
        f = 1.0 + r2 * (k + kcube * sqrt(r2));
      }
      vec2 nUv = f * t + 0.5;
      return nUv;
    }

    void main() {
      vec2 centeredUv = centeredAspectRatio(vUv, uTextureFactor);

      // Settings for the effect
      // Multiplied by uMouseDownProgress, a value between 0 and 1
      float k = -0.5 * uMouseDownProgress;
      float kcube = 0.5 * uMouseDownProgress;
      float offset = 0.02 * uMouseDownProgress;
      
      // Get each channel's color using the texture provided
      // and the computeUV function
      float red = texture2D(uTexture, computeUV(centeredUv, k + offset, kcube)).r;
      float green = texture2D(uTexture, computeUV(centeredUv, k, kcube)).g;
      float blue = texture2D(uTexture, computeUV(centeredUv, k - offset, kcube)).b;

      gl_FragColor = vec4(vec3(red, green, blue) * uBrightness, 1.0);
    }
  `,
};

export default gridShader;
