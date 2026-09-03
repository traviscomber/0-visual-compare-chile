const WIPO_SEARCH_URL = "https://patentscope.wipo.int/search/en/search.jsf"
const CALLBACK_BASE = "https://videntia.app/patentes/wipo"
const PENDING_KEY = "videntiaWipoPending"

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if(message?.type === "START_WIPO_CONNECT"){
    const query = typeof message.query === "string" ? message.query.trim() : ""
    const watchType = message.watchType === "ipc" ? "ipc" : "company"
    if(query.length < 2){sendResponse({ok:false,error:"Consulta inválida."});return}
    const pending = {query,watchType,startedAt:Date.now()}
    chrome.storage.local.set({[PENDING_KEY]:pending}, () => {
      chrome.tabs.create({url:WIPO_SEARCH_URL,active:true}, () => sendResponse({ok:true}))
    })
    return true
  }
  if(message?.type === "GET_WIPO_PENDING"){
    chrome.storage.local.get(PENDING_KEY, result => sendResponse({pending:result[PENDING_KEY] || null}))
    return true
  }
  if(message?.type === "WIPO_AUTOMATION_ERROR"){
    chrome.storage.local.get(PENDING_KEY, result => {
      const pending = result[PENDING_KEY]
      if(!pending) return
      const url = new URL(CALLBACK_BASE)
      url.searchParams.set("autoError", String(message.message || "No pudimos completar la conexión automática con WIPO."))
      chrome.tabs.create({url:url.toString(),active:true})
    })
  }
})

chrome.webRequest.onBeforeRequest.addListener(
  details => {
    const url = details.url
    if(!/\/rss\.xml(?:\?|$)/i.test(url)) return
    chrome.storage.local.get(PENDING_KEY, result => {
      const pending = result[PENDING_KEY]
      if(!pending) return
      const callback = new URL(CALLBACK_BASE)
      callback.searchParams.set("auto","1")
      callback.searchParams.set("feedUrl",url)
      callback.searchParams.set("query",pending.query)
      callback.searchParams.set("type",pending.watchType)
      chrome.storage.local.remove(PENDING_KEY, () => {
        chrome.tabs.create({url:callback.toString(),active:true})
      })
    })
  },
  {urls:["https://patentscope.wipo.int/*"]}
)