import Select from '@/components/ui/select/select';
import cn from 'classnames';
import { useTranslation } from 'next-i18next';
import { ActionMeta } from 'react-select';

export type ServiceabilityFilterOption = {
  name: string;
  value: boolean;
};

export const SERVICEABILITY_FILTER_OPTIONS: ServiceabilityFilterOption[] = [
  { name: 'filter-option-serviceable', value: true },
  { name: 'filter-option-not-serviceable', value: false },
];

type Props = {
  onServiceabilityFilter: (
    newValue: ServiceabilityFilterOption | null,
    actionMeta: ActionMeta<unknown>,
  ) => void;
  className?: string;
};

export default function ServiceabilityFilter({
  onServiceabilityFilter,
  className,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className={cn('flex w-full', className)}>
      <div className="w-full">
        <Select
          options={SERVICEABILITY_FILTER_OPTIONS}
          getOptionLabel={(option: ServiceabilityFilterOption) =>
            t(`common:${option.name}`)
          }
          getOptionValue={(option: ServiceabilityFilterOption) =>
            String(option.value)
          }
          placeholder={t('common:filter-by-serviceability')}
          onChange={onServiceabilityFilter}
          isClearable={true}
        />
      </div>
    </div>
  );
}
