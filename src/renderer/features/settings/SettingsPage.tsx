import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import Settings from "@/components/Settings";
import { Icon } from "@/utils/icons";
import { settings } from "@/constants/settings";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const section = searchParams.get("section");
  const activeItem =
    section && settings.some((s) => s.id === section)
      ? settings.findIndex((s) => s.id === section)
      : 0;

  return (
    <Layout hideRightSidebar>
      <div className="p-20 2xl:px-10 md:pt-6 md:px-6 md:pb-10">
        <button
          className="hidden absolute top-6 right-6 w-10 h-10 border-2 border-n-4/25 rounded-full text-0 transition-colors hover:border-transparent hover:bg-n-4/25 md:block"
          onClick={() => navigate(-1)}
        >
          <Icon className="stroke-n-4" name="close" />
        </button>
        <div className="max-w-[58.5rem] mx-auto">
          <div className="mb-4 h2 md:pr-16 md:h3">Settings</div>
          <div className="mb-12 body1 text-n-4 md:mb-6">
            Configure your preferences and AI providers.
          </div>
          <Settings items={settings} activeItem={activeItem} />
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
