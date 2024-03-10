// HTML模板-字符串，对象包含(嵌入HTML中的各种状态和配置)。
function serializeState(state) {
    return JSON.stringify(state).replace(/</g, '\\u003c');
}
function staticServerScripts(targetHTML, {
    type,
    rootState,
    store,
    serverPrefetch,
    serverScript,
}) {
     // 兼容 Pinia 和 Vuex
    let storeState = store?.state;
    if (store && typeof store.state.value === 'object') {
        storeState = store.state.value;
    }
    
    const initialStateScript = `<script>window.__INITIAL_STATE__=${serializeState(storeState)}</script>`;
    
    let scriptsToInsert = `<script>window.__SSG__=${type === 'SSG'}</script>`;

    if (storeState) {
        scriptsToInsert += `<script>window.__INITIAL_STATE__=${serializeState(storeState)}</script>`;
    }

    if (rootState.setupServerState) {
        scriptsToInsert += `<script>window.__SETUP_SERVER_STATE__=${serializeState(rootState.setupServerState)}</script>`;
    }

    if (serverPrefetch) {
        scriptsToInsert += `<script>window.__ONMOUNTED_SERVER_STATE__=${serializeState(serverPrefetch)}</script>`;
    }

    if (serverScript) {
        scriptsToInsert += serverScript;
    }

    // 替换HTML中的 </body> 标签，插入脚本
    const updatedHTML = targetHTML.replace('</body>', scriptsToInsert + '</body>');



    return targetHTML
    .replace(
      /<\/body>/,
      () => `${
        Object
          .entries(
            {
              [`__${type}__`]: true,
              ...{ __INITIAL_STATE__: storeState },
              ...{ __SETUP_SERVER_STATE__: rootState.setupServerState },
              ...{ __ONMOUNTED_SERVER_STATE__: serverPrefetch },
            },
          )
          .reduce(
            (a, [k, v]) => `${a}<script>window.${k}=${(type === 'SSG')}</script>`,
            '',
          )
      }${serverScript || ''}</body>`,
    )

}


//-----------------------------------------------------------------------
const store = {
    state: {
      user: { name: "Alice" },
      posts: [{ id: 1, title: "Post 1" }]
    }
  };
  
  const rootState = {
    setupServerState: { theme: "dark" }
  };
  
  const serverPrefetch = { someState: 123 };
  const serverScript = "<script>console.log('Server Script Running')</script>";
  
  const targetHTML = `<!DOCTYPE html><html lang="en"><head><title>My App</title></head><body><!-- App Content --></body></html>`;
  
  const finalHTML = staticServerScripts(targetHTML, {
    type: 'SSG',
    rootState,
    store,
    serverPrefetch,
    serverScript,
  });
  
  console.log(finalHTML);