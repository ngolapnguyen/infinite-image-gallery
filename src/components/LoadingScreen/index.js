import React, { useEffect } from "react";
import styled from "styled-components";
import { useSpring, animated } from "react-spring";
import useMainStore from "stores/main";

const Container = styled(animated.div)`
  position: fixed;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #111111;
  display: flex;
`;

const Loader = styled(animated.div)`
  margin: auto;
  background: #222222;
  border-radius: 50%;
  animation: zoomInOut 2s infinite cubic-bezier(0.65, 0, 0.35, 1);

  @keyframes zoomInOut {
    0% {
      height: 48px;
      width: 48px;
    }

    50% {
      height: 64px;
      width: 64px;
    }

    100% {
      height: 48px;
      width: 48px;
    }
  }
`;

const LoadingScreen = () => {
  const { dataLoaded } = useMainStore();
  const [containerSpring, setContainerSpring] = useSpring(() => ({
    opacity: 1,
  }));

  useEffect(() => {
    if (dataLoaded) {
      setTimeout(() => {
        setContainerSpring({ opacity: 0, pointerEvents: "none" });
      }, 500);
    }
  }, [dataLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Container style={containerSpring}>
      <Loader />
    </Container>
  );
};

export default LoadingScreen;
