import Image from "@/components/Image";
import type { UpdateItem } from "@/services/updates-faq-service";

type UpdatesProps = {
  items: UpdateItem[];
};

const Updates = ({ items }: UpdatesProps) => {
  if (items.length === 0) {
    return (
      <div className="py-6 border-t border-n-3 base1 text-n-4 dark:border-n-6 whitespace-pre-wrap">
        No updates yet.
      </div>
    );
  }

  return (
    <div>
      {items.map((item) => (
        <div
          className="flex py-16 border-t border-n-3 lg:block md:py-8 dark:border-n-5"
          key={item.id}
        >
          <div className="shrink-0 w-[21rem] pr-20 2xl:w-72 2xl:pr-12 lg:w-full lg:mb-10 lg:pr-0">
            <div className="mb-5 h6">{item.title}</div>
            {item.date && (
              <div className="base1 font-semibold text-n-4/50">{item.date}</div>
            )}
          </div>
          <div className="grow">
            {item.image && (
              <div className="w-full max-w-[38rem]">
                <Image
                  className="w-full max-h-[22rem] rounded-3xl md:rounded-xl object-cover"
                  src={item.image}
                  width={600}
                  height={400}
                  alt={item.title}
                />
              </div>
            )}
            <div className={`base1 text-n-4 whitespace-pre-wrap ${item.image ? "mt-8" : ""}`}>
              {item.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Updates;
