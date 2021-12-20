import Sidebarlayout from "../layouts/SidebarLayout";

// step 1
const Details = () => (
  <Sidebarlayout
    heading="Project Details"
    contentLeft={<p>hello</p>}
    contentRight={<p>world</p>}
  />
);

export default Details;
