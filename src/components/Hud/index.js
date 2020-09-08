import React from "react";
import styled from "styled-components";
import LogoImg from "img/logo.svg";
const Logo = styled.img`
  height: 32px;
  width: 32px;
  position: fixed;
  top: 0;
  left: 0;
  margin-top: 2rem;
  margin-left: 2rem;
  mix-blend-mode: difference;

  @media screen only and (max-width: 767px) {
    margin-top: 1rem;
    margin-left: 1rem;
  }
`;

const Tooltip = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  margin-top: 2rem;
  margin-right: 2rem;
  color: #ffffff;
  mix-blend-mode: difference;

  @media screen only and (max-width: 767px) {
    margin-top: 1rem;
    margin-right: 1rem;
  }
`;

const Hud = () => {
  return (
    <div className="hud-container">
      <Logo src={LogoImg} />
      <Tooltip>Drag to explore!</Tooltip>
    </div>
  );
};

export default Hud;
