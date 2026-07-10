import Section from '@/components/page/section';
import cn from 'classnames';

type CategoryFormSectionProps = {
  title: string;
  details: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export default function CategoryFormSection({
  title,
  details,
  children,
  className,
  contentClassName,
}: CategoryFormSectionProps) {
  return (
    <Section
      title={title}
      description={details}
      className={cn('mb-6', className)}
      contentClassName={contentClassName}
    >
      {children}
    </Section>
  );
}
