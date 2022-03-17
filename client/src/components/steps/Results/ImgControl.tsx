import schematic from "./schematics-example.png";
import { Fragment } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

function ImgControl() {
  return (
    <div className="drag-container">
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
