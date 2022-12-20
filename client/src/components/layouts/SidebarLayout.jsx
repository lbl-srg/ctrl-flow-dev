import { useState, useEffect } from "react";
import StepNavigation from "../StepNavigation";
import { isInViewPort, getAll, getPath } from "../../utils/dom-utils";
import "../../styles/components/sidebar-layout.scss";
import EditDetailsModal from "../modal/EditDetailsModal";
import { useLocation } from "react-router-dom";
import { useStores } from "../../data";
import { observer } from "mobx-react";

import itl from "../../translations";

const Sidebarlayout = observer(
  ({ contentLeft, contentRight, isFullScreen = true }) => {
    const { uiStore, projectStore } = useStores();
    const projectDetails = projectStore.getProjectDetails();

    const [isDragging, setIsDragging] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [leftPaneOpen, setLeftPaneOpen] = useState(true);
    const location = useLocation();

    useEffect(() => {
      const rightCol = document.querySelector(".right-col");
      if (rightCol?.scrollTo) rightCol.scrollTo(0, 0);
    }, [location]);

    function spy() {
      if (!uiStore.watchScroll) return;
      const [firstTpl] = getAll("[data-spy='template']").filter(isInViewPort);
      if (firstTpl) {
        uiStore.setActiveTemplatePath(getPath(firstTpl));
        const system = firstTpl.closest("[data-spy='system']");
        if (system) {
          const path = getPath(system);
          if (path) uiStore.setActiveSystemPath(path);
        }
      }
    }

    function recordDrag(ev) {
      if (isDragging) uiStore.setLeftColWidth(ev.pageX);
    }

    function toggle() {
      setLeftPaneOpen(!leftPaneOpen);
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
          {!isFullScreen && leftPaneOpen && (
            <section className="left-col">
              <EditDetailsModal
                isOpen={modalOpen}
                close={() => setModalOpen(false)}
                modalTitle=""
                submitText="Save"
                cancelText="Discard"
                afterSubmit={() => setModalOpen(false)}
              />

              <header>
                <div className="truncate">
                  Project &gt; &nbsp;
                  <strong>{"details"}</strong>
                </div>
                {modalOpen ? null : (
                  <button
                    className="small inline"
                    onClick={() => setModalOpen(true)}
                  >
                    {itl.terms.edit}
                  </button>
                )}
              </header>

              {modalOpen ? null : contentLeft}

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
              width:
                isFullScreen || !leftPaneOpen
                  ? "100vw"
                  : `calc(100vw - ${uiStore.leftColWidth}px)`,
            }}
          >
            <div
              className="left-pane-toggle"
              title="toggle left nav"
              onClick={toggle}
            >
              <i
                className={leftPaneOpen ? "icon-left-open" : "icon-right-open"}
              ></i>
            </div>
            {contentRight}
          </section>
        </div>

        {!isFullScreen && <StepNavigation />}
      </main>
    );
  },
);

export default Sidebarlayout;
