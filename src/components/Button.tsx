/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, css } from "@emotion/react/macro";
import styled from "@emotion/styled";
import React, { AnchorHTMLAttributes } from "react";

import colors from "../colors";

const BaseButton = styled.button`
  display: inline-block;
  border-radius: 9999rem;
  padding: 1rem;
  margin: 1rem 1rem 1rem 0;
  font-weight: bold;
  text-transform: uppercase;
`;

const variantStyles = {
  filled: css`
    background: ${colors.mediumBlue};
    color: ${colors.white};
  `,
  outline: css`
    color: ${colors.mediumBlue};
    background: transparent;
    border: 1px solid ${colors.mediumBlue};
  `,
  link: css``,
};

export interface ButtonProps extends AnchorHTMLAttributes<any> {
  children: React.ReactNode;
  type?: "filled" | "outline" | "link";
}

const Button = ({ type = "filled", ...props }: ButtonProps) => (
  <BaseButton css={variantStyles[type]} {...props} />
);

export default Button;
