import { useSanitizeContent } from '@/utils/sanitize-content';

type LegalContentProps = {
  title: string;
  lastUpdated: string;
  content: string;
};

const LegalContent = ({ title, lastUpdated, content }: LegalContentProps) => {
  const sanitizedContent = useSanitizeContent({
    description: content,
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">
      <div className="rounded bg-white px-6 py-8 shadow md:px-8 md:py-10">
        <h1 className="mb-2 text-4xl font-bold text-heading">{title}</h1>
        <p className="mb-8 text-sm text-body">Last updated: {lastUpdated}</p>

        {sanitizedContent ? (
          <div
            className="react-editor-description space-y-4 text-[15px] leading-[1.75em] text-[#5A5A5A] [&_a]:text-blue-600 hover:[&_a]:text-blue-700"
            dangerouslySetInnerHTML={{
              __html: sanitizedContent,
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

export default LegalContent;
