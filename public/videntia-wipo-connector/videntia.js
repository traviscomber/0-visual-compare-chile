const SOURCE = "VIDENTIA_WIPO_CONNECTOR"

function announceReady(){
  window.postMessage({source:SOURCE,type:"VIDENTIA_WIPO_READY"}, window.location.origin)
}

window.addEventListener("message", event => {
  if(event.source !== window || event.origin !== window.location.origin) return
  const message = event.data
  if(!message || message.source !== "VIDENTIA" || typeof message.type !== "string") return

  if(message.type === "VIDENTIA_WIPO_PING"){
    announceReady()
    return
  }

  if(message.type === "VIDENTIA_WIPO_CONNECT"){
    const query = typeof message.query === "string" ? message.query.trim() : ""
    const watchType = message.watchType === "ipc" ? "ipc" : "company"
    if(query.length < 2) return
    chrome.runtime.sendMessage({type:"START_WIPO_CONNECT",query,watchType}, response => {
      if(chrome.runtime.lastError || !response?.ok){
        window.postMessage({source:SOURCE,type:"VIDENTIA_WIPO_ERROR",message:response?.error || "No pudimos iniciar la conexión con WIPO."}, window.location.origin)
        return
      }
      window.postMessage({source:SOURCE,type:"VIDENTIA_WIPO_STARTED"}, window.location.origin)
    })
  }
})

announceReady()