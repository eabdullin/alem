export interface FaqMarkdownEntry {
  id: string;
  question: string;
  content: string;
  order: number;
}

export interface UpdateMarkdownEntry {
  id: string;
  title: string;
  date: string;
  image?: string;
  content: string;
  order: number;
}

export interface UpdatesFaqStore {
  readFaqEntries(): Promise<FaqMarkdownEntry[]>;
  readUpdateEntries(): Promise<UpdateMarkdownEntry[]>;
}

type Frontmatter = Partial<Record<string, string>>;

const FAQ_MARKDOWN_FILES = import.meta.glob("/docs/faq/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const UPDATES_MARKDOWN_FILES = import.meta.glob("/docs/updates/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const FRONTMATTER_REGEX = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/;

const createIdFromPath = (path: string, index: number): string => {
  const filename = path.split("/").pop() ?? `item-${index}`;
  return filename.replace(/\.md$/i, "") || `item-${index}`;
};

const parseFrontmatter = (rawFrontmatter: string): Frontmatter => {
  const frontmatter: Frontmatter = {};

  rawFrontmatter.split(/\r?\n/).forEach((line) => {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      return;
    }

    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const rawValue = line.slice(separatorIndex + 1).trim();

    if (!key) {
      return;
    }

    const value =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1).trim()
        : rawValue;

    frontmatter[key] = value;
  });

  return frontmatter;
};

const parseMarkdownDocument = (
  source: string,
): { frontmatter: Frontmatter; content: string } => {
  const match = source.match(FRONTMATTER_REGEX);

  if (!match) {
    return { frontmatter: {}, content: source.trim() };
  }

  const [, rawFrontmatter, rawContent] = match;
  return {
    frontmatter: parseFrontmatter(rawFrontmatter),
    content: rawContent.trim(),
  };
};

export class BrowserUpdatesFaqStore implements UpdatesFaqStore {
  async readFaqEntries(): Promise<FaqMarkdownEntry[]> {
    const entries = Object.entries(FAQ_MARKDOWN_FILES).sort(([a], [b]) =>
      a.localeCompare(b),
    );

    return entries
      .map(([path, source], index) => {
        const parsed = parseMarkdownDocument(source);
        const question = parsed.frontmatter.question?.trim();
        if (!question || !parsed.content) {
          return null;
        }

        return {
          id: createIdFromPath(path, index),
          question,
          content: parsed.content,
          order: index,
        };
      })
      .filter((item): item is FaqMarkdownEntry => item !== null);
  }

  async readUpdateEntries(): Promise<UpdateMarkdownEntry[]> {
    const entries = Object.entries(UPDATES_MARKDOWN_FILES).sort(([a], [b]) =>
      a.localeCompare(b),
    );

    return entries
      .map(([path, source], index) => {
        const parsed = parseMarkdownDocument(source);
        const title = parsed.frontmatter.title?.trim();
        if (!title || !parsed.content) {
          return null;
        }

        const image = parsed.frontmatter.image?.trim();

        return {
          id: createIdFromPath(path, index),
          title,
          date: parsed.frontmatter.date?.trim() ?? "",
          content: parsed.content,
          ...(image ? { image } : {}),
          order: index,
        };
      })
      .filter((item): item is UpdateMarkdownEntry => item !== null);
  }
}

export const updatesFaqStore = new BrowserUpdatesFaqStore();
