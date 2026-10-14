import React from 'react'
import ReactDOM from 'react-dom/client'

// v4 is the default. ?v=3 opens the old game (frozen), with its own Tailwind styles.
const root = ReactDOM.createRoot(document.getElementById('root'))
const v3 = new URLSearchParams(location.search).get('v') === '3'

if (v3) {
  Promise.all([import('./v3/App.jsx'), import('./index.css')]).then(([{ default: App }]) => root.render(<App />))
} else {
  import('./v4/App.jsx').then(({ default: App }) => root.render(<App />))
}
