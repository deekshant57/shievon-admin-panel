import SwitchInput from '@/components/ui/switch-input';
import TimePicker from '@/components/ui/time-picker';
import ActionButton from '@/components/ui/action-button';
import { getDayName } from '@/utils/serviceability';
import { useTranslation } from 'next-i18next';
import { Control, useWatch } from 'react-hook-form';

interface ServiceScheduleFormProps {
  control: Control<any>;
  setValue: (name: string, value: any) => void;
  baseName?: string; // defaults to 'settings.serviceSchedule'
}

const ServiceScheduleForm = ({
  control,
  setValue,
  baseName = 'settings.serviceSchedule',
}: ServiceScheduleFormProps) => {
  const { t } = useTranslation();

  const schedule = useWatch({ control, name: baseName });

  const handleApplyToAll = () => {
    if (!schedule || schedule.length === 0) return;

    // Find the first enabled day to copy from
    const source = schedule.find((entry: any) => entry.enabled);
    if (!source) return;

    for (let i = 0; i < 7; i++) {
      setValue(`${baseName}.${i}.enabled`, true);
      setValue(`${baseName}.${i}.open`, source.open);
      setValue(`${baseName}.${i}.close`, source.close);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('form:service-schedule-help-text')}
        </p>
        <ActionButton
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleApplyToAll}
          className="shrink-0"
        >
          {t('form:button-apply-to-all-days')}
        </ActionButton>
      </div>

      <div className="space-y-3">
        {Array.from({ length: 7 }, (_, i) => (
          <ScheduleDayRow
            key={i}
            dayIndex={i}
            control={control}
            baseName={baseName}
          />
        ))}
      </div>
    </div>
  );
};

interface ScheduleDayRowProps {
  dayIndex: number;
  control: Control<any>;
  baseName: string;
}

const ScheduleDayRow = ({
  dayIndex,
  control,
  baseName,
}: ScheduleDayRowProps) => {
  const enabled = useWatch({
    control,
    name: `${baseName}.${dayIndex}.enabled`,
  });

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border/60 bg-card p-4">
      <div className="w-24 shrink-0">
        <span className="text-sm font-medium text-heading">
          {getDayName(dayIndex)}
        </span>
      </div>

      <SwitchInput
        control={control}
        name={`${baseName}.${dayIndex}.enabled`}
        className="shrink-0"
      />

      <div className="flex flex-1 items-center gap-3">
        <TimePicker
          control={control}
          name={`${baseName}.${dayIndex}.open`}
          disabled={!enabled}
          placeholder="Open"
          className="flex-1"
        />
        <span className="text-sm text-muted-foreground">to</span>
        <TimePicker
          control={control}
          name={`${baseName}.${dayIndex}.close`}
          disabled={!enabled}
          placeholder="Close"
          className="flex-1"
        />
      </div>
    </div>
  );
};

export default ServiceScheduleForm;
