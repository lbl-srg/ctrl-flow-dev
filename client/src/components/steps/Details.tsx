/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, css } from "@emotion/react/macro";
import styled from "@emotion/styled";
import { Fragment } from "react";
import { useStore } from "../../store/store";
import { colors } from "../../styleHelpers";
import Sidebarlayout from "../layouts/SidebarLayout";
import EditDetailsModal from "../modal/EditDetailsModal";

const Details = () => (
  <Sidebarlayout
    heading="Project Details"
    contentLeft={<p>imagine a sidebar here</p>}
    contentRight={<ContentRight />}
  />
);

const ContentRight = () => {
  const projectDetails = useStore((state) => state.projectDetails);

  return (
    <Fragment>
      <h2>{projectDetails.name}</h2>
      {/* <EditDetailsModal
        initialState={projectDetails}
        modalTitle="Edit Project Details"
        submitText="Save Project Details"
        variant="outline"
        css={css`
          position: absolute;
          right: 0;
          top: 0;
        `}
      >
        Edit Project Details
      </EditDetailsModal> */}
      <DetailsList>
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
          <p
            css={css`
              margin: 0 0 0 2rem;
            `}
          >
            {projectDetails.notes}
          </p>
        </li>
      </DetailsList>
    </Fragment>
  );
};

const DetailsList = styled.ul`
  list-style: none;

  font-size: 1.2rem;

  li {
    margin-bottom: 1rem;

    &:before {
      content: "■";
      color: ${colors.lightBlue};
      margin-right: 1rem;
    }
  }
`;

export default Details;
