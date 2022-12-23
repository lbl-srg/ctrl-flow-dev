import itl from "../translations";
import { useState } from "react";
import AboutModal from "./modal/AboutModal";
import SupportModal from "./modal/SupportModal";
import "../styles/components/page-header.scss"

export interface PageHeaderProps {
  headerText: string;
  showLogo?: boolean;
}

function PageHeader({ headerText, showLogo=false }: PageHeaderProps) {
  const [supportOpen, setSupportOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <header>
      {!showLogo && (
        <h1>{headerText}</h1>
      )}

      {showLogo && (
        <div className="logo-container">
          <img src="/4_BL_Horiz_Pos–rgb.png" />
        </div>
      )}

      <SupportModal
        isOpen={supportOpen}
        close={() => setSupportOpen(false)}
      />
      <AboutModal
        isOpen={aboutOpen}
        close={() => setAboutOpen(false)}
      />

      {/*<div className="save-widget">
        <span>{itl.formatString(itl.phrases.lastSaved, 4)}</span>
        <button className="small inline">{itl.terms.save}</button>
      </div>*/}

      <div className="action-menu">
        <button className="action-button" onClick={() => setSupportOpen(true)}>
          Support
        </button>
        <button className="action-button" onClick={() => setAboutOpen(true)}>
          About
        </button>
      </div>
    </header>
  );
}

export default PageHeader;
