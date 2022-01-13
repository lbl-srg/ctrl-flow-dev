/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, css } from "@emotion/react/macro";
import styled from "@emotion/styled/macro";
import { ReactNode } from "react";
import { useStore } from "../../store/store";
import { colors } from "../../styleHelpers";
import StepNavigation, { FOOTER_NAV_HEIGHT } from "../StepNavigation";

export interface SidebarLayoutProps {
  heading: string;
  contentLeft: ReactNode;
  contentRight: ReactNode;
}

const Sidebarlayout = ({
  heading,
  contentLeft,
  contentRight,
}: SidebarLayoutProps) => {
  const projectName = useStore((state) => state.projectDetails.name);

  return (
    <section
      css={css`
        height: calc(100% - ${FOOTER_NAV_HEIGHT});
      `}
    >
      <ColumnsWrapper>
        <LeftColumn>
          <ColumnHeader
            css={css`
              background: ${colors.darkBlue};
              color: ${colors.white};
              padding: 0 2rem;
            `}
          >
            All Projects{" >"} <strong>{projectName}</strong>
          </ColumnHeader>
          <div
            css={css`
              padding: 0 2rem;
            `}
          >
            {contentLeft}
          </div>
        </LeftColumn>
        <RightColumn>
          <ColumnHeader
            css={css`
              border-bottom: 1px solid ${colors.mediumGrey};
            `}
          >
            <h1
              css={css`
                color: ${colors.darkGrey};
                margin: 0;
              `}
            >
              {heading}
            </h1>
          </ColumnHeader>
          <div
            css={css`
              position: relative;
            `}
          >
            {contentRight}
          </div>
        </RightColumn>
      </ColumnsWrapper>
      <StepNavigation />
    </section>
  );
};

const ColumnsWrapper = styled.div`
  display: flex;
  height: 100%;
`;

const LeftColumn = styled.div`
  width: 28rem;
  height: 100%;
  background: ${colors.lightGrey};
  flex-shrink: 0;
`;

const RightColumn = styled.div`
  flex-grow: 1;
  height: 100%;
  padding: 0 3rem;
`;

const ColumnHeader = styled.div`
  height: 5rem;
  line-height: 5rem;
  margin: 0;
`;

export default Sidebarlayout;
