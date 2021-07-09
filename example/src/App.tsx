import React from 'react'

import ImageMaker from 'image-maker'
import img from './1.jpg'
import 'image-maker/dist/index.css'
const App = () => {
  return <ImageMaker src={img} renderPoint={<div>标记点</div>}></ImageMaker>
}

export default App
