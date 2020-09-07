import React, { useRef, useState, useEffect, useMemo } from "react";
import { animated } from "react-spring/three";
import { Html } from "drei";

const GridItem = React.forwardRef(({ data, position }, ref) => {
  const internalRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const onPointerOver = () => setIsHovered(true);
  const onPointerOut = () => setIsHovered(false);

  useEffect(() => {
    if (isHovered) {
      internalRef.current.material.uniforms.uBrightness.value = 0.6;
    } else {
      internalRef.current.material.uniforms.uBrightness.value = 1;
    }
  }, [isHovered]);

  const infoBoxRender = useMemo(
    () => (
      <Html center>
        <div className="info-box">
          <p className="info-box__title">{data.title}</p>
          <p className="info-box__desc">{data.description}</p>
        </div>
      </Html>
    ),
    []
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
