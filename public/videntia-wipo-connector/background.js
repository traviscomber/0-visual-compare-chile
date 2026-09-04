const WIPO_SAVED_QUERIES_URL = "https://patentscope.wipo.int/search/en/reg/user_queries.jsf"
const CALLBACK_BASE = "https://videntia.app/patentes/wipo"
const OPERATIONS_KEY = "videntiaWipoPendingOperations"
const PENDING_TTL_MS = 15 * 60 * 1000
const completing = new Set()

function isLiveOperation(operation){
  return Boolean(operation && typeof operation.nonce === "string" && operation.nonce.length >= 20 && typeof operation.query === "string" && operation.query.trim().length >= 2 && Number.isFinite(operation.startedAt) && Date.now() - operation.startedAt >= 0 && Date.now() - operation.startedAt <= PENDING_TTL_MS && Number.isInteger(operation.wipoTabId))
}

function readOperations(callback){
  chrome.storage.local.get(OPERATIONS_KEY, result => {
    const raw = result[OPERATIONS_KEY]
    const operations = raw && typeof raw === "object" ? raw : {}
    const live = {}
    let changed = false
    for(const [nonce,operation] of Object.entries(operations)){
      if(isLiveOperation(operation)) live[nonce] = operation
      else changed = true
    }
    if(changed) chrome.storage.local.set({[OPERATIONS_KEY]:live})
    callback(live)
  })
}

function saveOperation(operation,callback){
  readOperations(operations => chrome.storage.local.set({[OPERATIONS_KEY]:{...operations,[operation.nonce]:operation}},callback))
}

function removeOperation(nonce,callback=()=>{}){
  readOperations(operations => {
    const next = {...operations}
    delete next[nonce]
    chrome.storage.local.set({[OPERATIONS_KEY]:next},callback)
  })
}

function findOperationByTabId(operations,tabId){
  return Object.values(operations).find(operation => operation.wipoTabId === tabId) || null
}

function callbackFor(operation,params){
  const url = new URL(CALLBACK_BASE)
  url.searchParams.set("nonce",operation.nonce)
  for(const [key,value] of Object.entries(params)) url.searchParams.set(key,String(value))
  return url.toString()
}

function normalizeFeedUrl(value){
  try{
    const parsed = new URL(value)
    if(parsed.protocol !== "https:" || parsed.hostname !== "patentscope.wipo.int" || !/\/rss\.xml$/i.test(parsed.pathname)) return null
    return parsed.toString()
  }catch{return null}
}

function completeOperationForTab(tabId,feedUrl,callback=()=>{}){
  const normalizedFeedUrl = normalizeFeedUrl(feedUrl)
  if(!Number.isInteger(tabId) || tabId < 0 || !normalizedFeedUrl){callback({ok:false});return}
  readOperations(operations => {
    const operation = findOperationByTabId(operations,tabId)
    if(!operation || completing.has(operation.nonce)){callback({ok:false});return}
    completing.add(operation.nonce)
    const url = callbackFor(operation,{auto:"1",feedUrl:normalizedFeedUrl})
    removeOperation(operation.nonce,() => chrome.tabs.create({url,active:true},() => {
      completing.delete(operation.nonce)
      callback({ok:!chrome.runtime.lastError})
    }))
  })
}

function failOperationForTab(tabId,message){
  if(!Number.isInteger(tabId)) return
  readOperations(operations => {
    const operation = findOperationByTabId(operations,tabId)
    if(!operation || completing.has(operation.nonce)) return
    completing.add(operation.nonce)
    const url = callbackFor(operation,{autoError:message || "No pudimos completar la conexión automática con WIPO."})
    removeOperation(operation.nonce,() => chrome.tabs.create({url,active:true},()=>completing.delete(operation.nonce)))
  })
}

chrome.runtime.onMessage.addListener((message,sender,sendResponse) => {
  if(message?.type === "START_WIPO_CONNECT"){
    const query = typeof message.query === "string" ? message.query.trim() : ""
    const watchType = message.watchType === "ipc" ? "ipc" : "company"
    const nonce = typeof message.nonce === "string" ? message.nonce.trim() : ""
    if(query.length < 2 || nonce.length < 20 || nonce.length > 100){sendResponse({ok:false,error:"Solicitud de seguimiento inválida."});return}

    readOperations(operations => {
      if(operations[nonce]){sendResponse({ok:false,error:"Esta conexión WIPO ya está en curso."});return}
      chrome.tabs.create({url:"about:blank",active:true}, tab => {
        if(chrome.runtime.lastError || !Number.isInteger(tab?.id)){sendResponse({ok:false,error:"No pudimos abrir WIPO."});return}
        const operation = {nonce,query,watchType,startedAt:Date.now(),wipoTabId:tab.id}
        saveOperation(operation,() => chrome.tabs.update(tab.id,{url:WIPO_SAVED_QUERIES_URL},() => {
          if(chrome.runtime.lastError){removeOperation(nonce);sendResponse({ok:false,error:"No pudimos abrir PATENTSCOPE."});return}
          sendResponse({ok:true})
        }))
      })
    })
    return true
  }

  if(message?.type === "GET_WIPO_PENDING"){
    const tabId = sender.tab?.id
    readOperations(operations => sendResponse({pending:Number.isInteger(tabId)?findOperationByTabId(operations,tabId):null}))
    return true
  }

  if(message?.type === "WIPO_RSS_FOUND"){
    completeOperationForTab(sender.tab?.id,message.feedUrl,sendResponse)
    return true
  }

  if(message?.type === "WIPO_AUTOMATION_ERROR"){
    failOperationForTab(sender.tab?.id,message.message)
  }
})

chrome.webRequest.onBeforeRequest.addListener(
  details => {
    completeOperationForTab(details.tabId,details.url)
  },
  {urls:["https://patentscope.wipo.int/*"]}
)
