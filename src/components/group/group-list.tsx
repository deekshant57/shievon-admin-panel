import { Table } from '@/components/ui/table';
import TruncatedId from '@/components/ui/truncated-id';
import { Type } from '@/types';
import { getIcon } from '@/utils/get-icon';
import * as typeIcons from '@/components/icons/type';
import { useTranslation } from 'next-i18next';
import { useIsRTL } from '@/utils/locals';
import { Routes } from '@/config/routes';
import LanguageSwitcher from '@/components/ui/lang-action/action';
import { NoDataFound } from '@/components/icons/no-data-found';
import { Switch } from '@headlessui/react';
import { useToggleTypeServiceabilityMutation } from '@/data/type';

export type IProps = {
  types: Type[] | undefined;
  routes?: typeof Routes.type;
};

const TypeList = ({ types, routes = Routes.type }: IProps) => {
  const { t } = useTranslation();
  const { alignLeft, alignRight } = useIsRTL();
  const { mutate: toggleServiceability, isLoading: toggling } =
    useToggleTypeServiceabilityMutation();

  const columns = [
    {
      title: t('table:table-item-id'),
      dataIndex: 'id',
      key: 'id',
      align: alignLeft,
      width: 120,
      render: (id: number) => <TruncatedId id={id} />,
    },
    {
      title: t('table:table-homepage-name'),
      width: 220,
      dataIndex: 'name',
      key: 'name',
      align: alignLeft,
      render: (name: any, record: Type) => (
        <span
          className={`whitespace-nowrap ${
            record.is_serviceable === false ? 'opacity-50' : ''
          }`}
        >
          {name}
        </span>
      ),
    },
    {
      title: t('table:table-item-serviceable'),
      dataIndex: 'is_serviceable',
      key: 'is_serviceable',
      align: 'center',
      width: 130,
      render: (is_serviceable: boolean, record: Type) => (
        <Switch
          checked={is_serviceable !== false}
          onChange={() =>
            toggleServiceability({
              id: record.id,
              is_serviceable: is_serviceable === false,
            })
          }
          disabled={toggling}
          className={`${
            is_serviceable !== false ? 'bg-accent' : 'bg-gray-300'
          } relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none ${
            toggling ? 'cursor-not-allowed opacity-60' : ''
          }`}
          dir="ltr"
        >
          <span className="sr-only">{t('table:table-item-serviceable')}</span>
          <span
            className={`${
              is_serviceable !== false ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-light transition-transform`}
          />
        </Switch>
      ),
    },
    {
      title: 'Sort Order',
      dataIndex: 'sort_order',
      key: 'sort_order',
      align: 'center',
      width: 140,
      render: (sortOrder: number | null | undefined) =>
        Number.isFinite(sortOrder) ? sortOrder : '-',
    },
    {
      title: t('table:table-item-slug'),
      dataIndex: 'slug',
      key: 'slug',
      align: 'center',
      width: 220,
      ellipsis: true,
    },
    {
      title: t('table:table-item-icon'),
      dataIndex: 'icon',
      key: 'slug',
      align: 'center',
      width: 150,
      render: (icon: string) => {
        if (!icon) return null;
        return (
          <span className="flex items-center justify-center">
            {getIcon({
              iconList: typeIcons,
              iconName: icon,
              className: 'w-5 h-5 max-h-full max-w-full',
            })}
          </span>
        );
      },
    },
    {
      title: t('table:table-item-actions'),
      dataIndex: 'slug',
      key: 'actions',
      align: alignRight,
      width: 120,
      render: (slug: string, record: Type) => (
        <LanguageSwitcher
          slug={slug}
          record={record}
          deleteModalView="DELETE_TYPE"
          routes={routes}
        />
      ),
    },
  ];

  return (
    <Table
        //@ts-ignore
        columns={columns}
        emptyText={() => (
          <div className="flex flex-col items-center py-7">
            <NoDataFound className="w-52" />
            <div className="mb-1 pt-6 text-base font-semibold text-heading">
              {t('table:empty-table-data')}
            </div>
            <p className="text-[13px]">{t('table:empty-table-sorry-text')}</p>
          </div>
        )}
        data={types}
        rowKey="id"
        scroll={{ x: 380 }}
      />
  );
};

export default TypeList;
