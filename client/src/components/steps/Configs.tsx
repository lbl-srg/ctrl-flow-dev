import { Fragment } from "react";
import Sidebarlayout from "../layouts/SidebarLayout";
import SlideOut from "../modal/ConfigSlideOut";

// step 3
const Configs = () => (
  <Sidebarlayout
    heading="Configurations"
    contentLeft={<p>hello</p>}
    contentRight={
      <Fragment>
        <p>world</p>
        <SlideOut />
      </Fragment>
    }
  />
);

export default Configs;
