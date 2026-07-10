import Section from '@/components/page/section';
import cn from 'classnames';

type FormSectionProps = {
  title: string;
  details?: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

/**
 * Classic stacked form block — title + description in the card header, fields in the body.
 * Prefer this over the legacy Description + Card two-column layout.
 */
export default function FormSection({
  title,
  details,
  children,
  className,
  contentClassName,
}: FormSectionProps) {
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
