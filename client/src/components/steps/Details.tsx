import { Fragment, useState } from "react";
import { useStore } from "../../store/store";
import EditDetailsModal from "../modal/EditDetailsModal";
import PageHeader from "../PageHeader";

function Details() {
  const projectDetails = useStore(
    (state) => state.getActiveProject()?.projectDetails || {},
  );

  const [isOpen, setIsOpen] = useState(false);

  return (
    <Fragment>
      <PageHeader headerText="Project Details" />

      <h2 className="flex-space-between">
        {projectDetails.name}

        <button
          className="outline small inline"
          onClick={() => setIsOpen(true)}
        >
          Edit Details
        </button>
      </h2>

      <EditDetailsModal
        isOpen={isOpen}
        close={() => setIsOpen(false)}
        initialState={projectDetails}
        modalTitle="Edit Project Details"
        submitText="Save Project Details"
      />

      <ul className="styled-ul">
        <li>
          <strong>Address: </strong>
          {projectDetails.address}
        </li>

        <li>
          <strong>Type: </strong>
          {projectDetails.type}
        </li>

        <li>
          <strong>Size: </strong>
          {projectDetails.size}
        </li>

        <li>
          <strong>Units: </strong>
          {projectDetails.units}
        </li>

        <li>
          <strong>Energy Code: </strong>
          {projectDetails.code}
        </li>

        <li>
          <strong>Notes:</strong>
          <p>{projectDetails.notes}</p>
        </li>
      </ul>
    </Fragment>
  );
}

export default Details;
