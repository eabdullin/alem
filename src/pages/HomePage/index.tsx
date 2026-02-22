import { useState } from "react";
import Layout from "@/components/Layout";
import Main from "./Main";

const HomePage = () => {
  const [hideRightSidebar, setHideRightSidebar] = useState(true);

  return (
    <Layout
      hideRightSidebar={hideRightSidebar}
      onToggleRightSidebar={() => setHideRightSidebar((prev) => !prev)}
    >
      <Main />
    </Layout>
  );
};

export default HomePage;
