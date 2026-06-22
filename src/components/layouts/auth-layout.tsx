import Logo from '@/components/ui/logo';
import {
  Card,
  CardContent,
} from '@/components/ui/shadcn/card';

export default function AuthPageLayout({
  children,
}: React.PropsWithChildren<{}>) {
  return (
    <div className="flex h-screen items-center justify-center bg-background sm:bg-muted/30">
      <Card className="m-auto w-full max-w-[420px] border-border/60 shadow-sm sm:shadow-md">
        <CardContent className="p-5 sm:p-8">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
