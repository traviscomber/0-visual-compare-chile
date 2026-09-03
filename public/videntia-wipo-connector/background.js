const WIPO_SAVED_QUERIES_URL = "https://patentscope.wipo.int/search/en/reg/user_queries.jsf"
const CALLBACK_BASE = "https://videntia.app/patentes/wipo"
const PENDING_KEY = "videntiaWipoPending"
const PENDING_TTL_MS = 15 * 60 * 1000

function isLivePending(pending){
  return Boolean(pending && typeof pending.query === "string" && pending.query.trim().length >= 2 && Number.isFinite(pending.startedAt) && Date.now() - pending.startedAt <= PENDING_TTL_MS)
}

function readPending(callback){
  chrome.storage.local.get(PENDING_KEY, result => {
    const pending = result[PENDING_KEY] || null
    if(!isLivePending(pending)){
      if(pending) chrome.storage.local.remove(PENDING_KEY)
      callback(null)
      return
    }
    callback(pending)
  })
}

function failPending(message){
  readPending(pending => {
    if(!pending) return
    const url = new URL(CALLBACK_BASE)
    url.searchParams.set("autoError", String(message || "No pudimos completar la conexión automática con WIPO."))
    chrome.storage.local.remove(PENDING_KEY, () => chrome.tabs.create({url:url.toString(),active:true}))
  })
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if(message?.type === "START_WIPO_CONNECT"){
    const query = typeof message.query === "string" ? message.query.trim() : ""
    const watchType = message.watchType === "ipc" ? "ipc" : "company"
    if(query.length < 2){sendResponse({ok:false,error:"Consulta inválida."});return}
    const pending = {query,watchType,startedAt:Date.now()}
    chrome.storage.local.set({[PENDING_KEY]:pending}, () => {
      chrome.tabs.create({url:WIPO_SAVED_QUERIES_URL,active:true}, () => {
        if(chrome.runtime.lastError){chrome.storage.local.remove(PENDING_KEY);sendResponse({ok:false,error:"No pudimos abrir WIPO."});return}
        sendResponse({ok:true})
      })
    })
    return true
  }

  if(message?.type === "GET_WIPO_PENDING"){
    readPending(pending => sendResponse({pending}))
    return true
  }

  if(message?.type === "WIPO_AUTOMATION_ERROR"){
    failPending(message.message)
  }
})

chrome.webRequest.onBeforeRequest.addListener(
  details => {
    let parsed
    try{parsed = new URL(details.url)}catch{return}
    if(parsed.protocol !== "https:" || parsed.hostname !== "patentscope.wipo.int" || !/\/rss\.xml$/i.test(parsed.pathname)) return
    readPending(pending => {
      if(!pending) return
      const callback = new URL(CALLBACK_BASE)
      callback.searchParams.set("auto","1")
      callback.searchParams.set("feedUrl",parsed.toString())
      callback.searchParams.set("query",pending.query)
      callback.searchParams.set("type",pending.watchType)
      chrome.storage.local.remove(PENDING_KEY, () => chrome.tabs.create({url:callback.toString(),active:true}))
    })
  },
  {urls:["https://patentscope.wipo.int/*"]}
)
