import itl from "../translations";

function PageHeader({ headerText }) {
  return (
    <header>
      <h1>{headerText}</h1>

      <div className="save-widget">
        <span>{itl.formatString(itl.phrases.lastSaved, 4)}</span>
        <button className="small inline">{itl.terms.save}</button>
      </div>
    </header>
  );
}

export default PageHeader;
