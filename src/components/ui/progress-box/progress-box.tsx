import { CheckMark } from '@/components/icons/checkmark';
import cn from 'classnames';
import { useTranslation } from 'next-i18next';

type ProgressStep = {
  name?: string;
  serial?: number | string;
};

type ProgressProps = {
  data: ProgressStep[] | undefined;
  status: string;
  filledIndex: number;
};

const ProgressBox: React.FC<ProgressProps> = ({ data, filledIndex }) => {
  const { t } = useTranslation();
  const steps = data ?? [];
  const dense = steps.length > 5;

  return (
    <div className="w-full min-w-0">
      {/* Mobile: vertical timeline */}
      <ol className="flex flex-col md:hidden">
        {steps.map((item, index) => {
          const isFilled = index <= filledIndex;
          const isLast = index === steps.length - 1;
          const connectorFilled = index <= filledIndex;

          return (
            <li key={`progress-mobile-${index}`} className="flex gap-4">
              <div className="flex w-9 shrink-0 flex-col items-center">
                <StepCircle filled={isFilled} serial={item.serial} />
                {!isLast ? (
                  <div
                    className={cn(
                      'my-1 w-1 min-h-[1.75rem] flex-1 rounded-full',
                      connectorFilled ? 'bg-accent' : 'bg-gray-100',
                    )}
                  />
                ) : null}
              </div>
              <div className={cn('min-w-0 flex-1', !isLast && 'pb-5')}>
                <span className="block text-sm font-semibold capitalize leading-snug text-body-dark">
                  {item?.name ? t(item.name) : null}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Tablet/desktop: horizontal stepper */}
      <ol className="hidden md:flex md:w-full md:min-w-0 md:items-start">
        {steps.map((item, index) => {
          const isFilled = index <= filledIndex;
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;
          const inboundFilled = index <= filledIndex;
          const outboundFilled = index <= filledIndex;

          return (
            <li
              key={`progress-desktop-${index}`}
              className="relative flex min-w-0 flex-1 flex-col items-center"
            >
              {!isFirst ? (
                <span
                  aria-hidden
                  className={cn(
                    'absolute right-1/2 top-[1.125rem] left-0 h-1 -translate-y-1/2',
                    inboundFilled ? 'bg-accent' : 'bg-gray-100',
                  )}
                />
              ) : null}
              {!isLast ? (
                <span
                  aria-hidden
                  className={cn(
                    'absolute left-1/2 right-0 top-[1.125rem] h-1 -translate-y-1/2',
                    outboundFilled ? 'bg-accent' : 'bg-gray-100',
                  )}
                />
              ) : null}

              <StepCircle filled={isFilled} serial={item.serial} />
              <span
                className={cn(
                  'mt-3 w-full px-1 text-center font-semibold capitalize leading-snug text-body-dark',
                  dense ? 'text-xs lg:text-sm' : 'text-sm',
                )}
              >
                {item?.name ? t(item.name) : null}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

function StepCircle({
  filled,
  serial,
}: {
  filled: boolean;
  serial?: number | string;
}) {
  return (
    <div
      className={cn(
        'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed text-sm font-bold',
        filled
          ? 'border-accent bg-accent text-light'
          : 'border-accent bg-light text-accent',
      )}
    >
      {filled ? (
        <div className="h-4 w-3">
          <CheckMark className="w-full" />
        </div>
      ) : (
        serial
      )}
    </div>
  );
}

export default ProgressBox;
