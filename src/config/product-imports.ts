import { Routes } from '@/config/routes';

export type ProductImportType = {
  key: string;
  labelKey: string;
  href: (shop: string) => string;
};

export const PRODUCT_IMPORTS: ProductImportType[] = [
  {
    key: 'clothing',
    labelKey: 'clothing-import-title',
    href: Routes.product.clothingImport,
  },
  {
    key: 'footwear',
    labelKey: 'footwear-import-title',
    href: Routes.product.footwearImport,
  },
  {
    key: 'cosmetics',
    labelKey: 'cosmetics-import-title',
    href: Routes.product.cosmeticsImport,
  },
];
