import { cn } from '@/lib/utils';

type AuthFooterProps = {
  children: React.ReactNode;
  className?: string;
};

const AuthFooter = ({ children, className }: AuthFooterProps) => {
  return (
    <footer
      className={cn('text-center text-sm text-body sm:text-base', className)}
    >
      {children}
    </footer>
  );
};

export default AuthFooter;
