<template>
  <div class="page-container">
    <!-- 左侧章节容器 -->
    <div class="chapter-list">
      <div
        v-for="(chapter, index) in chapters"
        :key="index"
        class="chapter-item"
        :class="{ active: activeChapter === index }"
        @click="selectChapter(index)"
      >
        {{ chapter }}
      </div>
    </div>
    <!-- 中间章节容器 -->
    <div class="page-content">
      <!-- 矢量容器 -->
      <div ref="mapContainer" class="map-container">
        <img src="/images/south.png" alt="南海" class="south-china-sea-image" />
      </div>
    </div>
    <!-- 右侧故事容器 -->   
    <div class="story-content">
      <div id="place-impo-container" class="top-content">
        <!-- 上面的内容 -->
        <h3 class="title">地点信息</h3>
        <p class="inner-content" v-html="placeInfoDisplay"></p>
      </div>
      <div id="place-info-container" class="bottom-content">
        <!-- 下面的内容 -->
        <h3 class="title">重要事件</h3>
        <p class="inner-content" v-html="placeImpoDisplay"></p>
      </div>
    </div>
  </div>
</template>

<script>
import * as d3 from "d3";

export default {
  name: "PageOne",
  data() {
    return {
      timelineY: 0,
      timelineX: 0,
      len: 4,

      svg: null,        // SVG 对象
      projection: null, // 存储地图投影对象

      chapters: [], // 存储章节名
      activeChapter: null, // 当前选中的章节索引

      locations: [], // 存储地点信息
      selectedLocations: [], // 存储选中的地点数据

      timeData: [], // 存储有时间信息的数据
      selectedTimeData: [], // 存储选中的时间数据

      lines: [],  // 动态存储曲线数据

      placeInfoDisplay: "这里会显示地点信息", // 默认信息
      placeImpoDisplay: "这里会显示重要事件信息", // 默认信息.", // 默认重要事件信息
    };
  },
  async mounted() {
    // 首次加载时
    await this.initOnResize();
    // 监听窗口大小变化
    window.addEventListener('resize', this.initOnResize);
  },
  beforeUnmount() {
    // 移除监听，避免内存泄漏
    window.removeEventListener('resize', this.initOnResize);
  },
  methods: {

    async initOnResize() {
      this.resetData();
      // 等待异步数据加载
      await Promise.all([
        this.loadChapters(),  // 异步加载章节数据
        this.loadLocationData(),  // 异步加载地点数据
        this.loadTimeData(),  // 异步加载时间数据
      ]);
      this.initMap();  // 初始化地图
    },
    resetData() {
      this.timelineY = 0;
      this.timelineX = 0;
      const container = this.$refs.mapContainer; // 获取地图容器
      // // 清空所有图像
      // const images = container.querySelectorAll('img');
      // images.forEach(img => img.remove());  // 移除所有图像

      // 清空所有 SVG 元素
      const svgs = container.querySelectorAll('svg');
      svgs.forEach(svg => svg.remove());  // 移除所有 SVG 元素
      this.svg = null;        // SVG 对象
      this.projection = null; // 地图投影对象
    },
       // 加载章节名
    async loadChapters() {
      try {
        const response = await fetch("/data/chapters.json"); // JSON 文件路径
        const data = await response.json();
        this.chapters = data.chapters;
      } catch (error) {
        console.error("Failed to load chapters:", error);
      }
    },
    // 提取时间中的第一个年份
    extractDate(timeString) {
      if (timeString == null) {
        return new Date(1940, 0, 1); // 如果没有时间，默认为 1940 年 1 月 1 日
      }

      // 1. 提取年份（括号中的四位数字）
      const yearRegex = /[（(](\d{4})[）)]/;
      const yearMatch = timeString.match(yearRegex); // 获取年份匹配结果
      const year = yearMatch ? parseInt(yearMatch[1], 10) : 1940;  // 如果找到年份，返回年份，否则默认为 1940 年

      // 2. 提取月份（如果有月字）
      const monthRegex = /(\d+)(?=月)/;  // 匹配数字和后面的"月"
      const monthMatch = timeString.match(monthRegex);
      const month = monthMatch ? parseInt(monthMatch[1], 10) - 1 : 0;  // 月份从0开始，没找到则默认为1月

      // 3. 提取日期（如果有日字）
      const dayRegex = /(\d+)(?=日)/;  // 匹配数字和后面的"日"
      const dayMatch = timeString.match(dayRegex);
      const day = dayMatch ? parseInt(dayMatch[1], 10) : 1;  // 没找到则默认为1日

      // 返回构造的日期对象
      return new Date(year, month, day);  // 返回根据提取的年份、月份、日期生成的日期对象
    },

    // 加载地点数据
    async loadLocationData() {
      try {
        const response = await fetch("/data/dataset_total.json"); // 数据文件路径
        const data = await response.json();
        // 只提取地名和经纬度
        this.locations = data.map(item => ({
          name: item["地名"],
          lon: item["地点经度（默认东经）"],
          lat: item["地点纬度（默认北纬）"],
          chapter: item["所属篇目"],  // 添加“所属篇目”字段
          route: item["详细路线"],    // 添加“详细路线”字段
          // time: this.extractYear(item["游历时间"])  // 提取年份
        }));
        
      } catch (error) {
        console.error("Failed to load location data:", error);
      }
    },
    // 加载时间数据
    async loadTimeData() {
      try {
        const response = await fetch("/data/dataset_time.json"); // 数据文件路径
        const data = await response.json();
        // 只提取地名和经纬度
        this.timeData = data.map(item => ({
          name: item["地名"],
          lon: item["地点经度（默认东经）"],
          lat: item["地点纬度（默认北纬）"],
          chapter: item["所属篇目"],  // 添加“所属篇目”字段
          route: item["详细路线"],    // 添加“详细路线”字段
          time: this.extractDate(item["游历时间"]),  // 提取年份
          info: item["地点信息补充（来自百科）"],
          impo: item["重要事件"],
        }));
        console.log("Original data length:", data.length);
        console.log("Processed timeData length:", this.timeData.length);

      } catch (error) {
        console.error("Failed to load location data:", error);
      }
    },

    // 选择章节
    selectChapter(index) {
      this.activeChapter = index;
      const selectedChapter = this.chapters[index];
      console.log("1");
      // 筛选出"所属篇目"为选中章节的数据
      this.selectedLocations = this.locations.filter(item => item.chapter === selectedChapter);
      // 筛选出"所属篇目"为选中章节的数据
      this.selectedTimeData = this.timeData.filter(item => item.chapter === selectedChapter);
      // 关联地点和时间数据
      this.relate();
    },
    // 绘制地图路径
    async drawMapPath(svg, projection) {
      return new Promise((resolve, reject) => {
        d3.json("/data/china.geo.json").then(mapData => {
          const path = d3.geoPath().projection(projection);
          svg.append("g")
            .selectAll("path")
            .data(mapData.features)
            .enter()
            .append("path")
            .attr("d", path)
            .style("fill", "#f9f9f9")
            .on("mouseover", (event, d) => {
              d3.select(event.currentTarget).style("fill", "#b7ae8f");
              this.createTooltip(svg, d, event);
            })
            .on("mousemove", (event) => {
              this.removeTooltip();
              this.createTooltip(svg, null, event);
            })
            .on("mouseout", (event) => {
              d3.select(event.currentTarget).style("fill", "#f9f9f9");
              this.removeTooltip();
            });

          // 绘制完成后调用 resolve
          resolve();
        }).catch(reject); // 如果失败，则调用 reject
      });
    },
    // 在选择章节时关联地图上的点和时间标尺
    async relate() {
      // const container = this.$refs.mapContainer;
      // const width = container.clientWidth;
      // const height = container.clientHeight;
      // const centerX = width / 2;
      

      const svg = d3.select(this.$refs.mapContainer).select("svg");  // 选择地图的 svg 容器
      svg.selectAll("circle").remove();  // 清除之前绘制的地点圆圈
      svg.selectAll(".location-line").remove();
      svg.selectAll(".tick").remove();
      // 高亮当前章节的地点，灰色其他地点
      await this.drawLocationCircles(svg, this.projection, this.selectedLocations);
      await this.drawLocationLines(svg, this.projection, this.selectedLocations, this.len);
      
      // 获取时间标尺容器的 g 元素
      const timelineGroup = svg.select(".timeline-group");
    
      // const timelineWidth = svg.node().getBoundingClientRect().width;
      const timelineWidth = this.timelineX;
      const timelineHeight = 60;  // 时间标尺的高度

      const centerY = this.timelineY;

      // 1. 清除之前的时间连接线和时间点
      svg.selectAll(".timeline-link").remove();
      svg.selectAll(".location-circle").remove();  // 清除之前绘制的地点圆圈
      timelineGroup.selectAll(".timeline-point").remove(); // axis-label清除之前的时间点
      svg.selectAll(".axis-label").remove();
      timelineGroup.selectAll(".timeline-text").remove();
      // 清除之前绘制的时间轴
      timelineGroup.select(".timeline-axis").remove();

      // 时间数据范围
      const minDate = d3.min(this.selectedTimeData, d => new Date(d.time));
      const maxDate = d3.max(this.selectedTimeData, d => new Date(d.time));

      // 计算时间跨度（以毫秒为单位）
      const timeSpan = maxDate - minDate;

      // 根据时间跨度动态调整最小和最大日期
      let adjustedMinDate, adjustedMaxDate;
      if (timeSpan <= 365 * 24 * 60 * 60 * 1000) {  // 小于一年
        adjustedMinDate = d3.timeMonth.offset(minDate, -1);  // 最小日期为实际最小日期的前1个月
        adjustedMaxDate = d3.timeMonth.offset(maxDate, 1);   // 最大日期为实际最大日期的后1个月
      } else {  // 大于一年
        adjustedMinDate = d3.timeYear.offset(minDate, -1);   // 最小日期为实际最小日期的前1年
        adjustedMaxDate = d3.timeYear.offset(maxDate, 1);    // 最大日期为实际最大日期的后1年
      }

      // 2. 根据选中的时间数据，更新时间标尺
      const xScale = d3.scaleTime()
        .domain([adjustedMinDate, adjustedMaxDate])
        .range([30, timelineWidth - 30]);

      // 动态设置时间刻度的间隔
      const interval = timeSpan <= 365 * 24 * 60 * 60 * 1000 // 小于一年
        ? d3.timeMonth.every(1)  // 每月一个刻度
        : d3.timeYear.every(1);  // 每年一个刻度

      // 绘制时间轴刻度
      const axisBottom = d3.axisBottom(xScale).ticks(interval).tickFormat(d3.timeFormat("%Y-%m"));
      timelineGroup.append("g")
        .attr("class", "timeline-axis")
        .attr("transform", `translate(0, ${centerY + timelineHeight / 2})`)
        .call(axisBottom)
        .selectAll(".tick text") // 选择刻度文本
        .style("font-size", "15px") // 调大字体
        .style("font-weight", "bold") // 加粗字体
        .style("fill", "#000000"); // 设置字体颜色

      // 修改刻度线的样式
      timelineGroup.selectAll(".tick line") // 修改刻度线的颜色
        .attr("y1", -30)
        .attr("y2", timelineHeight - 30)
        .style("stroke", "#b7ae8f") // 红色
        .style("stroke-width", "1"); // 调整线宽

      // 隐藏横轴线 (即 path 元素)
      timelineGroup.select(".timeline-axis path")
          .style("display", "none"); // 隐藏横轴线

      // 绘制时间轴上的每个点
      timelineGroup.selectAll(".timeline-point")
        .data(this.selectedTimeData)
        .enter()
        .append("circle")
        .attr("class", "timeline-point")
        .attr("cx", (d, i) => {
          const baseX = xScale(new Date(d.time)); // 根据时间绘制位置
          const offsetX = i * 0;  // 根据索引为点添加水平偏移（你可以调整这个值）
          return baseX + offsetX; // 添加偏移后的X坐标
        })
        .attr("cy", centerY + timelineHeight / 2) // 在时间标尺中居中显示
        .attr("r", 6)
        .attr("fill", "#b7ae8f")
        .style("opacity", 0.7);   
        
      const mini = 40; // 设置最小距离
      // 2. 绘制时间文本
      timelineGroup.selectAll(".timeline-text")
        .data(this.selectedTimeData)
        .enter()
        .append("text")
        .attr("class", "timeline-text")
        .attr("x", (d, i) => {
          const baseX = xScale(new Date(d.time)); // 根据时间绘制位置
          const offsetX = i * 0;  // 根据索引为点添加水平偏移
          return baseX + offsetX;
        })
        .attr("y", centerY + 20 + timelineHeight / 2) // 文字位置稍微在点的下方
        .attr("dy", -30) // 微调文字的垂直位置
        .attr("text-anchor", "middle") // 文字居中显示
        .text((d, i, nodes) => {
          const currentX = xScale(new Date(d.time)); // 当前点的x坐标
          const leftX = i > 0 ? xScale(new Date(this.selectedTimeData[i - 1].time)) : -Infinity;
          const rightX = i < this.selectedTimeData.length - 1 ? xScale(new Date(this.selectedTimeData[i + 1].time)) : Infinity;
          // 返回只包含“日月”的格式
          const date = new Date(d.time);
          const options = { month: '2-digit', day: '2-digit' }; // 格式为 MM/DD

          if(i===0 || i===this.selectedTimeData.length-1){
              return new Intl.DateTimeFormat('en-US', options).format(date); // 或 'en-US' 等
            }
          // 如果与左右点的距离都小于 mini，不显示文字:&& Math.abs(currentX - rightX) < mini
          if (Math.abs(currentX - leftX) < mini) {
            nodes[i].remove(); // 移除该元素
            return null; // 不设置文本
          }
          if(i===this.selectedTimeData.length-2 && Math.abs(currentX - rightX) < mini){
            nodes[i].remove(); // 移除该元素
            return null; // 不设置文本
          }
          return new Intl.DateTimeFormat('en-US', options).format(date); // 或 'en-US' 等
        })
        .style("font-size", "15px")
        .style("font-weight", "bold") // 加粗字体
        .style("fill", "#000000");

      // 3. 添加坐标轴名称（时间轴名称）
      svg.append("text")
        .attr("class", "axis-label")
        .attr("x", (timelineWidth *0.95))  // 将文本放置在画布的中心
        .attr("y", centerY + timelineHeight / 2 - 10) // 放置在时间轴下方
        .attr("text-anchor", "middle")
        .text("时间轴")  // 设置坐标轴的名称
        .style("font-size", "16px")
        .style("font-weight", "bold");

      // 4. 绘制时间连接线（从每个地点到时间点）
      const lineGroup = svg.append("g").attr("class", "timeline-link");


      // 创建一个时间轴上的点与地图上地点之间的连接曲线
      lineGroup.selectAll("path")  // 使用path而不是line来绘制曲线
          .data(this.selectedTimeData)
          .enter()
          .append("path")
          .attr("class", "timeline-link")
          .attr("d", (d, i) => {
            // 为终点添加偏移量，避免重叠
            const offsetX = i * 0;  // 可以根据索引调整偏移量（例如 5px）
            const offsetY = 0;  // 可以根据需要在y方向上加偏移，调整终点的y位置

            // 定义曲线的起点和终点以及控制点
            const start = [xScale(new Date(d.time)) + offsetX, centerY + timelineHeight / 2 + offsetY];  // 时间点的x坐标和y坐标
            

            // 地点的x坐标和y坐标，添加偏移量
            const end = this.projection([d.lon, d.lat]);
            

            // 定义控制点用于绘制曲线 (你可以根据需要调整控制点的位置)
            const controlPoint = [
                (start[0] + end[0]) / 2, // 控制点的x坐标
                (start[1] + end[1]) / 2 - 50  // 控制点的y坐标，偏移使曲线有弯曲
            ];

              // 使用贝塞尔曲线进行绘制
            return d3.line().curve(d3.curveCardinal).x(d => d[0]).y(d => d[1])([start, controlPoint, end]);
              // 曲线的起点、控制点和终点
          })
          .attr("fill", "none")
          .attr("stroke", "#b7ae8f")
          .attr("stroke-width", 2)
          .style("opacity", 0.5)
          .style("stroke-dasharray", "4,4");  // 添加虚线效果
      // 绘制每个时间点下方的圆角矩形
      const rectWidth = 35;  // 设置矩形宽度
      const rectHeight = 90; // 设置矩形高度
      const offsets = [-73, 98, 12]; // 定义一个数组，存储偏移值
      lineGroup.selectAll(".timeline-rect")
        .data(this.selectedTimeData)
        .enter()
        .append("rect")
        .attr("class", "timeline-rect")
        .attr("x", (d, i) => {
          const baseX = xScale(new Date(d.time)); // 根据时间绘制位置
          const offsetX = i * 0;  // 根据索引为点添加水平偏移
          return baseX + offsetX - rectWidth / 2; // 确保矩形居中
        })
        .attr("y", (d, i) => {
          const baseY = centerY + 130; // 根据时间绘制位置
          const offsetY = offsets[i % 3];  // 根据索引为每个矩形添加垂直偏移
          return baseY + offsetY;  // 确保矩形有足够的垂直间距
        })
        .attr("width", rectWidth)
        .attr("height", rectHeight)
        .attr("rx", 8)  // 圆角矩形
        .attr("ry", 8)
        .attr("fill", "#b7ae8f")
        .attr("style", "pointer-events: visible")
        .on("click", (event, d) => {  // 使用箭头函数
          console.log(this);  // 确保 this 指向了 rect 元素
          const placeImpo = d.impo;
          const placeInfo = d.info;
          this.placeImpoDisplay = placeImpo ? placeImpo : "无";
          this.placeInfoDisplay = placeInfo ? placeInfo : "无";
            // 设置点击后颜色为白色
          d3.select(event.target).attr("fill", "#f9f9f9");
        })
        .on("mouseover", function() {
          d3.select(this)  // 选择当前的矩形
            .transition()  // 添加过渡效果
            .duration(300)  // 设置过渡时间为300ms
            .attr("fill", "#f9f9f9")  // 鼠标经过时改变矩形颜色
            .attr("cursor", "pointer")  // 改变鼠标光标为手形
            .style("opacity", 0.8);  // 改变透明度
        })
        .on("mouseout", function() {
          d3.select(this)  // 选择当前的矩形
            .transition()  // 添加过渡效果
            .duration(300)  // 设置过渡时间为300ms
            .attr("fill", "#b7ae8f")  // 恢复原来的颜色
            .style("opacity", 1);  // 恢复透明度
        });


      // 绘制每个矩形和时间点之间的连接线
      lineGroup.selectAll(".timeline-line")
        .data(this.selectedTimeData)
        .enter()
        .append("line")
        .attr("class", "timeline-line")
        .attr("x1", (d, i) => {
          const baseX = xScale(new Date(d.time)); // 时间点x坐标
          const offsetX = i * 0;  // 水平偏移
          return baseX + offsetX;
        })
        .attr("y1", centerY + timelineHeight / 2) // 时间点y坐标
        .attr("x2", (d, i) => {
          const baseX = xScale(new Date(d.time)); // 时间点x坐标
          const offsetX = i * 0;  // 水平偏移
          return baseX + offsetX;
        })
        .attr("y2", (d, i) => {
          const baseY = centerY+ 130; // 根据时间绘制位置
          const offsetY = offsets[i % 3];  // 根据索引为每个矩形添加垂直偏移
          return baseY + offsetY;  // 确保矩形有足够的垂直间距
        })
        .attr("stroke", "#b7ae8f")
        .attr("stroke-width", 2)
        .style("opacity", 0.5);
      // const rectWidth = 30;  // 设置矩形宽度
      // const rectHeight = 80; // 设置矩形高度
      // 在矩形中添加文本
      lineGroup.selectAll(".timeline-text")
        .data(this.selectedTimeData)
        .enter()
        .append("text")
        .attr("class", "timeline-text")
        .attr("x", (d, i) => {
          const baseX = xScale(new Date(d.time)); // 根据时间绘制位置
          const offsetX = i * 0;  // 根据索引为点添加水平偏移
          return baseX + offsetX;
        })
        .attr("y", (d, i) => {
          const baseY = centerY + 128; // 根据时间绘制位置
          const offsetY = offsets[i % 3];  // 根据索引为每个矩形添加垂直偏移
          return baseY + offsetY;  // 确保矩形有足够的垂直间距
        })
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#000")
        .attr("style", "pointer-events: none")
        .each(function(d) {
          const textElement = d3.select(this);
          const characters = d.name.split(""); // 将 name 拆分为字符数组
          const num = 6; // 每列最大字符数
          const columnOffset = 12; // 列的水平偏移距离
          const set2 = -2; // 字符数为 2 时，上移 10
          const set3 = 1.5; // 字符数为 3 时，上移 15
          const set4 = 5; // 字符数为 3 时，上移 15
          const set5 = 8;  // 字符数大于 5 时，下移 20

          // 设置 x 偏移量参数
          const setX2 = 6; // 列数为 2 时，x 偏移
          const setX3 = 12; // 列数为 3 时，x 偏移
          const setX4 = 11; // 列数为 3 时，x 偏移

          // 动态调整父节点的 y 偏移
          const totalCharacters = characters.length;
          let yOffset = 0; // 默认偏移量为 0
          if (totalCharacters === 2) {
            yOffset = set2; // 当字符数为 2 时，调整 y 偏移量
          } else if (totalCharacters === 3) {
            yOffset = set3; // 当字符数为 3 时，调整 y 偏移量
          } else if (totalCharacters === 4) {
            yOffset = set4; // 当字符数为 3 时，调整 y 偏移量
          } else if (totalCharacters >= 5) {
            yOffset = set5; // 当字符数大于 5 时，调整 y 偏移量
          }
          textElement.attr("y", +textElement.attr("y") + yOffset); // 更新父节点的 y 坐标
          // 动态计算行高
          const lineHeight = totalCharacters <= num ? 6 / totalCharacters : 1;

          // 动态调整父节点的 x 偏移
          const totalColumns = Math.ceil(totalCharacters / num); // 计算列数
          let xOffset = 0; // 默认 x 偏移为 0
          if (totalColumns === 2) {
            xOffset = setX2; // 列数为 2 时，调整 x 偏移
          } else if (totalColumns === 3) {
            xOffset = setX3; // 列数为 3 时，调整 x 偏移
          }else if (totalColumns === 4) {
            xOffset = setX4; // 列数为 3 时，调整 x 偏移
          }
          textElement.attr("x", +textElement.attr("x") + xOffset); // 更新父节点的 x 坐标

          characters.forEach((char, index) => {
            const column = Math.floor(index / num); // 当前字符的列号
            const row = index % num; // 当前字符在列中的行号

            textElement.append("tspan")
              .attr("x", +textElement.attr("x") - column * columnOffset) // 向左偏移
              .attr("dy", row === 0 && column > 0 ? `-${(num - 1) * lineHeight}em` : lineHeight + "em")
              .text(char); // 设置 tspan 的文本内容
          });
        });

      console.log("Relating data completed");
    },

    // 绘制地点圆圈
    async drawLocationCircles(svg, projection, locations) {
      return new Promise((resolve) => {
        svg.append("g")
          .selectAll("circle")
          .data(this.locations)
          .enter()
          .append("circle")
          .attr("cx", (d) => projection([d.lon, d.lat])[0]) // 经度和纬度转为坐标
          .attr("cy", (d) => projection([d.lon, d.lat])[1])
          .attr("r", 2) // 圆圈半径
          .attr("fill", d => {
            // 如果该地点属于当前章节，显示为红色，否则为灰色
            return locations.includes(d) ? "#b7ae8f" : "#808080";
          }) // 圆圈颜色为红色
          .on("click", (d) => {
            console.log(`Clicked on location: ${d.name}`);
          });

        // 圆圈绘制完成后调用 resolve
        resolve();
      });
    },

    // 绘制地点之间的连接线
    async drawLocationLines(svg, projection, locations, len) {
      return new Promise((resolve) => {
        const lineGroup = svg.append("g");
        for (let i = 0; i < this.locations.length - 1; i++) {
          const start = this.locations[i];
          const end = this.locations[i + 1];
          // 判断经度或纬度差是否超过阈值 len
          if (Math.abs(start.lon - end.lon) < len && Math.abs(start.lat - end.lat) < len) {
            lineGroup.append("line")
              .attr("class", "location-line") // 为每条线添加一个 class，便于后续清除
              .attr("x1", projection([start.lon, start.lat])[0])
              .attr("y1", projection([start.lon, start.lat])[1])
              .attr("x2", projection([end.lon, end.lat])[0])
              .attr("y2", projection([end.lon, end.lat])[1])
              .attr("stroke", locations.includes(start) && locations.includes(end) ? "#b7ae8f" : "#808080") // 线的颜色
              .attr("stroke-width", 1); // 线的宽度
          }
        }

        // 连接线绘制完成后调用 resolve
        resolve();
      });
    },
    async initMap() {
      try {
        // // 清除所有容器内的图像和矢量图形（SVG）
        // const images = container.querySelectorAll('img');
        // images.forEach(img => img.remove());  // 移除所有图像

        // const svgs = container.querySelectorAll('svg');
        // svgs.forEach(svg => svg.remove());  // 移除所有 SVG 元素
        // 获取 `mapContainer` 的 DOM 元素
        const container = this.$refs.mapContainer;
        console.log("Container height:", container.clientHeight);
        // 定义地图投影
        this.projection = d3.geoMercator()
          .center([107, 20]) // 地图中心位置
          .scale(container.clientHeight * 0.8) // 设置缩放量
          .translate([container.clientWidth / 1.85, container.clientHeight / 1.62]);

        // 创建 SVG，宽高使用 CSS 控制
        this.svg = d3
          .select(container)
          .append("svg")
          .attr("preserveAspectRatio", "xMidYMid meet") // 保持宽高比
          .attr("viewBox", `0 0 ${container.clientWidth} ${container.clientHeight}`);

        // 绘制地图路径、地点圆圈、连接线等
        await this.drawMapPath(this.svg, this.projection);
        await this.drawLocationCircles(this.svg, this.projection, this.locations);
        await this.drawLocationLines(this.svg, this.projection, this.locations, this.len);

        // 初始化时间标尺
        this.initTimeline(this.svg, container.clientHeight / 1.6); // 调整时间标尺的位置
      } catch (error) {
        console.error("地图数据加载失败:", error);
      }
    },
    initTimeline(mapSvg, mapHeight) {
      // 检查 mapSvg 是否有效
      if (!mapSvg || !mapSvg.node()) {
        console.error('SVG is not initialized correctly.');
        return;
      }
      const svg = mapSvg.append("g").attr("class", "timeline-group");

      const timelineWidth = mapSvg.node().getBoundingClientRect().width;
      const timelineHeight = 60;  // 高度设置为固定的 60px

      // 设置时间标尺的 y 坐标，使其位于地图下方
      const timelineYPosition = mapHeight + 20; // 调整时间标尺的位置，放置在地图下方
      this.timelineY = timelineYPosition; // 时间轴的 y 坐标
      this.timelineX = timelineWidth;
      // 创建一个时间轴的比例尺
      const xScale = d3.scaleTime()
        .domain([d3.min(this.timeData, d => new Date(d.time)),
          d3.max(this.timeData, d => new Date(d.time))])
        .range([0, timelineWidth]);

      // 绘制时间线的路径
      const line = d3.line()
        .x(d => xScale(new Date(d.time)))  // 根据时间来定位位置
        .y(timelineHeight / 2)  // 固定在垂直中心
        .curve(d3.curveMonotoneX);  // 平滑曲线
      svg.append("path")
        .data([this.timeData]) // 将所有地点数据作为路径
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "#b7ae8f")
        .attr("stroke-width", 3)
        .attr("marker-end", "url(#arrow)")  // 为路径添加箭头标记
        .attr("transform", `translate(0, ${timelineYPosition})`); // 设置时间标尺的位置

      console.log(xScale(new Date(this.timeData[50].time))); // 打印时间对应的X坐标

      // 可选：添加时间轴刻度
      const ticks = xScale.ticks(d3.timeYear.every(1)); // 每年一格
      svg.selectAll(".tick")
        .data(ticks)
        .enter().append("line")
        .attr("class", "tick")
        .attr("x1", d => xScale(d))
        .attr("x2", d => xScale(d))
        .attr("y1", 0)
        .attr("y2", timelineHeight)
        .attr("stroke", "#b7ae8f")
        .attr("stroke-width", 1)
        .attr("transform", `translate(0, ${timelineYPosition})`); // 设置刻度的位置

      // 定义箭头的marker
      svg.append("defs").append("marker")
        .attr("id", "arrow")  // 给箭头设置ID
        .attr("viewBox", "0 0 10 10")  // 设置箭头的视口
        .attr("refX", 8)  // 设置箭头的位置偏移量
        .attr("refY", 5)  // 设置箭头的Y偏移量
        .attr("markerWidth", 4)  // 箭头宽度
        .attr("markerHeight", 4)  // 箭头高度
        .attr("orient", "auto")  // 自动旋转以适应路径
        .attr("transform", `translate(0, ${timelineYPosition})`) // 设置刻度的位置
        .append("path")
        .attr("d", "M 0 0 L 10 5 L 0 10 z")  // 绘制箭头路径
        .attr("fill", "#b7ae8f");  // 设置箭头颜色
        
    },    

    
    createTooltip(svg, d, event) {
      const { x, y } = this.mouseXY(svg, event);

      svg
        .append("rect")
        .attr("id", "tooltip-box")
        .attr("x", x)
        .attr("y", y)
        .attr("width", 100)
        .attr("height", 40)
        .attr("fill", "#000")
        .attr("opacity", 0.6);

      svg
        .append("text")
        .attr("id", "tooltip-text")
        .attr("x", x + 50)
        .attr("y", y + 25)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("fill", "#fff")
        .text(d ? d.properties.name : "");
    },
    removeTooltip() {
      d3.select("#tooltip-box").remove();
      d3.select("#tooltip-text").remove();
    },
    mouseXY(svg, event) {
      const rect = svg.node().getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    },
  },
};
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;  /* 内容从左侧开始 */
  padding-top: 50px; /* 给顶部导航栏留空间 */
  padding-bottom: 0px;
  width: 100vw;
  height: calc(100vh - 50px); /* 减去顶部和底部 padding */
  overflow: hidden;
   /* 根据需要调整此值，避免与导航栏重叠 */
}
.chapter-list {
  display: flex;
  flex-direction: column;
  width: 20%; /* 动态调整宽度 */
  max-width: 250px; /* 最大宽度限制 */
  min-width: 150px; /* 最小宽度限制 */
  padding-top: 15px;
  padding-bottom: 15px;
  height: calc(100% - 30px);
  overflow-y: auto;
  background-color: #e4e0cf;
  border-right: 1px solid #ddd;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  flex-shrink: 0; /* 防止缩小 */
}
.chapter-item {
  padding: 10px;
  margin: 5px 10px 5px 12px;
  border-radius: 8px;
  background-color: #ffffff;
  color: #333;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
}
.chapter-item:hover {
  background-color: #b7ae8f;
  color: #ffffff;
}

.chapter-item.active {
  background-color: #e4e0cf;
  color: #ffffff;
}
.story-content{
  flex-direction: column;  /* 子容器上下排列 */
  width: calc(30% - 80px);
  max-width: 340px; /* 最大宽度限制 */
  min-width: 250px; /* 最小宽度限制 */
  flex-shrink: 0; /* 防止缩小 */
  padding-right: 40px; 
  padding-top: 40px;
  padding-bottom: 40px;
  padding-left: 45px;
  height: calc(100% - 80px);
  display: flex;
  justify-content: center; /* 垂直方向居中 */
  align-items: center;
  background-color: #e4e0cf;
}
.page-content {
  flex-grow: 1; /* 填充剩余空间 */
  width: 50%;  /* 不设置固定宽度 */
  height: 100%;            /* 父容器占满可用空间 */
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #e4e0cf;
  flex-shrink: 0; /* 防止缩小 */
}
.map-container {
  position: relative; /* 保证子元素可以相对定位 */
  margin: 0;
  width: 100%; /* 使用百分比宽度适配父容器 */
  
  height: 100%; /* 使用百分比高度适配父容器 */
  display: flex; /* 使用 flex 布局 */
  justify-content: center; /* 水平方向居中 */
  align-items: center; /* 垂直方向顶部对齐 */
  overflow: hidden; /* 隐藏超出的部分 */
  background-color: #e4e0cf;
  z-index: auto;
  flex-shrink: 0; /* 防止缩小 */
}
.map-container svg {
  width: 90%; /* 宽度占比 */
  height: 100%; /* 高度占比 */
}
.south-china-sea-image {
  position: absolute;
  top: 49%; /* 调整位置 */
  left: 84%;
  transform: translate(-50%, -50%); /* 居中 */
  width: 11%; /* 调整图片大小 */
  max-width: 10vw; /* 根据屏幕宽度限制图片大小 */
  max-height: 15vw; /* 根据屏幕高度限制图片大小 */
  height: auto; /* 保持图片比例 */
  z-index: 100; /* 根据需要调整叠加次序 */
}
.top-content {
  width: 100%;
  height: 50%;
  background-color: #f9f9f9;
  margin-bottom: 15px; /* 为了分隔上下内容 */
  overflow-y: auto;  /* 允许内容滚动 */
}
.bottom-content {
  width: 100%;
  height: 50%;
  background-color: #f9f9f9;
  overflow-y: auto;  /* 允许内容滚动 */
}
.inner-content{
  font-size: 20px;
  color: #333;
  line-height: 2.0;
  margin-bottom: 10px;
  text-indent: 2em;  /* 首段空两格 */
  overflow-y: auto;  /* 超过高度时出现滚动条 */
}
.title {
  font-size: 36px;
  text-align: center;
  margin: 0 auto;
}
</style>
