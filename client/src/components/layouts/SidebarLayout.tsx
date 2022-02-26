import { ReactNode } from "react";
import { useStore } from "../../store/store";
import StepNavigation from "../StepNavigation";

import "../../css/sidebar-layout.css";

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
    <main className="sidebar-layout">
      <div className="col-container">
        <section className="left-col">
          <header>
            <h2>
              All Projects
              <i className="icon-open-right" />
              <strong>{projectName}</strong>
            </h2>
          </header>

          <div>{contentLeft}</div>
        </section>

        <section className="right-col">
          <header>
            <h1>{heading}</h1>
          </header>
          <div>{contentRight}</div>
        </section>
      </div>

      <StepNavigation />
    </main>
  );
};

export default Sidebarlayout;
