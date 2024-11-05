<template>
  <div id="app">
    <!-- 固定顶部导航栏 -->
    <nav class="navbar">
      <ul>
        <li
          v-for="(page, index) in pages"
          :key="index"
          :class="{ active: currentPage === index }"
          @click="goToSection(index)"
        >
          {{ page }}
        </li>
      </ul>
    </nav>

    <div id="fullpage">
      <div
        v-for="(component, index) in pageComponents"
        :key="index"
        class="section"
        :class="'section' + (index + 1)"
      >
        <component :is="component" />
      </div>
    </div>
  </div>
</template>

<script>
import fullpage from 'fullpage.js';
import 'fullpage.js/dist/fullpage.css';

// 导入重命名的页面组件
import PageOne from './components/PageOne.vue';
import PageTwo from './components/PageTwo.vue';
import PageThree from './components/PageThree.vue';
import PageFour from './components/PageFour.vue';
import PageFive from './components/PageFive.vue';

export default {
  name: 'App',
  components: {
    PageOne,
    PageTwo,
    PageThree,
    PageFour,
  },
  data() {
    return {
      pages: ['第一页', '第二页', '第三页', '第四页','第五页'], // 页面名称
      currentPage: 0, // 当前页面索引
      pageComponents: [PageOne, PageTwo, PageThree, PageFour,PageFive], // 页面组件数组
      fullpageInstance: null, // 存储 fullpage.js 实例
    };
  },
  mounted() {
    // 初始化 fullpage.js
    this.fullpageInstance = new fullpage('#fullpage', {
      navigation: true,
      scrollingSpeed: 700,
      anchors: this.pages.map((_, index) => `page${index + 1}`), // 自动生成锚点
      navigationTooltips: this.pages, // 使用 pages 数组作为导航提示
      showActiveTooltip: true,
      afterLoad: (origin, destination) => {
        this.currentPage = destination.index; // 更新当前页面索引
      },
    });
  },
  methods: {
    // 导航栏点击事件，跳转到对应的页面
    goToSection(index) {
      if (this.fullpageInstance) {
        this.fullpageInstance.moveTo(index + 1); // 使用实例 API
      }
    },
  },
};
</script>

<style>
/* 设置页面样式 */
#app {
  font-family: Arial, sans-serif;
}

.navbar {
  position: fixed;
  top: 0;
  width: 100%;
  background-color: #333;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 0;
  z-index: 1000;
}

.navbar ul {
  list-style-type: none;
  display: flex;
  gap: 20px;
  margin: 0;
  padding: 0;
}

.navbar li {
  cursor: pointer;
  padding: 5px 10px;
  font-size: 18px;
}

.navbar li.active {
  font-weight: bold;
  color: #ffd700;
}

.section {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.section1 {
  background-color: #ffadad;
}

.section2 {
  background-color: #ffd6a5;
}

.section3 {
  background-color: #fdffb6;
}

.section4 {
  background-color: #caffbf;
}
</style>
