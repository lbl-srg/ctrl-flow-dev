/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, css } from "@emotion/react/macro";
import { useStore } from "../../store/store";

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
        gap: 2rem;
        margin-top: 5rem;
      `}
    >
      <CreateNewButton />
      <UploadButton />
    </div>
  </section>
);

const BaseButton = (props: ButtonProps) => (
  <Button
    css={css`
      flex-grow: 1;
      line-height: 3rem;
    `}
    type="outline"
    {...props}
  />
);

/**
 * TODO: the following two functions currently have the same onClick. They are seperated out like this because eventually,
 * they need to do different things before incrementing a step
 */

const CreateNewButton = () => {
  const incrementStep = useStore((state) => state.incementStep);
  return <BaseButton onClick={incrementStep}>Create New Project</BaseButton>;
};

const UploadButton = () => {
  const incrementStep = useStore((state) => state.incementStep);
  return (
    <BaseButton onClick={incrementStep}>Upload Existing Project</BaseButton>
  );
};

export default Landing;
