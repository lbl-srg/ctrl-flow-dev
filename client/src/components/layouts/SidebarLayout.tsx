import { ReactNode, MouseEvent, useState, UIEvent, useEffect } from "react";
import { useStore } from "../../store/store";
import StepNavigation from "../StepNavigation";
import { isInViewPort, getAll, getNumericId } from "../../utils/dom-utils";
import "../../styles/components/sidebar-layout.scss";
import EditDetailsModal from "../modal/EditDetailsModal";
import { useLocation } from "react-router-dom";
export interface SidebarLayoutProps {
  contentLeft: ReactNode;
  contentRight: ReactNode;
  isFullScreen?: boolean;
}

const MIN_WIDTH = 400;

function Sidebarlayout({
  contentLeft,
  contentRight,
  isFullScreen = true,
}: SidebarLayoutProps) {
  const {
    projectDetails,
    leftColWidth,
    setLeftColWidth,
    setActiveTemplateId,
    setActiveSystemId,
    watchScroll,
  } = useStore((state) => {
    return {
      ...state,
      projectDetails: state.getActiveProject()?.projectDetails,
    };
  });

  const projectName = projectDetails?.name;
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const $rightCol = document.querySelector(".right-col");
    if ($rightCol) $rightCol.scrollTo(0, 0);
  }, [location]);

  function spy() {
    if (!watchScroll) return;
    const [$firstTpl] = getAll("[data-spy='template']").filter(isInViewPort);
    if ($firstTpl) {
      setActiveTemplateId(getNumericId($firstTpl));
      const $system = $firstTpl.closest("[data-spy='system']");
      if ($system) {
        const id = getNumericId($system);
        if (id) setActiveSystemId(id);
      }
    }
  }

  function recordDrag(ev: MouseEvent): void {
    if (isDragging) {
      const desiredWidth = ev.pageX < MIN_WIDTH ? MIN_WIDTH : ev.pageX;
      setLeftColWidth(desiredWidth);
    }
  }

  const classes = ["sidebar-layout"];
  if (isDragging) classes.push("dragging");
  if (isFullScreen) classes.push("fullscreen");

  return (
    <main
      className={classes.join(" ")}
      onMouseUp={() => setIsDragging(false)}
      onMouseMove={recordDrag}
    >
      <div className="col-container">
        {!isFullScreen && (
          <section
            className="left-col"
            style={{ width: isFullScreen ? "100vw" : leftColWidth }}
          >
            <EditDetailsModal
              isOpen={modalOpen}
              close={() => setModalOpen(false)}
              initialState={projectDetails}
              modalTitle=""
              submitText="Save"
              cancelText="Discard"
              afterSubmit={() => setModalOpen(false)}
            />

            <header>
              <div className="truncate">
                All Projects &gt; &nbsp;
                <strong>{projectName}</strong>
              </div>
              {modalOpen ? null : (
                <button
                  className="small inline"
                  onClick={() => setModalOpen(true)}
                >
                  Edit
                </button>
              )}
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
          onScroll={spy}
          style={{
            width: isFullScreen ? "100vw" : `calc(100vw - ${leftColWidth}px)`,
          }}
        >
          {contentRight}
        </section>
      </div>

      {!isFullScreen && <StepNavigation />}
    </main>
  );
}

export default Sidebarlayout;
