import React, { useRef, useState, useEffect } from "react";
import styled from "styled-components";
import { useTrail, animated } from "react-spring";
import { useGesture } from "react-use-gesture";

const CIRCLE_SIZE = 48;
const DOT_SIZE = 8;

const Follower = styled(animated.div)`
  position: absolute;
  border-radius: 50%;
  left: 0;
  top: 0;
  pointer-events: none;
`;

const CircleFollower = styled(({ mouseDown, ...rest }) => (
  <Follower {...rest} />
))`
  border: 2px solid rgba(255, 255, 255, 0.5);
  transition: width 0.2s, height 0.2s;

  ${(props) =>
    props.mouseDown
      ? `
        width: ${CIRCLE_SIZE / 1.5}px;
        height: ${CIRCLE_SIZE / 1.5}px;
      `
      : `
        width: ${CIRCLE_SIZE}px;
        height: ${CIRCLE_SIZE}px;
      `}
`;

const DotFollower = styled(Follower)`
  background: #ffffff;
  width: ${DOT_SIZE}px;
  height: ${DOT_SIZE}px;
`;

const circleConfig = { mass: 5, tension: 800, friction: 100 };
const transform = (x, y) =>
  `translate3d(${x}px, ${y}px, 0) translate3d(-50%,-50%, 0)`;

const CursorFollower = () => {
  const [mouseDown, setMouseDown] = useState(false);
  const dotRef = useRef(null);
  const [circleTrail, setCircleTrail] = useTrail(1, () => ({
    xy: [0, 0],
    config: circleConfig,
  }));

  const updateDotPos = (x, y) => {
    dotRef.current.style.transform = transform(x, y);
  };

  const bindGestures = useGesture(
    {
      onMouseMove: (event) => {
        setCircleTrail({ xy: [event.clientX, event.clientY] });
        updateDotPos(event.clientX, event.clientY);
      },
      onMouseDown: () => setMouseDown(true),
      onMouseUp: () => setMouseDown(false),
    },
    {
      domTarget: window,
    }
  );

  useEffect(() => {
    bindGestures();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <CircleFollower
        mouseDown={mouseDown}
        style={{ transform: circleTrail[0].xy.interpolate(transform) }}
      />
      <DotFollower ref={dotRef} />
    </>
  );
};

export default CursorFollower;
