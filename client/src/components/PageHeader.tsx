export interface PageHeaderProps {
  headerText: string;
}

function PageHeader({ headerText }: PageHeaderProps) {
  return (
    <header>
      <h1>{headerText}</h1>

      <div className="save-widget">
        <span>last saved 4 hours ago</span>
        <button className="small inline">Save</button>
      </div>
    </header>
  );
}

export default PageHeader;
