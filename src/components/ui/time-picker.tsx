import Select from '@/components/ui/select/select';
import ValidationError from '@/components/ui/form-validation-error';
import TooltipLabel from '@/components/ui/tooltip-label';
import { Control, Controller } from 'react-hook-form';

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = (i % 2) * 30;
  const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  // Format 12-hour label for readability
  const period = h < 12 ? 'AM' : 'PM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const label = `${displayH}:${String(m).padStart(2, '0')} ${period}`;

  return { value, label };
});

interface TimePickerProps {
  control: Control<any>;
  name: string;
  label?: string;
  toolTipText?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  placeholder?: string;
}

const TimePicker = ({
  control,
  name,
  label,
  toolTipText,
  required,
  disabled,
  error,
  className,
  placeholder = 'Select time',
}: TimePickerProps) => {
  return (
    <div className={className}>
      {label ? (
        <TooltipLabel
          htmlFor={name}
          label={label}
          toolTipText={toolTipText}
          required={required}
        />
      ) : null}
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            {...field}
            value={TIME_OPTIONS.find((o) => o.value === field.value) ?? null}
            onChange={(option: any) => field.onChange(option?.value ?? '')}
            options={TIME_OPTIONS}
            isDisabled={disabled}
            placeholder={placeholder}
            isClearable={false}
          />
        )}
      />
      {error ? <ValidationError message={error} /> : null}
    </div>
  );
};

export default TimePicker;
