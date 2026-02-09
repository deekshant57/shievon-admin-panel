import Description from '@/components/ui/description';
import Card from '@/components/common/card';
import cn from 'classnames';

type ProductFormSectionProps = {
  title: string;
  details: string;
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
    <div className="flex flex-wrap pb-8 my-5 border-b border-dashed border-border-base sm:my-8">
      <Description
        title={title}
        details={details}
        className="w-full px-0 pb-5 sm:w-4/12 sm:py-8 sm:pe-4 md:w-1/3 md:pe-5"
      />
      <Card
        className={cn('w-full sm:w-8/12 md:w-2/3', cardClassName)}
      >
        {children}
      </Card>
    </div>
  );
}
