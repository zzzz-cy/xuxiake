<template>
  <div ref="chart" class="chart-container"></div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  name: 'PageOne',
  data() {
    return {
      colors: ['#FFAE57', '#FF7853', '#EA5151', '#CC3F57', '#9A2555'],
      bgColor: '#2E2733',
      itemStyle: {
        star5: { color: '#FFAE57' },
        star4: { color: '#FF7853' },
        star3: { color: '#EA5151' },
        star2: { color: '#CC3F57' }
      },
      data: [
        {
          name: '虚构',
          itemStyle: { color: '#FF7853' },
          children: [
            {
              name: '小说',
              children: [
                { name: '5☆', children: [{ name: '疼' }, { name: '慈悲' }, { name: '楼下的房客' }] },
                { name: '4☆', children: [{ name: '虚无的十字架' }, { name: '无声告白' }, { name: '童年的终结' }] },
                { name: '3☆', children: [{ name: '疯癫老人日记' }] }
              ]
            },
            // 省略部分数据
          ]
        },
        {
          name: '非虚构',
          itemStyle: { color: '#EA5151' },
          children: [
            {
              name: '设计',
              children: [
                { name: '5☆', children: [{ name: '无界面交互' }] },
                { name: '4☆', children: [{ name: '数字绘图的光照与渲染技术' }, { name: '日本建筑解剖书' }] },
                { name: '3☆', children: [{ name: '奇幻世界艺术\n&RPG地图绘制讲座' }] }
              ]
            },
            // 省略部分数据
          ]
        }
      ]
    };
  },
  mounted() {
    this.formatData();
    this.initChart();
  },
  methods: {
    formatData() {
      const { data, colors, itemStyle } = this;
      for (let j = 0; j < data.length; ++j) {
        const level1 = data[j].children;
        for (let i = 0; i < level1.length; ++i) {
          const block = level1[i].children;
          const bookScore = [];
          let bookScoreId;
          for (let star = 0; star < block.length; ++star) {
            let style = (function (name) {
              switch (name) {
                case '5☆':
                  bookScoreId = 0;
                  return itemStyle.star5;
                case '4☆':
                  bookScoreId = 1;
                  return itemStyle.star4;
                case '3☆':
                  bookScoreId = 2;
                  return itemStyle.star3;
                case '2☆':
                  bookScoreId = 3;
                  return itemStyle.star2;
              }
            })(block[star].name);
            block[star].label = { color: style.color, downplay: { opacity: 0.5 } };
            if (block[star].children) {
              style = { opacity: 1, color: style.color };
              block[star].children.forEach((book) => {
                book.value = 1;
                book.itemStyle = style;
                book.label = { color: style.color };
                let value = bookScoreId === 0 || bookScoreId === 3 ? 5 : 1;
                if (bookScore[bookScoreId]) {
                  bookScore[bookScoreId].value += value;
                } else {
                  bookScore[bookScoreId] = { color: colors[bookScoreId], value };
                }
              });
            }
          }
          level1[i].itemStyle = { color: data[j].itemStyle.color };
        }
      }
    },
    initChart() {
      const chart = echarts.init(this.$refs.chart);
      chart.setOption({
        backgroundColor: 'transparent',
        color: this.colors,
        series: [
          {
            type: 'sunburst',
            center: ['50%', '50%'],
            radius: ['0%', '150%'],
            data: this.data,
            sort: function (a, b) {
              if (a.depth === 1) return b.getValue() - a.getValue();
              return a.dataIndex - b.dataIndex;
            },
            label: { rotate: 'radial', color: this.bgColor },
            itemStyle: { borderColor: this.bgColor, borderWidth: 2 },
            levels: [
              {},
              { r0: 0, r: 60, label: { rotate: 0 } },
              { r0: 60, r: 150 },
              {
                r0: 170,
                r: 210,
                itemStyle: { shadowBlur: 2, shadowColor: this.colors[2], color: 'transparent' },
                label: { rotate: 'tangential', fontSize: 10, color: this.colors[0] }
              },
              {
                r0: 210,
                r: 220,
                itemStyle: { shadowBlur: 80, shadowColor: this.colors[0] },
                label: { position: 'outside', textShadowBlur: 5, textShadowColor: '#333' },
                downplay: { label: { opacity: 0.5 } }
              }
            ]
          }
        ]
      });
    }
  }
};
</script>

<style scoped>
.page-content {
  text-align: center;
  padding-top: 20px;
}
.chart-container {
  width: 100%;
  height: 100%;
}

</style>
