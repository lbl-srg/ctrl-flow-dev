import { useState } from "react";
import { useStore } from "../../store/store";
import Sidebarlayout from "../layouts/SidebarLayout";
import EditDetailsModal from "../modal/EditDetailsModal";

const Details = () => (
  <Sidebarlayout
    heading="Project Details"
    contentLeft={<p>imagine a sidebar here</p>}
    contentRight={<ContentRight />}
  />
);

function ContentRight() {
  const [modalOpen, setModalOpen] = useState(false);
  const projectDetails = useStore((state) => state.projectDetails);

  const openModal = setModalOpen.bind(null, true);
  const closeModal = setModalOpen.bind(null, false);

  return (
    <div>
      <h2 className="flex-space-between">
        {projectDetails.name}
        <button className="outline small inline" onClick={openModal}>
          Edit Project Details
        </button>
      </h2>

      <EditDetailsModal
        initialState={projectDetails}
        modalTitle="Edit Project Details"
        submitText="Save Project Details"
        isOpen={modalOpen}
        afterSubmit={closeModal}
        close={closeModal}
      ></EditDetailsModal>

      <ul>
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
    </div>
  );
}

// const DetailsList = styled.ul`
//   list-style: none;

//   font-size: 1.2rem;

//   li {
//     margin-bottom: 1rem;

//     &:before {
//       content: "■";
//       color: ${colors.lightBlue};
//       margin-right: 1rem;
//     }
//   }
// `;

export default Details;
