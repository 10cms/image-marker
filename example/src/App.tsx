import React from 'react'

import ImageMarker from 'image-marker'
import img from './1.jpg'
import 'image-marker/dist/index.css'
const App = () => {
  return <ImageMarker src={img} renderPoint={<div>标记点</div>}></ImageMarker>
}

export default App

