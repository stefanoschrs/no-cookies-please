const AppName = 'no-cookies-please'
const PathFound = 'found'

let cookieTabs = {}

/**
 * Page
 */

function executionCode (tabId, appName, pathFound) {
  console.log('>>>>>>>>>>>><<<<<<<<<<<<<')
  console.log('>>> No Cookies Please <<<')
  console.log('>>>>>>>>>>>>><<<<<<<<<<<<')

  const providers = [
    { name: "cookiebot.com", func: removeCookiebot },
    { name: "onetrust.com", elements: ['#onetrust-consent-sdk'] },
    { name: "piwik.pro", elements: ['[id^="ppms_cm_consent_"]'] },
    { name: "1touch.io", elements: ['#hs-eu-cookie-confirmation'] },
    { name: "iubenda.com", elements: ['#iubenda-cs-banner'] },
    { name: "trustarc.com", elements: ['#trustarcNoticeFrame', '.truste_overlay', '.truste_box_overlay'] },
    { name: "consensu.org", func: removeConsensu },
    { name: "cookielaw.org", elements: ['.optanon-alert-box-wrapper'] },
    { name: "hs-banner.com", elements: ['#hs-eu-cookie-confirmation'] },
  ]

  const observer = new MutationObserver(((mutations, observer) => {
    // TODO: Run only on suspicious mutations
    runProviders()
  }))
  observer.observe(document.body, { subtree: true, childList: true })
  runProviders()
  // setTimeout(() => observer.disconnect(), 60000)

  function runProviders () {
    for (const provider of providers) {
      const scriptEl = document.querySelector(`[src*="${provider.name}"]`)
      if (scriptEl) {
        // scriptEl.parentElement.removeChild(scriptEl)

        if (provider.hasOwnProperty('func')) {
          provider.func()
        } else {
          basicRemover(provider.name, provider.elements)
        }

        break
      }
    }
  }

  /** Custom **/
  async function removeCookiebot () {
    document.body.classList.remove('cookie-dialog-up')

    basicRemover('cookiebot.com', [
      // Basic
      '#CybotCookiebotDialog',
      // Advanced
      '#dtcookie-container',
      '.dtcookie-overlay'
    ])
  }

  async function removeConsensu () {
    if (await _removeElement('body > .qc-cmp-ui-container')) {
      document.body.style.overflow = 'initial'
      _sendMessage('consensu.org')
    }
  }

  /** Helpers **/
  async function basicRemover (name, elements) {
    let removeFlag
    for (const el of elements) {
      if (await _removeElement(el)) {
        removeFlag = true
      }
    }

    if (removeFlag) {
      _sendMessage(name)
    }
  }

  async function _removeElement (name) {
    const el = document.querySelector(name)
    if (el) {
      el.parentElement.removeChild(el)
      return true
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

/**
 * Background
 */

function onTabUpdate(tabId, changeInfo, tab) {
  if (tab.url.startsWith('chrome') || changeInfo.status !== 'complete') {
    return
  }

  chrome.runtime.onMessage.addListener(onRuntimeMessage)

  executeCode(tabId)
}

function onTabActivated ({ tabId }) {
  executeCode(tabId)

  setBadge(cookieTabs[tabId])
}

function executeCode (tabId) {
  chrome.tabs.executeScript({ code: `(${executionCode})('${tabId}', '${AppName}','${PathFound}')` })
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