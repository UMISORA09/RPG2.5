import React from 'react'
import { createRoot } from 'react-dom/client'
import AppPages from './AppPages.jsx'

export function mountPages(experience, explorerUI) {
  let container = document.getElementById('brickland-react-pages')
  if (!container) {
    container = document.createElement('div')
    container.id = 'brickland-react-pages'
    document.body.appendChild(container)
  }

  const root = createRoot(container)
  root.render(<AppPages experience={experience} explorerUI={explorerUI} />)

  return {
    root,
    unmount: () => root.unmount(),
  }
}
export default mountPages
