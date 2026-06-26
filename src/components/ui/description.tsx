import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  title?: string;
  details?: string | JSX.Element;
  [key: string]: unknown;
};

const Description: React.FC<Props> = ({
  title,
  details,
  className,
  ...props
}) => {
  return (
    <div className={cn(className)} {...props}>
      {title ? (
        <h4 className="mb-2 text-base font-bold text-heading">{title}</h4>
      ) : null}
      {details ? <p className="text-sm text-body">{details}</p> : null}
    </div>
  );
};

export default Description;
