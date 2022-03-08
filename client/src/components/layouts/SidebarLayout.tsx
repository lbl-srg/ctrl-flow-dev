import { ReactNode, MouseEvent, useState } from "react";
import { useStore } from "../../store/store";
import StepNavigation from "../StepNavigation";

import "../../styles/components/sidebar-layout.scss";

export interface SidebarLayoutProps {
  contentLeft: ReactNode;
  contentRight: ReactNode;
  isFullScreen?: boolean;
}

const MIN_WIDTH = 300;

const Sidebarlayout = ({
  contentLeft,
  contentRight,
  isFullScreen = true,
}: SidebarLayoutProps) => {
  const { projectDetails, leftColWidth, setLeftColWidth } = useStore(
    (state) => {
      return {
        leftColWidth: state.leftColWidth,
        setLeftColWidth: state.setLeftColWidth,
        projectDetails: state.getActiveProject()?.projectDetails,
      };
    },
  );

  const projectName = projectDetails?.name;
  const [isDragging, setIsDragging] = useState<boolean>(false);

  function recordDrag(ev: MouseEvent): void {
    if (isDragging) {
      const desiredWidth = ev.pageX < MIN_WIDTH ? MIN_WIDTH : ev.pageX;
      setLeftColWidth(desiredWidth);
    }
  }

  return (
    <main
      className={isDragging ? "sidebar-layout dragging" : "sidebar-layout"}
      onMouseUp={() => setIsDragging(false)}
      onMouseMove={recordDrag}
    >
      <div className="col-container">
        {!isFullScreen && (
          <section className="left-col" style={{ width: leftColWidth }}>
            <header>
              All Projects &gt; &nbsp;
              <strong>{projectName}</strong>
            </header>

            {contentLeft}

            <div
              className="dragger"
              onMouseDown={() => setIsDragging(true)}
            ></div>
          </section>
        )}

        <section
          className="right-col"
          style={{ width: `calc(100vw - ${leftColWidth}px)` }}
        >
          {contentRight}
        </section>
      </div>

      {!isFullScreen && <StepNavigation />}
    </main>
  );
};

export default Sidebarlayout;
