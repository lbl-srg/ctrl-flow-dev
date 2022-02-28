import { ReactNode, MouseEvent, createRef } from "react";
import { useStore } from "../../store/store";
import StepNavigation from "../StepNavigation";

import "../../styles/components/sidebar-layout.scss";

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

  let isDragging = false;

  const stopDrag = () => (isDragging = false);
  const startDrag = () => (isDragging = true);

  function recordDrag(ev: MouseEvent): void {
    if (isDragging) {
      const $left = leftCol?.current;
      if ($left) $left.setAttribute("style", `width: ${ev.pageX}px`);
      const $right = rightCol?.current;
      if ($right)
        $right.setAttribute("style", `width: calc(100vw - ${ev.pageX}px);`);
    }
  }

  const leftCol = createRef<HTMLElement>();
  const rightCol = createRef<HTMLElement>();

  return (
    <main
      className="sidebar-layout"
      onMouseUp={stopDrag}
      onMouseMove={recordDrag}
    >
      <div className="col-container">
        <section className="left-col" ref={leftCol}>
          <header>
            All Projects &gt;
            <strong>{projectName}</strong>
          </header>

          {contentLeft}

          <div className="dragger" onMouseDown={startDrag}></div>
        </section>

        <section className="right-col" ref={rightCol}>
          <header>
            <h1>{heading}</h1>

            <span>
              <button className="small inline">Save</button>
            </span>
          </header>

          {contentRight}
        </section>
      </div>

      <StepNavigation />
    </main>
  );
};

export default Sidebarlayout;
