<template>
  <div class="usage-trend-chart" ref="chartContainer">
    <VChart 
      :option="chartOption" 
      :autoresize="true"
      class="chart"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { formatDuration, formatDateDisplay } from '../../utils/dateUtils'

// 注册 ECharts 组件
use([
  TitleComponent, 
  TooltipComponent, 
  GridComponent, 
  LegendComponent,
  DataZoomComponent,
  LineChart, 
  BarChart, 
  CanvasRenderer
])

interface TrendData {
  date: string
  total_duration: number
}

interface Props {
  data: TrendData[]
  title?: string
  chartType?: 'line' | 'bar'
  showDataZoom?: boolean
  smooth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '使用时长趋势',
  chartType: 'bar',
  showDataZoom: false,
  smooth: true
})

const chartOption = computed(() => {
  const dates = props.data.map(item => formatDateDisplay(item.date))
  const durations = props.data.map(item => item.total_duration)
  
  // 计算小时数用于显示
  const hoursData = durations.map(d => Math.round(d / 60) / 60) // 转换为小时（保留2位小数）

  return {
    title: {
      text: props.title,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 16,
        fontWeight: 600,
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: props.chartType === 'line' ? 'cross' : 'shadow'
      },
      formatter: (params: any) => {
        const item = params[0]
        const originalSeconds = props.data[item.dataIndex]?.total_duration || 0
        return `${item.name}<br/>使用时长: ${formatDuration(originalSeconds)}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: props.showDataZoom ? '15%' : '10%',
      top: '15%',
      containLabel: true
    },
    dataZoom: props.showDataZoom ? [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100
      }
    ] : [],
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: dates.length > 7 ? 45 : 0,
        fontSize: 12,
        color: '#666'
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '小时',
      nameTextStyle: {
        color: '#666',
        fontSize: 12
      },
      axisLabel: {
        formatter: (value: number) => `${value.toFixed(1)}h`,
        color: '#666'
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: '#eee'
        }
      }
    },
    series: [
      {
        name: '使用时长',
        type: props.chartType,
        data: hoursData,
        smooth: props.smooth,
        itemStyle: {
          color: props.chartType === 'line' ? '#5470c6' : {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#667eea' },
              { offset: 1, color: '#764ba2' }
            ]
          },
          borderRadius: props.chartType === 'bar' ? [4, 4, 0, 0] : 0
        },
        areaStyle: props.chartType === 'line' ? {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(84, 112, 198, 0.4)' },
              { offset: 1, color: 'rgba(84, 112, 198, 0.05)' }
            ]
          }
        } : undefined,
        lineStyle: props.chartType === 'line' ? {
          width: 3,
          color: '#5470c6'
        } : undefined,
        symbol: 'circle',
        symbolSize: 8,
        emphasis: {
          focus: 'series',
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        }
      }
    ]
  }
})
</script>

<style scoped>
.usage-trend-chart {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.chart {
  width: 100%;
  height: 100%;
}
</style>
