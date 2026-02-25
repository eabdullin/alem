import FaqItem from "@/components/FaqItem";
import Image from "@/components/Image";
import type { FaqItem as FaqEntry } from "@/services/updates-faq-service";

type FaqProps = {
  items: FaqEntry[];
};

const Faq = ({ items }: FaqProps) => (
  <>
    <div>
      {items.length > 0 ? (
        items.map((item) => <FaqItem item={item} key={item.id} />)
      ) : (
        <div className="py-6 border-t border-n-3 base1 text-n-4 dark:border-n-6 whitespace-pre-wrap">
          No FAQ entries yet.
        </div>
      )}
    </div>
    <div className="mt-12 p-20 bg-n-2/50 rounded-[1.25rem] text-center md:py-16 md:px-8 dark:bg-n-7/50">
      <div className="w-28 mx-auto mb-8">
        <Image src="/images/faq-image.svg" width={112} height={112} alt="" />
      </div>
      <div className="mb-1 h5">Can&apos;t find an answer?</div>
      <div className="mb-8 base1 text-n-4">Let&apos;s ask the smartest AI Chat</div>
      <button className="btn-blue">Ask Alem</button>
    </div>
  </>
);

export default Faq;
