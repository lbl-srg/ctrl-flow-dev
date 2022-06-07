import { CSSProperties, Fragment, SyntheticEvent, useState } from "react";

function Debug({ item }: { item: object | [] }) {
  const [fullscreen, setFullscreen] = useState(false);

  let style: CSSProperties = {
    backgroundColor: "#333",
    fontFamily: "Monaco",
    color: "#efefef",
    padding: "1rem",
    lineHeight: "1.2rem",
    cursor: "pointer",
  };

  const containerStyle: CSSProperties = {
    backgroundColor: "#222",
    padding: "2rem",
  };

  if (fullscreen) {
    style = {
      ...style,
      position: "fixed",
      width: "100vw",
      height: "100vh",
      top: "0px",
      left: "0px",
      zIndex: 20,
    };
  }

  function log(ev: SyntheticEvent) {
    ev.stopPropagation();
    ev.preventDefault();
    console.dir(item);
  }

  return (
    <div style={containerStyle}>
      <pre onClick={() => setFullscreen(!fullscreen)} style={style}>
        {JSON.stringify(item, null, 2)}
      </pre>
      <a href="#" onClick={log}>
        Console Log
      </a>
    </div>
  );
}

export default Debug;
