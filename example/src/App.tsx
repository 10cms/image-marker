import React from 'react'

import ImageMarker from 'image-marker'
import img from './1.jpg'
import 'image-marker/dist/index.css'
import { ImageMarkerChangeProps } from '../../dist/component'
// imgPos?: [number, number]//相对于视窗初始位置（小于1则百分比，大于1则距离）
// imgPosCenter?: boolean //相对于中心设置初始位置 否则则基于原点设置初始位置
// pointPos:[number, number]//相对于图片初始位置，以标注中心设置
// width?: number // viewport 视口的宽度
// height?: number // viewport 视口的高度
// minimum?: number // 缩放的最小尺寸【零点几】
// maximum?: number // 缩放的最大尺寸
// rate?: number // 缩放的速率
// src: string // 图片scr
// center?: boolean // 图片位置是否初始居中
// renderPoint?: React.ReactElement//标注组件
// imageWidth?: number //图片宽度
// imageHeight?: number //图片高度
const App = () => {
  return <ImageMarker src={img}   renderPoint={<div>标记点</div>}  imgWidth={800} imgHeight={500} imgPos={[0.5,0.7]} imgPosCenter={true} pointPos={[0.5,0.5]} onChange={onChange}></ImageMarker>
}

const onChange=(e:ImageMarkerChangeProps)=>{
  console.log(e)
}

export default App

