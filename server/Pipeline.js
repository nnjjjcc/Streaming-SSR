import express from 'express';
import { createSSRApp } from 'vue';
import { renderToNodeStream } from '@vue/server-renderer';
import fetch from 'node-fetch'; // 更改为ES模块的导入方式
import cors from 'cors';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
// import { Redis } from '@xhs/hulk-redis'
 

const app = express();
app.use(cors());
// const redis = new Redis({ name: 'corvus-common-redis-sit-new' })
const IMAGES_CACHE_KEY = 'cached:catImages';

// 此函数模拟从API获取图片数据
async function fetchCatImages() {
    let images = [];
    // const cachedImages = await redis.get(IMAGES_CACHE_KEY);
    // if (cachedImages) {
    //     return JSON.parse(cachedImages);
    // }

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

        const response3 = await fetch('https://imgapi.cn/loading.php?return=jsonpro');

        if (!response3.ok) {
            console.error('第二次API请求失败：', response3.status, response3.statusText);
            // 如果第二次请求失败，您可以决定是返回已有的部分结果还是空数组
            // return images; // 如果想返回已请求的图片
        } else {
            const data2 = await response3.json();
            if(Array.isArray(data2.imgurls)) {
                images = images.concat(data2.imgurls);
            } else {
                console.error('预期的数组未被找到在第二次返回的数据中');
            }
        }
    } catch (error) {
        console.error('获取图片失败：', error);
    }
    // await redis.set(IMAGES_CACHE_KEY, JSON.stringify(images), 'EX', 3600);
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

async function createVueAppOther() {
    
    const miningData = {
        // 示例矿业数据
        mineName: "金矿",
        location: "内蒙古",
        output: "10,000 kg",
        workers: 120
      };
    
      const app = createSSRApp({
        data() {
          return {
        
            miningData,
            loading: true
          };
        },
        template: `
          <div class="mining-data">
            <h2>矿业数据</h2>
            <div v-for="(value, key) in miningData" :key="key">
              <strong>{{ key }}:</strong> {{ value }}
            </div>
          </div>
          <div class="reimages">
           
          </div>
        `
      });
    
      return app;
  }

function getFallbackHTML(errorInfo) {
    return `
      <!DOCTYPE html>
      <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>渲染失败降级页面</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: 'Arial', sans-serif;
              background-color: #f7f7f7;
              color: #333;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
            }
            .container {
              text-align: center;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              background: white;
              max-width: 500px;
              margin: auto;
            }
            h1 {
              color: #de4437;
              margin-bottom: 20px;
            }
            p {
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>很抱歉，服务器渲染遇到了问题。</h1>
            <p>${errorInfo}</p>
          </div>
        </body>
      </html>
    `;
  }

const updatedStyles = `
.image-container {
  position: relative;
  overflow: hidden;
}
.mining-data {
    width: 200px;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    background-color: #333;
    color: white;
    padding: 10px;
    box-sizing: border-box;
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
    let vueApp, vueAppother;
    let vueStream,vueStreamOther
     vueApp = await createVueApp();
     vueAppother = await createVueAppOther();
      
      vueStream = renderToNodeStream(vueApp);
      vueStreamOther = renderToNodeStream(vueAppother);
      
   
    res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Transfer-Encoding': 'chunked'
      }),
    pipeline(
        Readable.from(headPart),
        res,
        { end: false }
    )
    .then(()=>{
        return pipeline(
            vueStreamOther, // 假设这是一个大文件或数据库的读取流
            res,
            { end: false }
        )
    })
    .then(()=>{
        return pipeline(
            vueStream, // 假设这是一个大文件或数据库的读取流
            res,
            { end: false }
        )
    })
    .then(() => {
        // 传输脚本部分
        return pipeline(
          Readable.from(tailPart),
          res
        );
      })
    .then(() => {
        res.end(); // 结束响应
      })
      .catch(err => {
        console.error('Stream pipeline failed', err);
        res.status(500).send(getFallbackHTML('内部服务器错误'));
      });
  } catch (err) {
    console.error(err);
    // 发送错误响应
    res.status(500).send('Internal Server Error');
  }
});
app.get('/api/page', async (req, res) => {
  try {
    // 创建Vue应用实例，专门为图片页面
    const  vueAppother = await createVueAppOther();
    const vueStreamO = renderToNodeStream(vueAppother);

    // 设置响应头
    res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Transfer-Encoding': 'chunked'
    });

    // 使用pipeline来传输流内容
    pipeline(
      Readable.from(headPart),
      res,
      { end: false }
  )
  .then(()=>{
      return pipeline(
        vueStreamO, // 假设这是一个大文件或数据库的读取流
          res,
          { end: false }
      )
  })
  .then(() => {
      // 传输脚本部分
      return pipeline(
        Readable.from(tailPart),
        res
      );
    })
  .then(() => {
      res.end(); // 结束响应
    })
    .catch(err => {
      console.error('Stream pipeline failed', err);
      res.status(500).send(getFallbackHTML('内部服务器错误'));
    });
  } catch (err) {
    console.error('渲染出错：', err);
    res.status(500).send(getFallbackHTML('渲染出错'));
  }
});

// 监听端口3000
app.listen(3000, () => {
  console.log('Server listening on port 3000');
});