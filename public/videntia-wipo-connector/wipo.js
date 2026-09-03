const SAVED_QUERIES_PATH = "/search/en/reg/user_queries.jsf"
const SEARCH_PATH = "/search/en/search.jsf"

function getPending(){
  return new Promise(resolve => chrome.runtime.sendMessage({type:"GET_WIPO_PENDING"}, response => resolve(response?.pending || null)))
}

function fail(message){
  chrome.runtime.sendMessage({type:"WIPO_AUTOMATION_ERROR",message})
}

function stepKey(pending){
  return `videntiaWipoStep:${pending.startedAt}`
}

function getStep(pending){return sessionStorage.getItem(stepKey(pending)) || ""}
function setStep(pending,value){sessionStorage.setItem(stepKey(pending),value)}

function setValue(input,value){
  const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const descriptor = Object.getOwnPropertyDescriptor(prototype,"value")
  descriptor?.set?.call(input,value)
  input.dispatchEvent(new Event("input",{bubbles:true}))
  input.dispatchEvent(new Event("change",{bubbles:true}))
}

function textOf(element){
  return `${element.textContent || ""} ${element.getAttribute?.("aria-label") || ""} ${element.getAttribute?.("title") || ""} ${element.getAttribute?.("value") || ""}`.replace(/\s+/g," ").trim()
}

function findAction(pattern,root=document){
  return [...root.querySelectorAll("button,a,input[type='button'],input[type='submit']")].find(element => pattern.test(textOf(element))) || null
}

function waitFor(find,timeout=12000){
  return new Promise(resolve => {
    const initial = find()
    if(initial){resolve(initial);return}
    const observer = new MutationObserver(() => {
      const match = find()
      if(match){observer.disconnect();resolve(match)}
    })
    observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true})
    setTimeout(()=>{observer.disconnect();resolve(null)},timeout)
  })
}

function exactSavedQueryRow(query){
  const target = query.trim().toLocaleLowerCase()
  return [...document.querySelectorAll("tr")].find(row => row.querySelector("td")?.textContent?.trim().toLocaleLowerCase() === target) || null
}

async function connectSavedQuery(pending){
  const table = await waitFor(()=>document.querySelector("table,[role='grid']"),12000)
  if(!table){fail("WIPO no mostró tus consultas guardadas. Confirma que tu sesión de WIPO esté iniciada e inténtalo nuevamente.");return}

  const row = exactSavedQueryRow(pending.query)
  if(!row){
    setStep(pending,"need_search")
    window.location.assign(SEARCH_PATH)
    return
  }

  const checkboxes = [...row.querySelectorAll("input[type='checkbox']")]
  const privateCheckbox = checkboxes.at(-1)
  if(privateCheckbox?.checked){
    privateCheckbox.click()
    await new Promise(resolve=>setTimeout(resolve,700))
    const refreshedRow = exactSavedQueryRow(pending.query)
    if(refreshedRow) return void connectSavedQuery(pending)
  }

  setStep(pending,"requesting_feed")
  const rss = [...row.querySelectorAll("a,button")].find(element => /^rss$/i.test(textOf(element)) || /rss/i.test(element.getAttribute("title") || ""))
  if(!rss){fail("WIPO no ofreció seguimiento para esta consulta. Abre Saved Queries y confirma que la consulta sea pública.");return}
  rss.click()
}

async function runSearch(pending){
  const step = getStep(pending)
  const input = await waitFor(()=>document.querySelector('[id$="fpSearch:input"]'))
  if(!input){fail("WIPO no mostró la búsqueda. Confirma que tu sesión siga iniciada e inténtalo nuevamente.");return}

  if(step !== "searched" && step !== "saving"){
    setValue(input,pending.query)
    const searchButton = document.querySelector('[id$="fpSearch:j_idt1363"]') || findAction(/^search$/i)
    if(!searchButton){fail("WIPO no permitió iniciar la búsqueda automáticamente.");return}
    setStep(pending,"searched")
    searchButton.click()
    return
  }

  await saveCurrentQuery(pending)
}

async function saveCurrentQuery(pending){
  if(getStep(pending)==="saving") return
  const saveQuery = await waitFor(()=>findAction(/save\s*(this\s*)?query|save\s*search/i),15000)
  if(!saveQuery){fail("WIPO completó la búsqueda pero no ofreció guardarla. Guarda la consulta una vez en PATENTSCOPE y vuelve a activar el seguimiento.");return}
  setStep(pending,"saving")
  saveQuery.click()

  const dialog = await waitFor(()=>document.querySelector('[role="dialog"]') || [...document.querySelectorAll("div")].find(node=>/save.*query/i.test(textOf(node)) && node.querySelector("input[type='text']")),7000)
  if(!dialog){fail("WIPO no abrió el formulario para guardar la consulta.");return}

  const nameInput = dialog.querySelector("input[type='text']:not([type='hidden'])")
  if(nameInput) setValue(nameInput,pending.query.slice(0,80))

  const privateText = [...dialog.querySelectorAll("label,span,div")].find(node=>/private\s*query/i.test(textOf(node)))
  const privateCheckbox = privateText?.querySelector?.("input[type='checkbox']") || (privateText?.htmlFor ? document.getElementById(privateText.htmlFor) : null) || [...dialog.querySelectorAll("input[type='checkbox']")].at(-1)
  if(privateCheckbox?.checked) privateCheckbox.click()

  const confirm = findAction(/^save$|save\s*query/i,dialog)
  if(!confirm){fail("WIPO no permitió confirmar la consulta guardada.");return}
  confirm.click()
  setStep(pending,"saved")
  setTimeout(()=>window.location.assign(SAVED_QUERIES_PATH),1200)
}

async function main(){
  const pending = await getPending()
  if(!pending) return
  const path = window.location.pathname

  if(path === SAVED_QUERIES_PATH){await connectSavedQuery(pending);return}
  if(path === SEARCH_PATH){await runSearch(pending);return}

  if(/\/search\//i.test(path)){
    await saveCurrentQuery(pending)
    return
  }

  fail("VIDENTIA llegó a una pantalla inesperada de WIPO. Vuelve a Seguimientos e inténtalo nuevamente.")
}

void main()
