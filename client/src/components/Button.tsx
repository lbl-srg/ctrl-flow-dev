/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, css } from "@emotion/react/macro";
import styled from "@emotion/styled";
import { ReactNode, ButtonHTMLAttributes } from "react";
import { Link, LinkProps } from "react-router-dom";

import { colors } from "../styleHelpers";

const BaseButton = styled.button`
  display: inline-block;
  border-radius: 9999rem;
  padding: 0.75rem 1.5rem;
  font-size: 1.1rem;
  font-weight: bold;
  text-transform: uppercase;
  cursor: pointer;
  border: none;

  &:hover {
    filter: brightness(0.75);
  }
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
  text: css`
    color: ${colors.mediumBlue};
    background: transparent;
  `,
};

export interface ButtonProps extends ButtonHTMLAttributes<unknown> {
  children?: ReactNode;
  variant?: "filled" | "outline" | "text";
}

const Button = ({ variant = "filled", ...props }: ButtonProps) => (
  <BaseButton css={variantStyles[variant]} {...props} />
);

export const TextButton = ({
  variant = "text",
  ...props
}: ButtonProps) => (
  <BaseButton
    css={[
      variantStyles[variant]
    ]}
    {...props}
  />
)

export const LinkButton = ({
  variant = "filled",
  ...props
}: ButtonProps & LinkProps) => (
  <BaseButton
    as={Link}
    css={[
      variantStyles[variant],
      css`
        text-decoration: none;
      `,
    ]}
    {...props}
  />
);

export default Button;
