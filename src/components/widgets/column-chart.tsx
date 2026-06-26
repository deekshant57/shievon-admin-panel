import Chart from '@/components/ui/chart';
import cn from 'classnames';
import { ArrowUp } from '@/components/icons/arrow-up';
import { ArrowDown } from '@/components/icons/arrow-down';

const BarChart = ({
  widgetTitle,
  series,
  colors,
  prefix,
  totalValue,
  text,
  position,
  percentage,
  categories,
  hideHeader = false,
  className,
}: any) => {
  const options = {
    options: {
      chart: {
        height: 600,
        type: 'line',
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: '60%',
          endingShape: 'flat',
        },
      },
      stroke: {
        curve: 'smooth',
        width: [0, 3],
      },
      fill: {
        type: 'solid',
        opacity: [1, 0],
      },
      dataLabels: {
        enabled: false,
      },
      markers: {
        size: [0, 0],
      },
      colors: colors,
      xaxis: {
        labels: {
          show: true,
          style: {
            colors: '#1F2937',
            fontSize: '14px',
            fontFamily: "'Lato', sans-serif",
          },
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        categories: categories,
      },
      yaxis: {
        show: true,
        labels: {
          show: true,
          style: {
            color: '#1F2937',
            fontSize: '14px',
            fontFamily: "'Lato', sans-serif",
          },
        },
      },
      tooltip: {
        custom: function ({
          series,
          seriesIndex,
          dataPointIndex,
          w,
        }: {
          dataPointIndex: number;
          seriesIndex: number;
          series: string[];
          w: any;
        }) {
          return (
            '<div class="arrow_box flex flex-col text-center">' +
            '<span class="border-b border-b-slate-200 p-1">' +
            w?.globals?.labels[dataPointIndex] +
            '</span>' +
            '<span class="p-1">' +
            series[seriesIndex][dataPointIndex] +
            '</span>' +
            '</div>'
          );
        },
      },
    },
    series: [
      {
        type: 'column',
        data: series,
      },
    ],
  };

  return (
    <div
      className={cn(
        'h-full w-full overflow-hidden',
        !hideHeader && 'rounded-lg border border-border/60 bg-card p-6 shadow-sm md:p-7',
        className,
      )}
    >
      {!hideHeader ? (
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-heading">{widgetTitle}</h3>

          <div className="flex flex-col">
            <span className="text-lg font-semibold text-green-500">
              {prefix}
              {totalValue}
            </span>

            <div className="flex items-center">
              {position === 'up' && (
                <span className="text-green-500">
                  <ArrowUp />
                </span>
              )}
              {position === 'down' && (
                <span className="text-red-400">
                  <ArrowDown />
                </span>
              )}
              <span className="ms-1 text-sm text-heading">
                <span
                  className={cn(
                    position === 'down' ? 'text-red-400' : 'text-green-500',
                  )}
                >
                  {percentage}
                </span>
                &nbsp;
                {text}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex w-full flex-wrap" style={{ display: 'block' }}>
        <Chart
          options={options.options}
          series={options.series}
          height="350"
          width="100%"
          type="bar"
        />
      </div>
    </div>
  );
};

export default BarChart;
