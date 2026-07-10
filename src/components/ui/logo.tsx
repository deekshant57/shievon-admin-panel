import Link from '@/components/ui/link';
import cn from 'classnames';
import { siteSettings } from '@/settings/site.settings';
import { useAtom } from 'jotai';
import { miniSidebarInitialValue } from '@/utils/constants';
import { useWindowSize } from '@/utils/use-window-size';
import { RESPONSIVE_WIDTH } from '@/utils/constants';
import Image from 'next/image';

const Logo: React.FC<React.AnchorHTMLAttributes<{}>> = ({
  className,
  ...props
}) => {
  const [miniSidebar, _] = useAtom(miniSidebarInitialValue);
  const { width } = useWindowSize();

  return (
    <Link
      href={siteSettings?.logo?.href}
      className={cn('inline-flex items-center gap-3', className)}
      // {...props}
    >
      {miniSidebar && width >= RESPONSIVE_WIDTH ? (
        <span
          className="relative overflow-hidden "
          style={{
            width: siteSettings.collapseLogo.width,
            height: siteSettings.collapseLogo.height,
          }}
        >
          <Image
            src={siteSettings.collapseLogo.url}
            alt={siteSettings.collapseLogo.alt}
            fill
            sizes="(max-width: 768px) 100vw"
            className="object-contain"
            loading="eager"
          />
        </span>
      ) : (
        <span
          className="relative overflow-hidden "
          style={{
            width: siteSettings.logo.width,
            height: siteSettings.logo.height,
          }}
        >
          <Image
            src={siteSettings.logo.url}
            alt={siteSettings.logo.alt}
            fill
            sizes="(max-width: 768px) 100vw"
            className="object-contain"
            loading="eager"
          />
        </span>
      )}
    </Link>
  );
};

export default Logo;
