/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, css } from "@emotion/react/macro";
import styled from "@emotion/styled/macro";
import { ReactNode } from "react";
import colors from "../../colors";
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
}: SidebarLayoutProps) => (
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
          All Projects{" >"} <strong>Foo Bar</strong>
        </ColumnHeader>
        {/* TODO: replace Foo Bar with a user input project name */}
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
        <div>{contentRight}</div>
      </RightColumn>
    </ColumnsWrapper>
    <StepNavigation />
  </section>
);

const ColumnsWrapper = styled.div`
  display: flex;
  height: 100%;
`;

const LeftColumn = styled.div`
  width: 28rem;
  height: 100%;
  background: ${colors.lightGrey};
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
