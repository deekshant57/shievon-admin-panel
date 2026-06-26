import { cn } from '@/lib/utils';

type AuthFormPanelProps = {
  children: React.ReactNode;
  formWidth?: 'md' | 'lg';
  className?: string;
};

const AuthFormPanel = ({
  children,
  formWidth = 'md',
  className,
}: AuthFormPanelProps) => {
  return (
    <main
      className={cn(
        'flex flex-1 flex-col justify-center bg-background px-5 py-8 sm:px-8 lg:px-12 xl:px-16',
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto w-full',
          formWidth === 'lg' ? 'max-w-lg' : 'max-w-md',
        )}
      >
        {children}
      </div>
    </main>
  );
};

export default AuthFormPanel;
