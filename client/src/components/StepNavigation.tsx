/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, css } from "@emotion/react/macro";
import styled from "@emotion/styled/macro";
import { Link, useMatch } from "react-router-dom";

import { colors, dropShadow } from "../styleHelpers";
import Button, { LinkButton } from "./Button";

export const FOOTER_NAV_HEIGHT = "5rem";

const steps = [
  "Landing",
  "Details",
  "Systems",
  "Configs",
  "Quantities",
  "Schedules",
  "Results",
];

const StepNavigation = () => {
  return (
    <NavContainer>
      <NavItemContainer>
        <BackButton />
      </NavItemContainer>

      <JumpNav />

      <NavItemContainer
        css={css`
          text-align: right;
        `}
      >
        <NextButton />
      </NavItemContainer>
    </NavContainer>
  );
};

const BackButton = () => {
  const currentStep = useCurrentStep();

  return (
    <LinkButton variant="text" to={getStepPath(currentStep - 1)}>
      ← Back {currentStep - 1 > 0 && `to ${steps[currentStep - 1]}`}
    </LinkButton>
  );
};

const NextButton = () => {
  const currentStep = useCurrentStep();

  if (currentStep + 1 > 6) {
    return (
      <Button
        variant="filled"
        onClick={() => alert("A download modal should pop up.")}
      >
        Download full project
      </Button>
    );
  }

  return (
    <LinkButton to={getStepPath(currentStep + 1)} variant="filled">
      Next Step: {steps[currentStep + 1]}
    </LinkButton>
  );
};

const JumpNav = () => {
  const currentStep = useCurrentStep();
  const displaySteps = steps.slice(1);

  return (
    <NavItemContainer
      css={css`
        min-width: ${displaySteps.length * 7}rem;
      `}
    >
      <JumpNavContainer>
        {displaySteps.map((stepName) => {
          const stepIndex = steps.indexOf(stepName);
          return (
            <Link
              css={css`
                display: inline-block;
                text-align: center;
                width: 7rem;
                height: 3.5rem;
                flex-shrink: 0;
                color: ${colors.black};
                font-weight: bold;
                text-decoration: none;
              `}
              key={stepName}
              to={getStepPath(stepIndex)}
            >
              <Circle
                css={
                  stepIndex <= currentStep &&
                  css`
                    background: ${stepIndex == currentStep
                      ? colors.black
                      : colors.lightBlue};
                  `
                }
              />
              {stepName}
            </Link>
          );
        })}
      </JumpNavContainer>
      <CircleConnector />
    </NavItemContainer>
  );
};

/**
 * Accepts a step number and returns a correspoding URL
 * @param step the step number you are on. This will match an index in the `steps` constant
 * @returns the path that will take you to the correct step
 */
const getStepPath = (step: number) => {
  if (step > 0 && step <= 6) {
    return `/${steps[step].toLowerCase()}`;
  }

  return "/";
};

/**
 * Custom hook that checks the current path and returns the corresponding step number
 * @returns the step number you are on. This will match an index in the `steps` constant
 */
const useCurrentStep = () => {
  for (const key in steps) {
    if (useMatch(steps[key])) {
      return parseInt(key);
    }
  }

  // if no match is found, assume we're on the landing page
  return 0;
};

const JumpNavContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CircleConnector = styled.div`
  margin: 0 4rem;
  width: calc(100% - 8rem);
  height: 4px;
  background: ${colors.black};
  position: relative;
  top: -3rem;
`;

const Circle = styled.div`
  margin: 0.1rem auto 0.5rem auto;
  height: 0.8rem;
  width: 0.8rem;
  border-radius: 50%;
  background: ${colors.white};
  border: 2px solid ${colors.white};
  outline: 2px solid ${colors.black};
  position: relative;
  z-index: 1;
`;

const NavContainer = styled.nav`
  width: 100%;
  height: ${FOOTER_NAV_HEIGHT};
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  ${dropShadow}
`;

const NavItemContainer = styled.div`
  max-width: 33%;
  padding: 0 2rem;
`;

export default StepNavigation;
