const DISABLED_BG = 'rgb(var(--color-gray-100))';
const DISABLED_BORDER = 'rgb(var(--color-border-base))';
const CONTROL_RADIUS = '0.5rem';

export const selectStyles = {
  option: (provided: any, state: any) => ({
    ...provided,
    fontSize: '0.875rem',
    color: '#6B7280',
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 12,
    paddingBottom: 12,
    cursor: 'pointer',
    borderBottom: '1px solid #E5E7EB',
    backgroundColor: state.isSelected
      ? '#E5E7EB'
      : state.isFocused
      ? '#F9FAFB'
      : '#ffffff',
  }),
  control: (_: any, state: any) => ({
    display: 'flex',
    alignItems: 'center',
    minHeight: 50,
    backgroundColor: state?.isDisabled ? DISABLED_BG : '#ffffff',
    borderRadius: CONTROL_RADIUS,
    border: '1px solid #D1D5DB',
    borderColor: state?.isDisabled
      ? DISABLED_BORDER
      : state.isFocused
        ? 'rgb(var(--color-accent-500))'
        : '#D1D5DB',
    boxShadow:
      state.menuIsOpen &&
      '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  dropdownIndicator: (provided: any, state: any) => ({
    ...provided,
    color: state.isFocused ? '#9CA3AF' : '#cccccc',
    '&:hover': {
      color: '#9CA3AF',
    },
  }),
  clearIndicator: (provided: any, state: any) => ({
    ...provided,
    color: state.isFocused ? '#9CA3AF' : '#cccccc',
    padding: 0,
    cursor: 'pointer',

    '&:hover': {
      color: '#9CA3AF',
    },
  }),
  menu: (provided: any) => ({
    ...provided,
    borderRadius: CONTROL_RADIUS,
    border: '1px solid #E5E7EB',
    boxShadow:
      '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  }),
  valueContainer: (provided: any, _: any) => ({
    ...provided,
    paddingLeft: 16,
  }),
  singleValue: (provided: any, _: any) => ({
    ...provided,
    fontSize: '0.875rem',
    color: '#4B5563',
  }),
  multiValue: (provided: any, _: any) => ({
    ...provided,
    backgroundColor: 'rgb(var(--color-accent-400))',
    borderRadius: 9999,
    overflow: 'hidden',
    boxShadow:
      '0 0px 3px 0 rgba(0, 0, 0, 0.1), 0 0px 2px 0 rgba(0, 0, 0, 0.06)',
  }),
  multiValueLabel: (provided: any, state: any) => ({
    ...provided,
    paddingLeft: state.isRtl ? 0 : 12,
    paddingRight: state.isRtl ? 12 : 0,
    fontSize: '0.875rem',
    color: '#ffffff',
  }),
  multiValueRemove: (provided: any, _: any) => ({
    ...provided,
    paddingLeft: 6,
    paddingRight: 6,
    color: '#ffffff',
    cursor: 'pointer',

    '&:hover': {
      backgroundColor: 'rgb(var(--color-accent-300))',
      color: '#F3F4F6',
    },
  }),
  placeholder: (provided: any, _: any) => ({
    ...provided,
    fontSize: '0.875rem',
    color: 'rgba(107, 114, 128, 0.7)',
  }),
  noOptionsMessage: (provided: any, _: any) => ({
    ...provided,
    fontSize: '0.875rem',
    color: 'rgba(107, 114, 128, 0.7)',
  }),
};

const HYBRID_BORDER = 'hsl(var(--border))';
const HYBRID_BG = 'hsl(var(--background))';
const HYBRID_CARD = 'hsl(var(--card))';
const HYBRID_FOREGROUND = 'hsl(var(--foreground))';
const HYBRID_MUTED = 'hsl(var(--muted-foreground))';
const HYBRID_RING = 'hsl(var(--ring))';
const HYBRID_MUTED_BG = 'hsl(var(--muted))';

/** Design-system select — matches Search `hybrid` variant (h-9, border-border/60). */
export const selectStylesHybrid = {
  option: (provided: any, state: any) => ({
    ...provided,
    fontSize: '0.875rem',
    color: HYBRID_FOREGROUND,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 8,
    paddingBottom: 8,
    cursor: 'pointer',
    backgroundColor: state.isSelected
      ? HYBRID_MUTED_BG
      : state.isFocused
        ? 'hsl(var(--muted) / 0.5)'
        : HYBRID_CARD,
  }),
  control: (_: any, state: any) => ({
    display: 'flex',
    alignItems: 'center',
    minHeight: 36,
    backgroundColor: state?.isDisabled ? DISABLED_BG : HYBRID_BG,
    borderRadius: CONTROL_RADIUS,
    border: `1px solid ${HYBRID_BORDER}`,
    borderColor: state?.isDisabled
      ? DISABLED_BORDER
      : state.isFocused || state.menuIsOpen
        ? HYBRID_RING
        : HYBRID_BORDER,
    boxShadow:
      state.isFocused || state.menuIsOpen
        ? `0 0 0 1px ${HYBRID_RING}`
        : '0 1px 2px 0 rgb(0 0 0 / 0.04)',
    cursor: state?.isDisabled ? 'not-allowed' : 'pointer',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  dropdownIndicator: (provided: any, state: any) => ({
    ...provided,
    paddingRight: 10,
    color: state.isFocused ? HYBRID_MUTED : 'hsl(var(--muted-foreground) / 0.7)',
    '&:hover': {
      color: HYBRID_MUTED,
    },
  }),
  clearIndicator: (provided: any, state: any) => ({
    ...provided,
    color: state.isFocused ? HYBRID_MUTED : 'hsl(var(--muted-foreground) / 0.7)',
    padding: 0,
    cursor: 'pointer',
    '&:hover': {
      color: HYBRID_MUTED,
    },
  }),
  menu: (provided: any) => ({
    ...provided,
    borderRadius: CONTROL_RADIUS,
    border: `1px solid ${HYBRID_BORDER}`,
    backgroundColor: HYBRID_CARD,
    boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
    overflow: 'hidden',
    zIndex: 50,
  }),
  menuList: (provided: any) => ({
    ...provided,
    padding: 4,
  }),
  valueContainer: (provided: any) => ({
    ...provided,
    paddingLeft: 12,
    paddingRight: 4,
    paddingTop: 0,
    paddingBottom: 0,
  }),
  singleValue: (provided: any) => ({
    ...provided,
    fontSize: '0.875rem',
    color: HYBRID_FOREGROUND,
  }),
  multiValue: (provided: any) => ({
    ...provided,
    backgroundColor: 'hsl(var(--primary) / 0.1)',
    borderRadius: 6,
  }),
  multiValueLabel: (provided: any, state: any) => ({
    ...provided,
    paddingLeft: state.isRtl ? 0 : 8,
    paddingRight: state.isRtl ? 8 : 0,
    fontSize: '0.8125rem',
    color: HYBRID_FOREGROUND,
  }),
  multiValueRemove: (provided: any) => ({
    ...provided,
    paddingLeft: 4,
    paddingRight: 4,
    color: HYBRID_MUTED,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'hsl(var(--muted))',
      color: HYBRID_FOREGROUND,
    },
  }),
  placeholder: (provided: any) => ({
    ...provided,
    fontSize: '0.875rem',
    color: HYBRID_MUTED,
  }),
  noOptionsMessage: (provided: any) => ({
    ...provided,
    fontSize: '0.875rem',
    color: HYBRID_MUTED,
  }),
  loadingMessage: (provided: any) => ({
    ...provided,
    fontSize: '0.875rem',
    color: HYBRID_MUTED,
  }),
};

export const selectStylesModern = {
  option: (provided: any, state: any) => ({
    ...provided,
    fontSize: '0.875rem',
    color: '#6B7280',
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 12,
    paddingBottom: 12,
    marginTop: 12,
    marginBottom: 12,
    cursor: 'pointer',
    border: '1px solid #E5E5E5',
    borderRadius: 6,
    position: 'relative',
    backgroundColor: state.isSelected
      ? 'rgb(var(--color-gray-100))'
      : state.isFocused
        ? 'rgb(var(--color-gray-50))'
        : '#ffffff',
  }),
  control: (_: any, state: any) => ({
    display: 'flex',
    alignItems: 'center',
    minHeight: 50,
    backgroundColor: state?.isDisabled ? DISABLED_BG : '#ffffff',
    borderRadius: CONTROL_RADIUS,
    border: '1px solid #D1D5DB',
    borderColor: state?.isDisabled
      ? DISABLED_BORDER
      : state.isFocused
        ? 'rgb(var(--color-accent-500))'
        : '#D1D5DB',
    boxShadow: state.menuIsOpen && '0px 2px 6px rgba(59, 74, 92, 0.1)',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  dropdownIndicator: (provided: any, state: any) => ({
    ...provided,
    color: state.isFocused ? '#9CA3AF' : '#cccccc',
    '&:hover': {
      color: '#9CA3AF',
    },
  }),
  clearIndicator: (provided: any, state: any) => ({
    ...provided,
    color: state.isFocused ? '#9CA3AF' : '#cccccc',
    padding: 0,
    cursor: 'pointer',

    '&:hover': {
      color: '#9CA3AF',
    },
  }),
  menu: (provided: any) => ({
    ...provided,
    borderRadius: CONTROL_RADIUS,
    border: '1px solid #D1D5DB',
    paddingLeft: 16,
    paddingRight: 16,
    boxShadow: '0px 2px 6px rgba(59, 74, 92, 0.1)',
  }),
  valueContainer: (provided: any, _: any) => ({
    ...provided,
    paddingLeft: 16,
  }),
  singleValue: (provided: any, _: any) => ({
    ...provided,
    fontSize: '0.875rem',
    color: '#4B5563',
  }),
  multiValue: (provided: any, _: any) => ({
    ...provided,
    backgroundColor: 'rgb(var(--color-accent-400))',
    borderRadius: 9999,
    overflow: 'hidden',
    boxShadow:
      '0 0px 3px 0 rgba(0, 0, 0, 0.1), 0 0px 2px 0 rgba(0, 0, 0, 0.06)',
  }),
  multiValueLabel: (provided: any, state: any) => ({
    ...provided,
    paddingLeft: state.isRtl ? 0 : 12,
    paddingRight: state.isRtl ? 12 : 0,
    fontSize: '0.875rem',
    color: '#ffffff',
  }),
  multiValueRemove: (provided: any, _: any) => ({
    ...provided,
    paddingLeft: 6,
    paddingRight: 6,
    color: '#ffffff',
    cursor: 'pointer',

    '&:hover': {
      backgroundColor: 'rgb(var(--color-accent-300))',
      color: '#F3F4F6',
    },
  }),
  placeholder: (provided: any, _: any) => ({
    ...provided,
    fontSize: '0.875rem',
    color: 'rgba(107, 114, 128, 0.7)',
  }),
  noOptionsMessage: (provided: any, _: any) => ({
    ...provided,
    fontSize: '0.875rem',
    color: 'rgba(107, 114, 128, 0.7)',
  }),
};
