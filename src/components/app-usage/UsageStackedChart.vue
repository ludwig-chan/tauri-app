<template>
  <div class="usage-stacked-chart" ref="chartContainer">
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

interface StackedData {
  dates: string[]
  apps: Array<{ app_name: string, data: number[] }>
}

interface Props {
  data: StackedData
  title?: string
  chartType?: 'line' | 'bar'
  showDataZoom?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '应用使用趋势（Top5）',
  chartType: 'bar',
  showDataZoom: false
})

const chartOption = computed(() => {
  const dates = props.data.dates.map(d => formatDateDisplay(d))
  
  // 颜色配置
  const colors = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'
  ]

  const series = props.data.apps.map((app, index) => ({
    name: app.app_name,
    type: props.chartType,
    stack: 'total',
    data: app.data.map(d => Math.round(d / 60) / 60), // 转换为小时
    smooth: true,
    areaStyle: props.chartType === 'line' ? {} : undefined,
    emphasis: {
      focus: 'series'
    },
    itemStyle: {
      color: colors[index % colors.length],
      borderRadius: props.chartType === 'bar' && index === props.data.apps.length - 1 
        ? [4, 4, 0, 0] 
        : 0
    }
  }))

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
        let result = `${params[0].name}<br/>`
        let total = 0
        params.forEach((item: any) => {
          const index = item.dataIndex
          const originalSeconds = props.data.apps.find(a => a.app_name === item.seriesName)?.data[index] || 0
          total += originalSeconds
          result += `${item.marker} ${item.seriesName}: ${formatDuration(originalSeconds)}<br/>`
        })
        result += `<strong>总计: ${formatDuration(total)}</strong>`
        return result
      }
    },
    legend: {
      data: props.data.apps.map(a => a.app_name),
      bottom: props.showDataZoom ? 40 : 10,
      type: 'scroll',
      textStyle: {
        fontSize: 12
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: props.showDataZoom ? '20%' : '15%',
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
        end: 100,
        bottom: 10
      }
    ] : [],
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: props.chartType === 'bar',
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
    color: colors,
    series
  }
})
</script>

<style scoped>
.usage-stacked-chart {
  width: 100%;
  height: 100%;
  min-height: 350px;
}

.chart {
  width: 100%;
  height: 100%;
}
</style>
