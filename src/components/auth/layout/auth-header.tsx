import { cn } from '@/lib/utils';

type AuthHeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

const AuthHeader = ({ title, subtitle, className }: AuthHeaderProps) => {
  return (
    <header className={cn('mb-6', className)}>
      <h1 className="text-2xl font-bold tracking-tight text-heading">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-1.5 text-sm leading-relaxed text-body">{subtitle}</p>
      ) : null}
    </header>
  );
};

export default AuthHeader;
