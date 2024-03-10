// 引入所需模块
import express from 'express';
import { createSSRApp, createVNode } from 'vue';
import { renderToString } from '@vue/server-renderer';
import fetch from 'node-fetch';
import cors from 'cors';
import { Readable } from 'stream';
// ...其他依赖

const app = express();
app.use(cors());

// ...fetchCatImages和其他函数

// 添加辅助函数以创建失败降级的HTML
function getFallbackHTML(errorInfo) {
  return `
    <html>
      <head>
        <title>渲染失败降级页面</title>
      </head>
      <body>
        <h1>很抱歉，服务器渲染遇到了问题。</h1>
        <p>${errorInfo}</p>
      </body>
    </html>
  `;
}

// ...现有的createVueApp和createVueAppOther函数

// 新的路由处理函数，包含失败降级逻辑
app.get('/', async (req, res) => {
  try {
    // 创建Vue实例
    let vueApp;
    try {
      // 尝试创建Vue实例（同步创建）：如果失败，将响应失败降级的HTML
      vueApp = await createVueApp();
    } catch (error) {
      console.error('同步创建Vue实例失败：', error);
      res.status(500).send(getFallbackHTML('同步创建Vue实例失败'));
      return;
    }

    // 渲染Vue实例为字符串，如果失败则发送降级HTML
    let renderedHTML;
    try {
      renderedHTML = await renderToString(vueApp);
    } catch (error) {
      console.error('服务端渲染失败：', error);
      res.status(500).send(getFallbackHTML('服务端渲染失败'));
      return;
    }

    // 组织最终的HTML
    const finalHTML = `${headPart}${renderedHTML}${tailPart}`;
    
    // 响应客户端请求
    res.status(200).send(finalHTML);
  } catch (err) {
    console.error('总体错误：', err);
    res.status(500).send(getFallbackHTML('未知错误'));
  }
});

// ...服务器监听端口代码