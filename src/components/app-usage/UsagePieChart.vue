<template>
  <div class="usage-pie-chart" ref="chartContainer">
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
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import type { AppUsageStats } from '../../utils/appUsageDb'
import { formatDuration } from '../../utils/dateUtils'

// 注册 ECharts 组件
use([TitleComponent, TooltipComponent, LegendComponent, PieChart, CanvasRenderer])

interface Props {
  data: AppUsageStats[]
  title?: string
  showLegend?: boolean
  topN?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: '应用使用占比',
  showLegend: true,
  topN: 8
})

const chartOption = computed(() => {
  // 获取前 N 个应用，其余归为"其他"
  const topApps = props.data.slice(0, props.topN)
  const otherApps = props.data.slice(props.topN)
  
  let pieData = topApps.map(app => ({
    name: app.app_name,
    value: app.total_duration
  }))

  // 如果有其他应用，合并为"其他"
  if (otherApps.length > 0) {
    const otherTotal = otherApps.reduce((sum, app) => sum + app.total_duration, 0)
    pieData.push({
      name: '其他',
      value: otherTotal
    })
  }

  // 颜色配置
  const colors = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'
  ]

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
      trigger: 'item',
      formatter: (params: any) => {
        const duration = formatDuration(params.value)
        return `${params.name}<br/>使用时长: ${duration}<br/>占比: ${params.percent}%`
      }
    },
    legend: {
      show: props.showLegend,
      orient: 'vertical',
      left: 'left',
      top: 'middle',
      type: 'scroll',
      formatter: (name: string) => {
        if (name.length > 8) {
          return name.substring(0, 8) + '...'
        }
        return name
      }
    },
    color: colors,
    series: [
      {
        name: '应用使用',
        type: 'pie',
        radius: ['40%', '70%'],
        center: props.showLegend ? ['60%', '55%'] : ['50%', '55%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}: {d}%',
          fontSize: 12
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        labelLine: {
          show: true
        },
        data: pieData
      }
    ]
  }
})
</script>

<style scoped>
.usage-pie-chart {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.chart {
  width: 100%;
  height: 100%;
}
</style>
