import classNames from 'classnames';
import { twMerge } from 'tailwind-merge';

type StickyFooterPanelProps = {
  children: React.ReactNode;
  className?: string;
};

const StickyFooterPanel: React.FC<StickyFooterPanelProps> = ({
  children,
  className,
  ...rest
}) => {
  return (
    <div
      className={twMerge(
        classNames(
          'sticky bottom-0 -mx-5 border-t border-border/60 bg-background/95 px-5 py-3 text-end backdrop-blur supports-[backdrop-filter]:bg-background/80 md:py-5 lg:-mx-8 lg:px-8',
          className,
        ),
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export default StickyFooterPanel;
