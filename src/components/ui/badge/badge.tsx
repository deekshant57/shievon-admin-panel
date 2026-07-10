import { Badge as ShadBadge } from '@/components/ui/shadcn/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from 'next-i18next';

type BadgeProps = {
  className?: string;
  color?: string;
  textColor?: string;
  text?: string;
  textKey?: string;
  animate?: boolean;
};

const Badge: React.FC<BadgeProps> = (props) => {
  const { t } = useTranslation();
  const {
    className,
    color: colorOverride,
    textColor: textColorOverride,
    text,
    textKey,
    animate = false,
  } = props;

  return (
    <ShadBadge
      className={cn(
        'relative whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium',
        !colorOverride && 'bg-accent text-light hover:bg-accent',
        colorOverride,
        textColorOverride,
        animate && 'animate-pulse',
        className,
      )}
    >
      {textKey ? t(textKey) : text}
    </ShadBadge>
  );
};

export default Badge;
