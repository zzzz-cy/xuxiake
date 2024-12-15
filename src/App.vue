<template>
  <div id="app">
    <!-- 固定顶部导航栏 -->
    <nav class="navbar">
      <!-- 添加左侧 logo 图片 -->
      <img src="./assets/img/logo.png" alt="Logo" class="logo" />
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
      pages: ['游记路线可视化', '游记情感词统计', '省份游历甘特图', '徐霞客与山水名胜','徐霞客与各色景观'], // 页面名称
      currentPage: 0, // 当前页面索引
      pageComponents: [PageOne, PageTwo, PageThree, PageFour, PageFive], // 页面组件数组
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
  justify-content: space-between; /* 让 logo 和导航项分开 */
  align-items: center;
  padding: 10px 20px;
  z-index: 1000;
}

.navbar .logo {
  height: 40px; /* 设置 logo 图片的高度 */
}

.navbar ul {
  list-style-type: none;
  display: flex;
  gap: 20px;
  margin: 0;
  padding: 0;
  flex-grow: 1; /* 让导航项占据剩余空间 */
  justify-content: center; /* 在剩余空间内居中对齐 */
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
  background-color: #e4e0cf; /* 默认背景色 */
   /* 缩小背景图片，确保完全显示 */
  
  background-repeat: no-repeat; /* 防止背景图片重复 */
}

.section1 {
  background-image: url('./assets/img/background.png'); /* 第一页背景 */
  background-position: left bottom; /* 背景图片靠左下 */
  background-size: 50%;
}

.section2 {
  background-image: url('./assets/img/background.png'); /* 第二页背景 */
  background-position: left bottom; /* 背景图片靠左下 */
  background-size: 50%;
}

.section3 {
  background-image: url('./assets/img/background3.png'); /* 第三页背景 */
  background-position: right bottom;
  background-size: 35%;
}

.section4 {
  background-image: url('./assets/img/background.png'); /* 第四页背景 */
  background-position: left bottom; /* 背景图片靠左下 */
  background-size: 50%;
}

.section5 {
  background-image: url('./assets/img/background.png'); /* 第五页背景 */
  background-position: left bottom; /* 背景图片靠左下 */
  background-size: 50%;
}
</style>
