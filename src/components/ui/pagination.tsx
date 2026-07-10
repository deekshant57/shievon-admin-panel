import RCPagination, { PaginationProps } from 'rc-pagination';
import { ArrowNext } from '@/components/icons/arrow-next';
import { ArrowPrev } from '@/components/icons/arrow-prev';
import { cn } from '@/lib/utils';
import 'rc-pagination/assets/index.css';

const Pagination: React.FC<PaginationProps> = ({ className, ...props }) => {
  return (
    <RCPagination
      className={cn('rc-pagination-shadcn', className)}
      nextIcon={<ArrowNext />}
      prevIcon={<ArrowPrev />}
      {...props}
    />
  );
};

export default Pagination;
