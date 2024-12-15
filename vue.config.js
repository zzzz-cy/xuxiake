const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: "/xuxiake/",
  outputDir: "dist",
  assetsDir:"static",
})