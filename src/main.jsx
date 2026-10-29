// first: the ?trace=1 tracer hooks React before react-dom loads (a no-op without the flag; src/v4/perf.js)
import './v4/perf.js'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { muteIterationEvents } from './v4/quietIdle.js'

// before React registers its root listeners: no 'animationiteration' listener, so idle CSS loops stay off the main thread
muteIterationEvents(document.body)
// v4 is the default. ?v=3 opens the old game (frozen), with its own Tailwind styles.
const root = ReactDOM.createRoot(muteIterationEvents(document.getElementById('root')))
const v3 = new URLSearchParams(location.search).get('v') === '3'

if (v3) {
  Promise.all([import('./v3/App.jsx'), import('./index.css')]).then(([{ default: App }]) => root.render(<App />))
} else {
  // If the app's code can't load (offline, or a deploy swapped the files), say so plainly and offer Retry.
  const offline = () => root.render(
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#141d1c', color: '#ece6d6', fontFamily: 'Figtree, system-ui, sans-serif', padding: 16 }}>
        <div style={{ maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
          <p style={{ margin: 0, fontSize: 17 }}>Can’t reach the server. Check your connection.</p>
          <button type="button" onClick={() => location.reload()} style={{ font: 'inherit', padding: '10px 20px', borderRadius: 999, border: 0, background: '#ece6d6', color: '#141d1c', cursor: 'pointer', minHeight: 44 }}>Retry</button>
        </div>
      </div>,
    )
  // ?lab=b: UI-B's component lab (screenshots of the Lamplit pieces on a real state); otherwise the game
  const lab = new URLSearchParams(location.search).get('lab')
  if (lab === 'b') import('./v4/lab/LabB.jsx').then(({ default: Lab }) => root.render(<Lab />)).catch(offline)
  // ?lab=intro[&beat=N][&at=MS]: the intro's beats in isolation (building and recording them)
  else if (lab === 'intro') import('./v4/intro/IntroLab.jsx').then(({ default: Lab }) => root.render(<Lab />)).catch(offline)
  // ?lab=faces&face=<name>: one action-space face (src/v4/game/faces/) on every action, in each state, and on the live wheel
  else if (lab === 'faces') import('./v4/lab/FacesLab.jsx').then(({ default: Lab }) => root.render(<Lab />)).catch(offline)
  // ?lab=cards: member cards as trading cards, design stabs side by side
  else if (lab === 'cards') import('./v4/lab/CardsLab.jsx').then(({ default: Lab }) => root.render(<Lab />)).catch(offline)
  // play/members/ (or ?lab=members): every member's card, by color, for member reviews
  else if (lab === 'members' || /\/members\/?$/.test(location.pathname)) import('./v4/lab/MembersPage.jsx').then(({ default: Page }) => root.render(<Page />)).catch(offline)
  else import('./v4/App.jsx').then(({ default: App }) => root.render(<App />)).catch(offline)
  // Later chunk failures (e.g. the online code) reach their caller, which shows the same friendly message.
}
