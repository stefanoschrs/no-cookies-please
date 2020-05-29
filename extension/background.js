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
    const BootTimeout = 200
    const RemoveIterations = 10
    const RemoveIterationTimeout = 200

    const providers = [
      { name: "cybot.com", elements: ['[id="CybotCookiebotDialog"]'] },
      { name: "onetrust.com", elements: ['[id="onetrust-consent-sdk"]'] },
      { name: "piwik.pro", elements: ['div[id^="ppms_cm_consent_"]'] },
      { name: "1touch.io", elements: ['[id="hs-eu-cookie-confirmation"]'] },
      { name: "iubenda.com", elements: ['[id="iubenda-cs-banner"]'] },
      { name: "trustarc.com", func: removeTrustarc },
    ]

    setTimeout(() => {
      for (const provider of providers) {
        if (document.querySelector(`[src*="${provider.name}"]`)) {
          if (provider.hasOwnProperty('func')) {
            provider.func()
          } else {
            basicRemover(provider.name, provider.elements)
          }
          break
        }
      }
    }, BootTimeout)

    /** Custom **/
    async function removeTrustarc () {
      await _removeElement('#trustarcNoticeFrame')
      await _removeElement('[class="truste_overlay"]')
      await _removeElement('[class="truste_box_overlay"]')

      _sendMessage('trustarc.com')
    }

    /** Helpers **/
    async function basicRemover (name, elements) {
      for (const el of elements) {
        await _removeElement()
      }

      _sendMessage(name)
    }

    async function _removeElement (name) {
      let el
      for (let i = 0; i < RemoveIterations; i++) {
        el = document.querySelector(name)
        if (el) {
          break
        }
        await new Promise((r) => setTimeout(() => r(), RemoveIterationTimeout))
      }

      if (el) {
        el.parentElement.removeChild(el)
      }
    }

    function _sendMessage (cookieName) {
      chrome.runtime.sendMessage({
        app: appName,
        path: pathFound,
        meta: {
          tabId: tabId,
          name: cookieName
        }
      })
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