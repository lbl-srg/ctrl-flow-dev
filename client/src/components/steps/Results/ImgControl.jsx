import schematic from "./schematics-example.png";
import { Fragment, useEffect, useState, createRef } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

function ImgControl() {
  const $root = createRef();

  const [height, setHeight] = useState(0);

  useEffect(() => {
    function calcHeight() {
      const $el = $root.current;
      if (!$el) return;
      const top = $el.getBoundingClientRect().top || 0;
      setHeight(window.innerHeight - top - 80);
    }

    window.addEventListener("resize", calcHeight);
    calcHeight();

    return () => {
      window.removeEventListener("resize", calcHeight);
    };
  });

  return (
    <div
      ref={$root}
      style={{ height: `${height}px` }}
      className="drag-container"
    >
      <TransformWrapper
        initialScale={1}
        initialPositionX={0}
        initialPositionY={0}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <Fragment>
            <div className="controls">
              <button onClick={() => zoomIn()}>
                <i className="icon-zoom-in" />
              </button>
              <button onClick={() => zoomOut()}>
                <i className="icon-zoom-out" />
              </button>
              <button onClick={() => resetTransform()}>
                <i className="icon-refresh" />
              </button>
            </div>
            <TransformComponent>
              <img src={schematic} alt="test" />
            </TransformComponent>
          </Fragment>
        )}
      </TransformWrapper>
    </div>
  );
}

export default ImgControl;
