import { ReactNode, MouseEvent, useState } from "react";
import { useStore } from "../../store/store";
import StepNavigation from "../StepNavigation";

import "../../styles/components/sidebar-layout.scss";

export interface SidebarLayoutProps {
  heading: string;
  contentLeft: ReactNode;
  contentRight: ReactNode;
}

const STORAGE_KEY = "sideBarWidth";

const Sidebarlayout = ({
  heading,
  contentLeft,
  contentRight,
}: SidebarLayoutProps) => {
  const projectName = useStore((state) => state.projectDetails.name);
  const fromStore = localStorage.getItem(STORAGE_KEY);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [width, setWidth] = useState<number>(
    fromStore ? parseInt(fromStore) : 400,
  );

  function recordDrag(ev: MouseEvent): void {
    if (isDragging) {
      setWidth(ev.pageX);
      localStorage.setItem(STORAGE_KEY, `${ev.pageX}`);
    }
  }

  return (
    <main
      className={isDragging ? "sidebar-layout dragging" : "sidebar-layout"}
      onMouseUp={() => setIsDragging(false)}
      onMouseMove={recordDrag}
    >
      <div className="col-container">
        <section className="left-col" style={{ width }}>
          <header>
            All Projects &gt;
            <strong>{projectName}</strong>
          </header>

          {contentLeft}

          <div
            className="dragger"
            onMouseDown={() => setIsDragging(true)}
          ></div>
        </section>

        <section
          className="right-col"
          style={{ width: `calc(100vw - ${width}px)` }}
        >
          <header>
            <h1>{heading}</h1>

            <div className="save-widget">
              <span>last saved 4 hours ago</span>
              <button className="small inline">Save</button>
            </div>
          </header>

          {contentRight}
        </section>
      </div>

      <StepNavigation />
    </main>
  );
};

export default Sidebarlayout;
