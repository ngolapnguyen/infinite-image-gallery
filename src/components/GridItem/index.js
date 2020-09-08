import React, { useRef, useState, useMemo } from "react";
import { animated } from "react-spring/three";
import { Html } from "drei";
import { useSpring } from "react-spring";

const GridItem = React.forwardRef(({ data, position }, ref) => {
  const internalRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  useSpring({
    brightness: isHovered ? 0.6 : 1,
    onFrame: ({ brightness }) => {
      internalRef.current.material.uniforms.uBrightness.value = brightness;
    },
  });

  const onPointerOver = () => setIsHovered(true);
  const onPointerOut = () => setIsHovered(false);

  const infoBoxRender = useMemo(
    () => (
      <Html center>
        <div className="info-box">
          <p className="info-box__title">{data.title}</p>
          <p className="info-box__desc">{data.description}</p>
        </div>
      </Html>
    ),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <animated.mesh
      {...data}
      ref={(meshRef) => {
        internalRef.current = meshRef;
        ref && ref(meshRef);
      }}
      position={position}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {isHovered && infoBoxRender}
    </animated.mesh>
  );
});

export default React.memo(GridItem);
