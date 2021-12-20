/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, css } from "@emotion/react/macro";

import Button, { ButtonProps } from "../Button";

// step 0
const Landing = () => (
  <section
    css={css`
      padding: 2rem;
      max-width: 80rem;
      margin-left: auto;
      margin-right: auto;
    `}
  >
    <header>
      <h1>Welcome to Lawrence Berkley National Labs</h1>
      <h2>HVAC Controls Design Tool</h2>
    </header>
    <div
      css={css`
        padding: 2rem;
        background: #eee;
        border-radius: 0.5rem;
        display: flex;
      `}
    >
      <div
        css={css`
          width: 50%;
        `}
      >
        <h1>HVAC Controls Design Tool</h1>
        <p>
          The controls design tool allows you to model the complete HVAC system
          for your buildings project. Simply select the system components,
          configure those systems, create relationshops, and then export the
          final model into the open source Modelica language for siumulation and
          control.
        </p>
      </div>
      <ul
        css={css`
          width: 50%;
          font-weight: bold;
          list-style-type: none;
          line-height: 2rem;
        `}
      >
        <li>Select components</li>
        <li>Configure systems</li>
        <li>Create system relationships</li>
      </ul>
    </div>
    <div
      css={css`
        display: flex;
      `}
    >
      <LandingButton>Create New Project</LandingButton>
      <LandingButton>Upload Existing Project</LandingButton>
    </div>
  </section>
);

const LandingButton = (props: ButtonProps) => (
  <Button
    css={css`
      flex-grow: 1;
      font-size: 1.1rem;
      line-height: 3rem;
    `}
    type="outline"
    {...props}
  />
);

export default Landing;
