import React, { useRef, memo, useEffect } from "react";
import { extend, useThree, useFrame } from "react-three-fiber";
import { OrbitControls } from "./lib/OrbitControls";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as THREE from "three";
import { useGesture } from "react-use-gesture";
import useMainStore from "stores/main";

extend({ OrbitControls });

const CameraControls = (props) => {
  const { setGridNeedsUpdate } = useMainStore();
  const { camera, gl } = useThree();
  const controls = useRef();
  const mouseDownRef = useRef(false);

  const bindGestures = useGesture(
    {
      onMouseDown: (event) => {
        mouseDownRef.current = true;
        setGridNeedsUpdate(true);

        // Disabled pointer-events to prevent showing info box on hover
        document.querySelector(".main > div:first-child").style.pointerEvents =
          "none";

        controls.current.onMouseDown(event);
      },
      onMouseUp: (event) => {
        mouseDownRef.current = false;
        setGridNeedsUpdate(false);

        // Re-enable pointer-events
        document.querySelector(".main > div:first-child").style.pointerEvents =
          "auto";

        controls.current.onMouseUp(event);
      },
      onMouseMove: (event) => {
        if (mouseDownRef.current) {
          controls.current.onMouseMove(event);
        }
      },
    },
    {
      domTarget: window,
    }
  );

  useEffect(() => {
    // Remove all default listeners
    // By default, OrbitControls block other listeners, so we have to take a different approach
    // if we want to manage both the camera controls & other listeners
    controls.current.dispose();
    controls.current.update();

    // Bind our own listeners for custom control
    bindGestures();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => controls.current && controls.current.update());

  return (
    <orbitControls
      ref={controls}
      args={[camera, gl.domElement]}
      enableDamping
      dampingFactor={0.025}
      panSpeed={1.5}
      mouseButtons={{
        LEFT: THREE.MOUSE.PAN,
      }}
      touches={{
        ONE: THREE.TOUCH.PAN,
      }}
      {...props}
    />
  );
};

export default memo(CameraControls);
