import {
  updatesFaqStore,
  type FaqMarkdownEntry,
  type UpdateMarkdownEntry,
  type UpdatesFaqStore,
} from "../stores/updates-faq-store";

export interface FaqItem {
  id: string;
  title: string;
  content: string;
  defaultOpen: boolean;
}

export interface UpdateItem {
  id: string;
  title: string;
  date: string;
  image?: string;
  content: string;
}

export interface UpdatesFaqContent {
  faqItems: FaqItem[];
  updateItems: UpdateItem[];
}

function mapFaqEntries(entries: FaqMarkdownEntry[]): FaqItem[] {
  return [...entries]
    .sort((a, b) => a.order - b.order)
    .map((entry, index) => ({
      id: entry.id,
      title: entry.question,
      content: entry.content,
      defaultOpen: index === 0,
    }));
}

function mapUpdateEntries(entries: UpdateMarkdownEntry[]): UpdateItem[] {
  return [...entries]
    .sort((a, b) => {
      const aTimestamp = a.date ? Date.parse(a.date) : Number.NaN;
      const bTimestamp = b.date ? Date.parse(b.date) : Number.NaN;
      const safeA = Number.isNaN(aTimestamp) ? Number.NEGATIVE_INFINITY : aTimestamp;
      const safeB = Number.isNaN(bTimestamp) ? Number.NEGATIVE_INFINITY : bTimestamp;

      if (safeA !== safeB) {
        return safeB - safeA;
      }

      return a.order - b.order;
    })
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      date: entry.date,
      content: entry.content,
      ...(entry.image ? { image: entry.image } : {}),
    }));
}

export class UpdatesFaqService {
  constructor(private readonly store: UpdatesFaqStore = updatesFaqStore) {}

  async getContent(): Promise<UpdatesFaqContent> {
    const [faqEntries, updateEntries] = await Promise.all([
      this.store.readFaqEntries(),
      this.store.readUpdateEntries(),
    ]);

    return {
      faqItems: mapFaqEntries(faqEntries),
      updateItems: mapUpdateEntries(updateEntries),
    };
  }
}

export const updatesFaqService = new UpdatesFaqService();
