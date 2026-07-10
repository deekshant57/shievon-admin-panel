import { useIsRTL } from '@/utils/locals';
import React from 'react';
import ReactSelect, { Props } from 'react-select';
import { selectStyles, selectStylesHybrid } from './select.styles';

export type Ref = any;

export type SelectVariant = 'default' | 'hybrid';

export type SelectProps = Props & {
  variant?: SelectVariant;
};

export const Select = React.forwardRef<Ref, SelectProps>(
  ({ variant = 'default', ...props }, ref) => {
    const { isRTL } = useIsRTL();
    const styles = variant === 'hybrid' ? selectStylesHybrid : selectStyles;

    return (
      <ReactSelect
        ref={ref}
        styles={styles}
        isRtl={isRTL}
        {...props}
      />
    );
  },
);

Select.displayName = 'Select';

export default Select;
