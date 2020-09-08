import React, { useEffect, useState } from "react";
import { Canvas } from "react-three-fiber";
import CursorFollower from "components/CursorFollower";
import Grid from "components/Grid";
import useMainStore from "stores/main";
import CameraControls from "components/CameraControls";
import LoadingScreen from "components/LoadingScreen";
import Hud from "components/Hud";

export const Z_OFFSET = 5;

function App() {
  const { dataLoaded, loadData } = useMainStore();
  const [showGrid, setShowGrid] = useState(false);

  useEffect(() => {
    if (dataLoaded) {
      setTimeout(() => {
        setShowGrid(true);
      }, 1000);
    }
  }, [dataLoaded]);

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
        {showGrid && (
          <gridHelper
            args={[999, 999, 0x222222, 0x222222]}
            rotation={[Math.PI * 0.5, 0, 0]}
          />
        )}
        {dataLoaded && <Grid />}
        <CameraControls />
      </Canvas>
      <CursorFollower />
      <Hud />
      <LoadingScreen />
    </div>
  );
}

export default App;
