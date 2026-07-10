import StatTile from '@/components/page/stat-tile';

type IconCardProps = {
  title: string;
  content: string;
  icon: string;
  className?: string;
  iconClassName?: string;
  iconInnerClassName?: string;
};

export const IconCard: React.FC<IconCardProps> = ({
  title,
  content,
  icon,
  className,
  iconClassName,
  iconInnerClassName,
  ...rest
}) => {
  return (
    <StatTile
      title={title}
      content={content}
      iconName={icon}
      className={className}
      iconClassName={iconClassName}
      iconInnerClassName={iconInnerClassName}
      {...rest}
    />
  );
};
