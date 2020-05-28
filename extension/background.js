const AppName = 'no-cookies-please'
const PathFound = 'found'

let cookieTabs = {}

function onTabUpdate(tabId, changeInfo, tab) {
  if (tab.url.startsWith('chrome') || changeInfo.status !== 'complete') {
    return
  }

  chrome.tabs.executeScript({ code: `(${code})('${tabId}', '${AppName}','${PathFound}')` })
  chrome.runtime.onMessage.addListener(onRuntimeMessage)

  function code (tabId, appName, pathFound) {
    for (let i = 0; i < 15; i++) {
      setTimeout(removeCybot, i * 150)
      setTimeout(removeOnetrust, i * 150)
    }

    // https://www.cybot.com
    function removeCybot () {
      let el = document.querySelector('#CybotCookiebotDialog')
      if (el && el.style.display !== 'none') {
        el.style.display = 'none'
        chrome.runtime.sendMessage({
          app: appName,
          path: pathFound,
          meta: {
            tabId: tabId,
            name: 'cybot'
          }
        })
      }
    }

    // https://www.onetrust.com/
    function removeOnetrust () {
      let el = document.querySelector('#onetrust-consent-sdk')
      if (el && el.style.display !== 'none') {
        el.style.display = 'none'
        chrome.runtime.sendMessage({
          app: appName,
          path: pathFound,
          meta: {
            tabId: tabId,
            name: 'onetrust'
          }
        })
      }
    }
  }
}

function onTabActivated ({ tabId }) {
  setBadge(cookieTabs[tabId])
}

function onRuntimeMessage (message) {
  if (message.app !== AppName) {
    return
  }

  if (message.path === PathFound) {
    cookieTabs[message.meta.tabId] = true
    setBadge(true)
  }
}

function setBadge (val) {
  chrome.browserAction.setBadgeText({
    text: val ? '1' : ''
  })
}

(function () {
  chrome.tabs.onUpdated.addListener(onTabUpdate)
  chrome.tabs.onActivated.addListener(onTabActivated)
})()