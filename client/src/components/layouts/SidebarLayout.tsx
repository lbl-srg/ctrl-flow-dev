import { ReactNode, useState, SyntheticEvent } from "react";
import { useStore } from "../../store/store";
import StepNavigation from "../StepNavigation";

import "../../css/components/sidebar-layout.css";

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

  const [isDragging, setIsDragging] = useState(false);
  const startDrag = setIsDragging.bind(null, true);
  const stopDrag = setIsDragging.bind(null, false);

  function recordDrag(ev: MouseEvent) {
    if (isDragging) {
      console.log(ev.pageX);
    }
  }

  return (
    <main className="sidebar-layout">
      <div className="col-container">
        <section className="left-col">
          <header>
            All Projects &gt;
            <strong>{projectName}</strong>
          </header>

          {contentLeft}

          <div
            className="dragger"
            onMouseDown={startDrag}
            onMouseMove={recordDrag}
            onMouseUp={stopDrag}
          ></div>
        </section>

        <section className="right-col">
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
