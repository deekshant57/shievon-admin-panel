import PageHeader from '@/components/page/page-header';

const PageHeading = ({
  title,
  className,
  ...props
}: {
  title: string;
  className?: string;
}) => {
  return <PageHeader title={title} className={className} {...props} />;
};

export default PageHeading;
