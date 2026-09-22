import Select from '@/components/ui/select/select';
import TooltipLabel from '@/components/ui/tooltip-label';
import { Controller } from 'react-hook-form';
import { GetOptionLabel } from 'react-select';

interface SelectInputProps {
  control: any;
  rules?: any;
  name: string;
  options: object[];
  getOptionLabel?: GetOptionLabel<unknown>;
  getOptionValue?: GetOptionLabel<unknown>;
  isMulti?: boolean;
  isClearable?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  [key: string]: unknown;
  placeholder?: string;
  required?: boolean;
  label?: string;
  toolTipText?: string;
  error?: string;
  onChange?: (value: unknown) => void;
}

const SelectInput = ({
  control,
  options,
  name,
  rules,
  getOptionLabel,
  getOptionValue,
  disabled,
  isMulti,
  isClearable,
  isLoading,
  placeholder,
  label,
  required,
  toolTipText,
  error,
  onChange: onChangeProp,
  ...rest
}: SelectInputProps) => {
  return (
    <>
      {label ? (
        <TooltipLabel
          htmlFor={name}
          toolTipText={toolTipText}
          label={label}
          required={required}
        />
      ) : (
        ''
      )}
      <Controller
        control={control}
        name={name}
        rules={rules}
        {...rest}
        render={({ field: { onChange, ...field } }) => (
          <Select
            {...field}
            onChange={(newValue: unknown) => {
              onChange(newValue);
              onChangeProp?.(newValue);
            }}
            getOptionLabel={getOptionLabel}
            getOptionValue={getOptionValue}
            placeholder={placeholder}
            isMulti={isMulti}
            isClearable={isClearable}
            isLoading={isLoading}
            options={options}
            isDisabled={disabled as boolean}
          />
        )}
      />
      {error && <p className="my-2 text-xs text-red-500 text-start">{error}</p>}
    </>
  );
};

export default SelectInput;
