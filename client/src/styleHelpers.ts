import { css } from "@emotion/react";

export const colors = {
  white: "rgb(255, 255, 255)",
  lightGrey: css`rgb(248 ,248, 248)`,
  mediumGrey: "rgb(171, 175, 177)",
  darkGrey: "rgb(109, 109, 109)",
  black: "rgb(0, 0, 0)",
  extraLightBlue: "rgb(236, 245, 249)",
  lightBlue: "rgb(165, 202, 217)",
  mediumBlue: "rgb(0, 148, 184)",
  darkBlue: "rgb(6, 34, 44)",
};

export const dropShadow = css`
  box-shadow: 0px 0px 15px 5px rgba(0, 0, 0, 0.1),
    0px 0px 10px -5px rgba(0, 0, 0, 0.4);
`;

export const fonts = css`
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
    "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
`;
