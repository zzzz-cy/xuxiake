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
      <div ref="mapContainer" class="map-container"></div>
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
    await Promise.all([
      this.loadChapters(), // 异步加载章节数据
      this.loadLocationData(), // 异步加载地点数据
      this.loadTimeData(),// 异步加载时间数据
    ]);
    this.initMap();
  },
  methods: {
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
            .style("fill", "#404466")
            .on("mouseover", (event, d) => {
              d3.select(event.currentTarget).style("fill", "#2CD8FF");
              this.createTooltip(svg, d, event);
            })
            .on("mousemove", (event) => {
              this.removeTooltip();
              this.createTooltip(svg, null, event);
            })
            .on("mouseout", (event) => {
              d3.select(event.currentTarget).style("fill", "#404466");
              this.removeTooltip();
            });

          // 绘制完成后调用 resolve
          resolve();
        }).catch(reject); // 如果失败，则调用 reject
      });
    },
    // 在选择章节时关联地图上的点和时间标尺
    async relate() {
      const svg = d3.select(this.$refs.mapContainer).select("svg");  // 选择地图的 svg 容器
      svg.selectAll("circle").remove();  // 清除之前绘制的地点圆圈
      svg.selectAll(".location-line").remove();
      svg.selectAll(".tick").remove();
      // 高亮当前章节的地点，灰色其他地点
      await this.drawLocationCircles(svg, this.projection, this.selectedLocations);
      await this.drawLocationLines(svg, this.projection, this.selectedLocations);
      
      // 获取时间标尺容器的 g 元素
      const timelineGroup = svg.select(".timeline-group");
      
      const timelineWidth = svg.node().getBoundingClientRect().width;
      const timelineHeight = 60;  // 时间标尺的高度
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
          .attr("transform", `translate(0, ${620 + timelineHeight / 2})`)
          .call(axisBottom)
          .selectAll(".tick line") // 修改刻度线的颜色
          .attr("y1", -30)
          .attr("y2", timelineHeight -30)
          .style("stroke", "#8918cf4a") // 红色
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
          const offsetX = i * 5;  // 根据索引为点添加水平偏移（你可以调整这个值）
          return baseX + offsetX; // 添加偏移后的X坐标
        })
        .attr("cy", 620 + timelineHeight / 2) // 在时间标尺中居中显示
        .attr("r", 6)
        .attr("fill", "#FF0000")
        .style("opacity", 0.7);      
      // 2. 绘制时间文本
      timelineGroup.selectAll(".timeline-text")
        .data(this.selectedTimeData)
        .enter()
        .append("text")
        .attr("class", "timeline-text")
        .attr("x", (d, i) => {
          const baseX = xScale(new Date(d.time)); // 根据时间绘制位置
          const offsetX = i * 5;  // 根据索引为点添加水平偏移
          return baseX + offsetX;
        })
        .attr("y", 640 + timelineHeight / 2) // 文字位置稍微在点的下方
        .attr("dy", -30) // 微调文字的垂直位置
        .attr("text-anchor", "middle") // 文字居中显示
        .text(d => new Date(d.time).toLocaleDateString()) // 格式化时间为日期
        .style("font-size", "12px")
        .style("fill", "#000000");

      // 3. 添加坐标轴名称（时间轴名称）
      svg.append("text")
        .attr("class", "axis-label")
        .attr("x", (timelineWidth *0.95))  // 将文本放置在画布的中心
        .attr("y", 650 + timelineHeight / 2) // 放置在时间轴下方
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
            const offsetX = i * 5;  // 可以根据索引调整偏移量（例如 5px）
            const offsetY = 0;  // 可以根据需要在y方向上加偏移，调整终点的y位置

            // 定义曲线的起点和终点以及控制点
            const start = [xScale(new Date(d.time)) + offsetX, 620 + timelineHeight / 2 + offsetY];  // 时间点的x坐标和y坐标
            

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
          .attr("stroke", "#FF0000")
          .attr("stroke-width", 2)
          .style("opacity", 0.5)
          .style("stroke-dasharray", "4,4");  // 添加虚线效果
      // 绘制每个时间点下方的圆角矩形
      const rectWidth = 30;  // 设置矩形宽度
      const rectHeight = 80; // 设置矩形高度

      lineGroup.selectAll(".timeline-rect")
        .data(this.selectedTimeData)
        .enter()
        .append("rect")
        .attr("class", "timeline-rect")
        .attr("x", (d, i) => {
          const baseX = xScale(new Date(d.time)); // 根据时间绘制位置
          const offsetX = i * 5;  // 根据索引为点添加水平偏移
          return baseX + offsetX - rectWidth / 2; // 确保矩形居中
        })
        .attr("y", (d, i) => {
          const baseY = 750; // 根据时间绘制位置
          const offsetY = (-1)**i * 60;  // 根据索引为每个矩形添加垂直偏移
          return baseY + offsetY;  // 确保矩形有足够的垂直间距
        })
        .attr("width", rectWidth)
        .attr("height", rectHeight)
        .attr("rx", 8)  // 圆角矩形
        .attr("ry", 8)
        .attr("fill", "#FFD700")
        .on("click", (event, d) => {  // 使用箭头函数
          const placeImpo = d.impo;
          const placeInfo = d.info;
          this.placeImpoDisplay = placeImpo ? placeImpo : "无";
          this.placeInfoDisplay = placeInfo ? placeInfo : "无";
        
        })
        .on("mouseover", function() {
          d3.select(this)  // 选择当前的矩形
            .transition()  // 添加过渡效果
            .duration(300)  // 设置过渡时间为300ms
            .attr("fill", "#FF6347")  // 鼠标经过时改变矩形颜色
            .attr("cursor", "pointer")  // 改变鼠标光标为手形
            .style("opacity", 0.8);  // 改变透明度
        })
        .on("mouseout", function() {
          d3.select(this)  // 选择当前的矩形
            .transition()  // 添加过渡效果
            .duration(300)  // 设置过渡时间为300ms
            .attr("fill", "#FFD700")  // 恢复原来的颜色
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
          const offsetX = i * 5;  // 水平偏移
          return baseX + offsetX;
        })
        .attr("y1", 620 + timelineHeight / 2) // 时间点y坐标
        .attr("x2", (d, i) => {
          const baseX = xScale(new Date(d.time)); // 时间点x坐标
          const offsetX = i * 5;  // 水平偏移
          return baseX + offsetX;
        })
        .attr("y2", (d, i) => {
          const baseY = 750; // 根据时间绘制位置
          const offsetY = (-1)**i * 60;  // 根据索引为每个矩形添加垂直偏移
          return baseY + offsetY;  // 确保矩形有足够的垂直间距
        })
        .attr("stroke", "#FF0000")
        .attr("stroke-width", 2)
        .style("opacity", 0.5);

      // 在矩形中添加文本
      lineGroup.selectAll(".timeline-text")
        .data(this.selectedTimeData)
        .enter()
        .append("text")
        .attr("class", "timeline-text")
        .attr("x", (d, i) => {
          const baseX = xScale(new Date(d.time)); // 根据时间绘制位置
          const offsetX = i * 5;  // 根据索引为点添加水平偏移
          return baseX + offsetX;
        })
        .attr("y", (d, i) => {
          const baseY = 770; // 根据时间绘制位置
          const offsetY = (-1)**i * 60;  // 根据索引为每个矩形添加垂直偏移
          return baseY + offsetY;  // 确保矩形有足够的垂直间距
        })
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#000")
        .text(d => d.name);  // 显示选中的name字段


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
          .attr("r", 5) // 圆圈半径
          .attr("fill", d => {
            // 如果该地点属于当前章节，显示为红色，否则为灰色
            return locations.includes(d) ? "#FF0000" : "#808080";
          }) // 圆圈颜色为红色
          .on("click", (d) => {
            console.log(`Clicked on location: ${d.name}`);
          });

        // 圆圈绘制完成后调用 resolve
        resolve();
      });
    },

    // 绘制地点之间的连接线
    async drawLocationLines(svg, projection, locations) {
      return new Promise((resolve) => {
        const lineGroup = svg.append("g");
        for (let i = 0; i < this.locations.length - 1; i++) {
          const start = this.locations[i];
          const end = this.locations[i + 1];
          lineGroup.append("line")
            .attr("class", "location-line") // 为每条线添加一个 class，便于后续清除
            .attr("x1", projection([start.lon, start.lat])[0])
            .attr("y1", projection([start.lon, start.lat])[1])
            .attr("x2", projection([end.lon, end.lat])[0])
            .attr("y2", projection([end.lon, end.lat])[1])
            .attr("stroke", locations.includes(start)&&locations.includes(end) ? "#FF0000" : "#808080")
           // 线的颜色
            .attr("stroke-width", 2); // 线的宽度
        }

        // 连接线绘制完成后调用 resolve
        resolve();
      });
    },
    async initMap() {
      // 地图容器宽高
      const width = 1200; // 放大宽度
      const height = 900; // 放大高度

      // 定义地图投影
      this.projection = d3.geoMercator()
        .center([107, 31]) // 地图中心位置
        .scale(750) // 设置缩放量
        .translate([width / 2, height / 2 - 30]); // 设置平移量

      // 创建 SVG
      this.svg = d3
          .select(this.$refs.mapContainer)
          .append("svg")
          .attr("width", width)
          .attr("height", height);

      try {
        // 调用绘制地图路径函数
        await this.drawMapPath(this.svg, this.projection);
        // 调用绘制地点圆圈函数
        await this.drawLocationCircles(this.svg, this.projection, this.locations);
        // 调用绘制连接线函数
        await this.drawLocationLines(this.svg, this.projection, this.locations);

        // 创建时间标尺，并放置在地图下方
        this.initTimeline(this.svg, 600); // 添加到地图的 SVG 中
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
        .attr("stroke", "#8918cfc9")
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
        .attr("stroke", "#8918cf4a")
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
        .attr("fill", "#8918cfc9");  // 设置箭头颜色
        
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
  width: 100%;
  height: calc(100vh - 43px); 
  overflow: hidden;
  margin-top: 43px;
  margin-bottom: 2px;
   /* 根据需要调整此值，避免与导航栏重叠 */
  
}
.chapter-list {
  display: flex;
  flex-direction: column;
  width: 250px;
  height: 98%;
  overflow-y: auto;
  background-color: #ffadad;
  border-right: 1px solid #ddd;
  padding: 15px 0px;
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
  background-color: #e0f7fa;
  color: #00796b;
}

.chapter-item.active {
  background-color: #00796b;
  color: #ffffff;
}

.page-content {
  flex-direction: column;  /* 子容器上下排列 */
  flex-grow: 1; /* 填充剩余空间 */
  width: auto;  /* 不设置固定宽度 */
  height: 100%;            /* 父容器占满可用空间 */
  display: flex;
  justify-content: flex-start;
  align-items: center;
  background-color: #8918cf4a;
}
.map-container {
  margin: 0;
  width: 100%; /* 使用百分比宽度适配父容器 */
  height: 100%; /* 使用百分比高度适配父容器 */
  overflow: hidden; /* 隐藏超出的部分 */
  background-color: #41db3c4a;
  z-index: 2;
}
.story-content{
  flex-direction: column;  /* 子容器上下排列 */
  width: 350px;
  flex-shrink: 0; /* 防止缩小 */
  height: 100%; 
  padding-right:40px; 
  padding: 45px 40px 45px 45px; /* 上、右、下、左的内边距 */
  display: flex;
  justify-content: flex-start;
  align-items: center;
  background-color: #3cbedb7a;
}

.top-content {
  width: 100%;
  height: 45%;
  background-color: #f9f9f9;
  margin-bottom: 15px; /* 为了分隔上下内容 */
  overflow-y: auto;  /* 允许内容滚动 */
}

.bottom-content {
  width: 100%;
  height: 45%;
  background-color: #f0f0f0;
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
