/** @jsxImportSource @emotion/react */
import React from "react";
import { jsx, css } from "@emotion/react/macro";

import Button from "./components/button";

function App() {
  return (
    <div
      css={css`
        padding: 2rem;
      `}
    >
      <header>
        <h1>Welcome to Lawrence Berkley National Labs</h1>
        <h2>HVAC Controls Design Tool</h2>
      </header>
      <div
        css={css`
          padding: 1rem;
          background: #eee;
          border-radius: 0.5rem;
          display: flex;
        `}
      >
        <div>
          <h1>HVAC Controls Design Tool</h1>
          <p>
            The controls design tool allows you to model the complete HVAC
            system for your buildings project.
          </p>
        </div>
        <ul>
          <li>Select components</li>
          <li>Configure systems</li>
          <li>Create system relationships</li>
        </ul>
      </div>
      <Button>Create New Project</Button>
      <Button>Upload Existing Project</Button>
    </div>
  );
}

export default App;
