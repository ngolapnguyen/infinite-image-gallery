import React, { useRef, memo, useEffect } from "react";
import { extend, useThree, useFrame } from "react-three-fiber";
import { OrbitControls } from "./lib/OrbitControls";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as THREE from "three";
import { useGesture } from "react-use-gesture";
import useMainStore from "stores/main";
import { useSpring } from "react-spring/three";
import { Z_OFFSET } from "App";

extend({ OrbitControls });

const CameraControls = (props) => {
  const { dataLoaded, setGridNeedsUpdate } = useMainStore();
  const { camera, gl } = useThree();
  const controls = useRef();
  const mouseDownRef = useRef(false);

  useSpring({
    cameraZOffset: dataLoaded ? Z_OFFSET : Z_OFFSET + 5,
    cameraYOffset: dataLoaded ? 0 : Z_OFFSET - 2,
    onFrame: ({ cameraZOffset, cameraYOffset }) => {
      if (cameraZOffset !== Z_OFFSET) {
        camera.position.z = cameraZOffset;
      }

      if (cameraYOffset !== 0) {
        camera.position.y = cameraYOffset;
      }

      if (cameraZOffset === Z_OFFSET && cameraYOffset === 0) {
        // Remove all default listeners
        // By default, OrbitControls block other listeners, so we have to take a different approach
        // if we want to manage both the camera controls & other listeners
        controls.current.dispose();
        controls.current.update();
      }
    },
  });

  const bindGestures = useGesture(
    {
      onMouseDown: (event) => {
        mouseDownRef.current = true;
        setGridNeedsUpdate(true);

        // Disabled pointer-events to prevent showing info box on hover
        document.querySelector(".main > div:first-child").style.pointerEvents =
          "none";

        controls.current.onMouseDown(event);
        controls.current.dispose();
        controls.current.update();
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
    // Bind our own listeners for custom control
    bindGestures();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    controls.current && controls.current.update();
  });

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
