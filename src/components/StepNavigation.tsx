/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, css } from "@emotion/react/macro";
import styled from "@emotion/styled/macro";
import { colors, dropShadow } from "../styleHelpers";
import { useStore } from "../store/store";
import Button from "./Button";

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
  const { currentStep, incrementStep, decrementStep, jumpToStep } = useStore(
    (state) => ({
      currentStep: state.currentStep,
      incrementStep: state.incrementStep,
      decrementStep: state.decrementStep,
      jumpToStep: state.jumpToStep,
    }),
  );

  return (
    <NavContainer>
      <NavItemContainer>
        <BackButton currentStep={currentStep} action={decrementStep} />
      </NavItemContainer>

      <JumpNav currentStep={currentStep} action={jumpToStep} />

      <NavItemContainer
        css={css`
          text-align: right;
        `}
      >
        <NextButton currentStep={currentStep} action={incrementStep} />
      </NavItemContainer>
    </NavContainer>
  );
};

interface NavButtonProps {
  currentStep: number;
  action: () => void;
}

const BackButton = ({ currentStep, action }: NavButtonProps) => (
  <Button variant="link" onClick={action}>
    ← Back {currentStep - 1 > 0 && `to ${steps[currentStep - 1]}`}
  </Button>
);

const NextButton = ({ currentStep, action }: NavButtonProps) => {
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
    <Button variant="filled" onClick={action}>
      Next Step: {steps[currentStep + 1]}
    </Button>
  );
};

interface JumpNavProps {
  currentStep: number;
  action: (step: number) => void;
}

const JumpNav = ({ currentStep, action }: JumpNavProps) => {
  const displaySteps = steps.slice(1);
  return (
    <NavItemContainer
      css={css`
        width: ${displaySteps.length * 7}rem;
      `}
    >
      <JumpNavContainer>
        {displaySteps.map((stepName) => {
          const stepIndex = steps.indexOf(stepName);
          return (
            <a
              css={css`
                display: inline-block;
                text-align: center;
                width: 7rem;
                height: 3.5rem;
                cursor: pointer;
                flex-shrink: 0;
              `}
              key={stepName}
              onClick={() => action(stepIndex)}
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
            </a>
          );
        })}
      </JumpNavContainer>
      <CircleConnector />
    </NavItemContainer>
  );
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
  padding: 0 2rem;
`;

export default StepNavigation;
