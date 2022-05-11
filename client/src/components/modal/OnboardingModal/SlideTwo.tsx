import { Fragment } from "react";

function SlideTwo() {
  return (
    <Fragment>
      <h1>Enter Project Details</h1>

      <p>Create new project</p>

      <ul>
        <li>
          Notes field for any info needed including client info, additional
          codes, ect...
        </li>
        <li>
          After this page, edit project details from the edit button on the top
          of the lefthand sidebar
        </li>
      </ul>

      <div className="center">
        <img width="772" height="904" src="/onboarding/edit-project.png" />
      </div>
    </Fragment>
  );
}

export default SlideTwo;
