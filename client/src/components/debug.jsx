import { useState } from "react";

function Debug({ item }) {
  const [fullscreen, setFullscreen] = useState(false);

  let style = {
    backgroundColor: "#333",
    fontFamily: "Monaco",
    color: "#efefef",
    padding: "1rem",
    lineHeight: "1.2rem",
    cursor: "pointer",
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

  return (
    <pre onClick={() => setFullscreen(!fullscreen)} style={style}>
      {JSON.stringify(item, null, 2)}
    </pre>
  );
}

export default Debug;
