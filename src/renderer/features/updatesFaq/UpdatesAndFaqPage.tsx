import { Tab } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Icon } from "@/utils/icons";
import Faq from "./components/Faq";
import Updates from "./components/Updates";
import {
  updatesFaqService,
  type FaqItem,
  type UpdateItem,
} from "@/services/updates-faq-service";

const tabNavigation = ["Updates", "FAQ"];

const UpdatesAndFaqPage = () => {
  const navigate = useNavigate();
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [updateItems, setUpdateItems] = useState<UpdateItem[]>([]);

  useEffect(() => {
    let active = true;

    const loadContent = async () => {
      const content = await updatesFaqService.getContent();
      if (!active) {
        return;
      }

      setFaqItems(content.faqItems);
      setUpdateItems(content.updateItems);
    };

    loadContent();

    return () => {
      active = false;
    };
  }, []);

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
          <div className="mb-4 h2 md:pr-16 md:h3">Updates & FAQ</div>
          <div className="mb-12 body1 text-n-4 md:mb-6">
            Features, fixes & improvements.
          </div>
          <Tab.Group defaultIndex={0}>
            <Tab.List className="mb-12 md:mb-6 space-x-3">
              {tabNavigation.map((button) => (
                <Tab
                  className="h-10 px-6 rounded-full base1 text-n-4 transition-colors outline-none tap-highlight-color hover:text-n-7 ui-selected:bg-primary-1 ui-selected:!text-n-1 dark:hover:text-n-1"
                  key={button}
                >
                  {button}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels>
              <Tab.Panel>
                <Updates items={updateItems} />
              </Tab.Panel>
              <Tab.Panel>
                <Faq items={faqItems} />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </Layout>
  );
};

export default UpdatesAndFaqPage;
