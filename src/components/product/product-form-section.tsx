import Section from '@/components/page/section';
import cn from 'classnames';

type ProductFormSectionProps = {
  title: string;
  details: string | React.ReactNode;
  children: React.ReactNode;
  cardClassName?: string;
};

/**
 * Shared section layout for product form blocks (e.g. Product Parameters, Variation Info).
 * Keeps UI consistent between simple and variable product types.
 */
export default function ProductFormSection({
  title,
  details,
  children,
  cardClassName,
}: ProductFormSectionProps) {
  return (
    <Section
      title={title}
      description={details}
      className="mb-6"
      contentClassName={cn(cardClassName)}
    >
      {children}
    </Section>
  );
}
