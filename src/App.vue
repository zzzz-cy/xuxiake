<template>
  <div id="app">
    <!-- 固定顶部导航栏 -->
    <nav class="navbar">
      <ul>
        <li v-for="(page, index) in pages" :key="index" :class="{ active: currentPage === index }">
          {{ page }}
        </li>
      </ul>
    </nav>

    <div id="fullpage">
      <div v-for="(page, index) in pages" :key="index" class="section" :class="'section' + (index + 1)">
        {{ page }}
      </div>
    </div>
  </div>
</template>

<script>
import fullpage from 'fullpage.js';
import 'fullpage.js/dist/fullpage.css';

export default {
  name: 'App',
  data() {
    return {
      pages: ['第一页', '第二页', '第三页', '第四页'], // 页面名称
      currentPage: 0, // 当前页面索引
    };
  },
  mounted() {
    new fullpage('#fullpage', {
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
  font-size: 2em;
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
