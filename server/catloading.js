import express from 'express';
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer'; // 更改为使用renderToString
import fetch from 'node-fetch'; // 更改为ES模块的导入方式
import cors from 'cors';

const app = express();
app.use(cors());

// 此函数模拟从API获取图片数据
async function fetchCatImages() {
    let images = [];
    try {
        // 发起第一次请求
        const response1 = await fetch('https://imgapi.cn/loading.php?return=jsonpro');
        
        if (!response1.ok) {
            console.error('第一次API请求失败：', response1.status, response1.statusText);
            // 如果第一次请求失败，有可能不想继续第二次请求
            // 取决于您的需求，如果这里返回，那么第二次请求就不会发生
            // return images;
        } else {
            const data1 = await response1.json();
            if(Array.isArray(data1.imgurls)) {
                images = images.concat(data1.imgurls);
            } else {
                console.error('预期的数组未被找到在第一次返回的数据中');
            }
        }

        // 发起第二次请求
        const response2 = await fetch('https://imgapi.cn/loading.php?return=jsonpro');

        if (!response2.ok) {
            console.error('第二次API请求失败：', response2.status, response2.statusText);
            // 如果第二次请求失败，您可以决定是返回已有的部分结果还是空数组
            // return images; // 如果想返回已请求的图片
        } else {
            const data2 = await response2.json();
            if(Array.isArray(data2.imgurls)) {
                images = images.concat(data2.imgurls);
            } else {
                console.error('预期的数组未被找到在第二次返回的数据中');
            }
        }
    } catch (error) {
        console.error('获取图片失败：', error);
    }
    return images.slice(0, 20); // 返回最多20个图片的数组
}

// Vue应用创建函数
async function createVueApp() {
  const images = await fetchCatImages();
  const app = createSSRApp({
    data() {
      return {
        images,
        loading: false
      };
    },
    mounted() {
        // 当 Vue 客户端接管时，更新 loading 状态
        this.loading = false;
      },
    template: `
    <div v-if="loading" class="skeleton-screen">
    <div class="skeleton-image" v-for="i in 10" :key="i"></div>
  </div>
  <div class="reimages" v-else>
    <div class="image-container cat-image-container" v-for="(image, index) in images" :key="index">
      <img :src="image" class="cat-image">
      <div class="image-info">
        <div><strong>Title:</strong> 精美猫咪图片</div>
        <div><strong>ID:</strong> {{ index+1 }}</div>
        <div><strong>Description:</strong> 这是一只可爱的猫咪。</div>
        <div><strong>Date:</strong> 2022-02-22</div>
      </div>
    </div>
  </div>
    `
  });
  return app;
}
const updatedStyles = `
.image-container {
  position: relative;
  overflow: hidden;
}

.image-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.75); /* 更深的黑色半透明背景 */
  color: #fff;
  padding: 15px; /* 增大padding */
  transform: translateY(100%);
  transition: transform 0.3s ease-in-out;
  font-size: 1.2rem; /* 增大字体尺寸 */
}

.cat-image-container:hover .cat-image {
  transform: scale(1.1); /* 放大图片的比例 */
}

.cat-image-container:hover .image-info {
  transform: translateY(0);
}

.cat-image {
  aspect-ratio: 1 / 1; 
  width: 100%;
  height: auto; /* 由于放大图片，可能需要调整高度使其自动适应 */
  background-color: #ccc;
  border-radius: 12px; /* 增大圆角 */
  object-fit: cover;
  transition: transform 0.2s;
}

.skeleton-screen, .reimages {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 减少一列，现在每行四个图片 */
  gap: 15px; /* 增大间隙 */
  padding: 25px; /* 增大内边距 */
  align-items: start;
  justify-content: center;
}
`;

const headPart =`
<!DOCTYPE html>
<html>
<head>
  <title>My Vue App</title>
  <style>
    ${updatedStyles}
    body {
      font-family: 'Arial', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f3f3f3;
      text-align: center;
    }
    #app {
      margin: 0 auto;
      padding: 20px;
      display: block; /* 从 flex 更改为 block 让设置的宽度生效 */
      width: calc(100% - 40px); /* 设置宽度，减去 padding 宽度 */
      box-sizing: border-box; /* 使宽度包含 padding */
      border: 2px solid #eaeaea; /* 添加边框 */
      max-width: 1200px; /* 根据需要限制最大宽度 */
      background-color: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 添加容器的阴影 */
      border-radius: 8px; /* 添加圆角边框 */
    }
  </style>
</head>
<body>
<div id="app">
`;
const tailPart = `
</div>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    const app = window.__VUE_APP__;
    if(app) {
      app.loading = false;
      app.$mount('#app');
    }
  });
</script>
</body>
</html>
`;


app.get('/', async (req, res) => {
  try {
    // 创建Vue实例
    const vueApp = await createVueApp();
    
    // 渲染Vue实例为字符串
    const appContent = await renderToString(vueApp);

    // 构建完整的HTML响应
    const html = `${headPart}${appContent}${tailPart}`;

    // 设置响应头部和发送渲染后的HTML字符串
    res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
    });
    res.end(html);
  } catch (err) {
    console.error(err);
    // 发送错误响应
    res.status(500).send('Internal Server Error');
  }
});

// 监听端口3000
app.listen(3000, () => {
  console.log('Server listening on port 3000');
});