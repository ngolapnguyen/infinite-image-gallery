import React, { useEffect } from "react";
import { Canvas } from "react-three-fiber";
import CursorFollower from "components/CursorFollower";
import Grid from "components/Grid";
import useMainStore from "stores/main";
import CameraControls from "components/CameraControls";

export const Z_OFFSET = 5;

function App() {
  const { dataLoaded, loadData } = useMainStore();

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="main">
      <Canvas
        camera={{
          position: [0, 0, Z_OFFSET],
        }}
        gl={{
          alpha: true,
        }}
      >
        {dataLoaded && <Grid />}
        <gridHelper
          args={[999, 999, 0x222222, 0x222222]}
          rotation={[Math.PI * 0.5, 0, 0]}
        />
        <CameraControls />
      </Canvas>
      <CursorFollower />
    </div>
  );
}

export default App;
