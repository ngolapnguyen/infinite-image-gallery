import React, { useMemo } from "react";
import * as THREE from "three";
import { GRID_COLUMN_WIDTH, GRID_ITEM_PADDING } from "components/Grid";
import gridShader from "shaders/gridShader";
import { useLoader } from "react-three-fiber";
import { getTextureFactor } from "utils";

const GridItem = React.forwardRef(({ data, position }, ref) => {
  const texture = useLoader(THREE.TextureLoader, [data.image]);
  const textureFactor = useMemo(() => {
    if (texture[0]?.image) {
      return getTextureFactor(
        (GRID_COLUMN_WIDTH - GRID_ITEM_PADDING) /
          (data.height - GRID_ITEM_PADDING),
        texture[0]
      );
    }
  }, [texture, data.height]);

  if (!data) {
    return null;
  }

  const uniforms = {
    uTexture: {
      type: "t",
      value: undefined,
    },
    uTextureFactor: {
      type: "f",
      value: undefined,
    },
  };

  return (
    <mesh ref={ref} position={position}>
      <planeBufferGeometry
        attach="geometry"
        args={[
          GRID_COLUMN_WIDTH - GRID_ITEM_PADDING,
          data.height - GRID_ITEM_PADDING,
          100,
          100,
        ]}
      />
      <shaderMaterial
        attach="material"
        uniforms={uniforms}
        uniforms-uTexture-value={texture[0]}
        uniforms-uTextureFactor-value={textureFactor}
        vertexShader={gridShader.vertexShader}
        fragmentShader={gridShader.fragmentShader}
      />
    </mesh>
  );
});

export default React.memo(GridItem);
