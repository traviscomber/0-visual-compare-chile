const PENDING_KEY = "videntiaWipoPending"
const SAVED_QUERIES_PATH = "/search/en/reg/user_queries.jsf"
const SEARCH_PATH = "/search/en/search.jsf"
const STEP_KEY = "videntiaWipoAutomationStep"

function getPending(){
  return new Promise(resolve => chrome.runtime.sendMessage({type:"GET_WIPO_PENDING"}, response => resolve(response?.pending || null)))
}

function fail(message){
  chrome.runtime.sendMessage({type:"WIPO_AUTOMATION_ERROR",message})
}

function setValue(input,value){
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")
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

async function runSearch(pending){
  if(sessionStorage.getItem(STEP_KEY)==="searched") return
  const input = await waitFor(()=>document.querySelector('[id$="fpSearch:input"]'))
  if(!input){fail("WIPO no mostró el campo de búsqueda esperado.");return}
  setValue(input,pending.query)
  sessionStorage.setItem(STEP_KEY,"searched")
  const searchButton = document.querySelector('[id$="fpSearch:j_idt1363"]') || findAction(/^search$/i)
  if(!searchButton){fail("WIPO no mostró la acción de búsqueda esperada.");return}
  searchButton.click()
}

async function saveCurrentQuery(pending){
  if(sessionStorage.getItem(STEP_KEY)==="saved") return
  const saveQuery = await waitFor(()=>findAction(/save\s*(this\s*)?query|save\s*search/i),15000)
  if(!saveQuery){
    window.location.assign(SAVED_QUERIES_PATH)
    return
  }
  saveQuery.click()

  const dialog = await waitFor(()=>document.querySelector('[role="dialog"]') || [...document.querySelectorAll("div")].find(node=>/save.*query/i.test(textOf(node)) && node.querySelector("input[type='text']")),7000)
  if(dialog){
    const nameInput = dialog.querySelector("input[type='text']:not([type='hidden'])")
    if(nameInput) setValue(nameInput,pending.query.slice(0,80))

    const privateText = [...dialog.querySelectorAll("label,span,div")].find(node=>/private\s*query/i.test(textOf(node)))
    const privateCheckbox = privateText?.querySelector?.("input[type='checkbox']") || (privateText?.htmlFor ? document.getElementById(privateText.htmlFor) : null) || [...dialog.querySelectorAll("input[type='checkbox']")].at(-1)
    if(privateCheckbox?.checked) privateCheckbox.click()

    const confirm = findAction(/^save$|save\s*query/i,dialog)
    if(confirm) confirm.click()
  }
  sessionStorage.setItem(STEP_KEY,"saved")
  setTimeout(()=>window.location.assign(SAVED_QUERIES_PATH),1600)
}

async function connectSavedQuery(pending){
  const row = await waitFor(()=>[...document.querySelectorAll("tr")].find(item => {
    const firstCell = item.querySelector("td")?.textContent?.trim().toLowerCase()
    return firstCell === pending.query.toLowerCase() || textOf(item).toLowerCase().includes(` ${pending.query.toLowerCase()} `)
  }),12000)
  if(!row){fail(`No encontramos la consulta guardada “${pending.query}” en WIPO.`);return}

  const checkboxes = [...row.querySelectorAll("input[type='checkbox']")]
  const privateCheckbox = checkboxes.at(-1)
  if(privateCheckbox?.checked){
    privateCheckbox.click()
    await new Promise(resolve=>setTimeout(resolve,500))
  }

  const rss = [...row.querySelectorAll("a,button")].find(element=>/^rss$/i.test(textOf(element)) || /rss/i.test(element.getAttribute("title") || ""))
  if(!rss){fail("WIPO no mostró el enlace de seguimiento para esta consulta.");return}
  rss.click()
}

async function main(){
  const pending = await getPending()
  if(!pending) return
  const path = window.location.pathname

  if(path === SEARCH_PATH){
    await runSearch(pending)
    setTimeout(()=>void saveCurrentQuery(pending),1200)
    return
  }
  if(path === SAVED_QUERIES_PATH){
    await connectSavedQuery(pending)
    return
  }

  const hasResults = /result|search/i.test(path)
  if(hasResults) await saveCurrentQuery(pending)
}

void main()