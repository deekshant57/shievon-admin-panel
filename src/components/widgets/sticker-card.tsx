import StatMetric from '@/components/page/stat-metric';
import { StickerCardProps } from '@/types';
import { useTranslation } from 'next-i18next';

const StickerCard = ({
  titleTransKey,
  icon,
  price,
  indicator,
  indicatorText,
  note,
  link,
  linkText,
  className,
}: StickerCardProps) => {
  const { t } = useTranslation('widgets');

  return (
    <StatMetric
      label={t(titleTransKey)}
      value={price}
      icon={icon}
      indicator={indicator}
      indicatorText={indicatorText}
      note={note}
      link={link}
      linkText={linkText}
      className={className}
      variant="strip"
    />
  );
};

export default StickerCard;
