import Uploader from '@/components/common/uploader';
import TooltipLabel from '@/components/ui/tooltip-label';
import { Controller } from 'react-hook-form';
import ValidationError from '@/components/ui/form-validation-error';

interface FileInputProps {
  control: any;
  name: string;
  multiple?: boolean;
  acceptFile?: boolean;
  helperText?: string;
  defaultValue?: any;
  maxSize?: number;
  disabled?: boolean;
  toolTipText?: string;
  label?: string;
  required?: boolean;
  error?: string;
  /** e.g. 'banners' for type banner/slider images (POST /attachments?folder=banners) */
  folder?: string;
  /** When true, do not call DELETE attachment on remove (e.g. category/shop/profile/type image). */
  skipDeleteOnRemove?: boolean;
}

const FileInput = ({
  control,
  name,
  multiple = true,
  acceptFile = false,
  helperText,
  defaultValue = [],
  maxSize,
  disabled,
  label,
  toolTipText,
  required,
  error,
  folder,
  skipDeleteOnRemove,
}: FileInputProps) => {
  return (
    <>
      {label && (
        <TooltipLabel
          htmlFor={name}
          toolTipText={toolTipText}
          label={label}
          required={required}
        />
      )}
      <Controller
        control={control}
        name={name}
        render={({ field: { ref, ...rest } }) => (
          <Uploader
            {...rest}
            multiple={multiple}
            acceptFile={acceptFile}
            helperText={helperText}
            maxSize={maxSize}
            disabled={disabled}
            folder={folder}
            skipDeleteOnRemove={skipDeleteOnRemove}
          />
        )}
      />
      {error ? <ValidationError message={error} /> : ''}
    </>
  );
};

export default FileInput;
