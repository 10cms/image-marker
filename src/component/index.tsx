import React, { useState, useEffect, useRef } from 'react'

import styles from '../styles.module.css'
export interface ImageMarkerProps {
  width?: string // viewport 视口的宽度
  height?: string // viewport 视口的高度
  minimum?: number // 缩放的最小尺寸【零点几】
  maximum?: number // 缩放的最大尺寸
  rate?: number // 缩放的速率
  src: string // 图片scr
  center?: boolean // 图片位置是否初始居中
  contain?: boolean // 图片尺寸是否初始包含在视口范围内,
  cover?: boolean // 图片尺寸是否平铺显示
  renderPoint?: React.ReactElement
}
export interface WHProps {
  width: number
  height: number
}

function ImageMarker({
  width = '600px',
  height = '400px',
  minimum = 0.8,
  maximum = 8,
  rate = 10,
  src,
  center = true,
  contain = true,
  cover,
  renderPoint
}: ImageMarkerProps) {
  const [focuse, setFocuse] = useState(false) // 鼠标是否按下，处于可拖动状态
  const [focusePoint, setFocusePoint] = useState(false) // 鼠标在标记处是否按下，处于可拖动状态
  const [imageWidth, setImageWidth] = useState(0) // 图片宽度
  const [imageHeight, setImageHeight] = useState(0) // 图片高度

  // const [imageWH, setImageWH] = useState({width:0,height:0}) // 图片宽度
  const [startMouse, setStartMouse] = useState([0, 0]) // 鼠标按下时，初始位置
  const [startImage, setStartImage] = useState([0, 0]) // 图片初始位置
  const [currentImage, setCurrentImage] = useState([0, 0]) // 图片当前位置
  const [scale, setScale] = useState(1) // 图片缩放比率
  const [startPoint, setStartPoint] = useState([0.5, 0.5]) // 相对于图片的位置
  const [currentPoint, setCurrentPoint] = useState([0.5, 0.5]) // 相对于图片的位置

  const viewportDOM = useRef<HTMLDivElement>(null)
  const imgDOM = useRef<HTMLImageElement>(null)
  const pointpDOM = useRef<HTMLDivElement>(null)
  // 初始化数据
  useEffect(() => {
    initViewport(width, height)
  }, [])

  // 参数改变时重新初始化图片
  useEffect(() => {
    initPicture()
  }, [src, center, contain, cover, renderPoint])

  useEffect(() => {
    const image = imgDOM.current

    // 一定要在改变时调有否则state获取不到，passive chrome 阻止滑动必填
    if (image) {
      image.addEventListener('wheel', handleMouseWheel, { passive: false })
    }
    changeSize(imageWidth, imageHeight)
    return () => {
      const image = imgDOM.current
      if (image) {
        image.removeEventListener('wheel', handleMouseWheel)
      }
    }
  }, [scale, currentImage])

  // 监听图片大小改变
  const changeSize = (imageWidth: number, imageHeight: number) => {
    const currentImageWidth = scale * imageWidth
    const currentImageHeight = scale * imageHeight
    const image = imgDOM.current

    if (image) {
      image.style.maxWidth = image.style.maxHeight = 'none'
      image.style.width = `${currentImageWidth}px`
      image.style.height = `${currentImageHeight}px`
    }

    changePointPostion(currentPoint[0], currentPoint[1])
  }

  const initViewport = (width: string, height: string) => {
    const currentDiv = viewportDOM.current
    if (currentDiv) {
      currentDiv.style.width = isNaN(+width) ? width : `${width}px`
      currentDiv.style.height = isNaN(+height) ? height : `${height}px`
    }
  }

  const initPicture = () => {
    // 这块有个执行顺序
    // 必须是先确定尺寸，再确定位置
    if (contain) {
      changeToContain()
    }

    // else if (cover) {
    //     changeToCover(callback)
    // } else {
    //     this._getImageOriginSize(src).then(({ width: imageWidth, height: imageHeight }) => {
    //         this.setState({
    //             scale: 1,
    //             imageWidth,
    //             imageHeight
    //         }, callback)
    //     }).catch((e: any) => {
    //         console.error(e)
    //     })
    // }
  }

  /**
   * 设置图片位置为 center
   */
  const changeToCenter = (wh: WHProps) => {
    const currentDiv = viewportDOM.current

    // 设置图片默认位置居中
    if (currentDiv) {
      const [viewPortWidth, viewPortHeight] = [
        currentDiv.clientWidth,
        currentDiv.clientHeight
      ]
      const postion = [
        (viewPortWidth - wh.width) / 2,
        (viewPortHeight - wh.height) / 2
      ]
      setCurrentImage(postion)
      setStartImage(postion)
      changePosition(postion[0], postion[1])
    }
  }

  /**
   * 设置图片位置为基准点位置
   * 基准点位置，基于视口: top: 0 && left: 0
   */
  // const changeToBasePoint = () => {
  //     setCurrentImage([0, 0])
  //     setStartImage([0, 0])
  //     changePosition(0,0)
  // }
  /**
   * 设置图片尺寸为 contain
   * @param src {String} 需要操作的图片的 src
   * @param callback {Function} changeToContain 完成后的回调函数，接受更新后的图片尺寸，即 imageWidth 和 imageHeight 两个参数
   */

  const changeToContain = () => {
    _getImageOriginSize(src)
      .then(({ width, height }) => {
        const imageWH = recalcImageSizeToContain(width, height)
        setImageHeight(imageWH.height)
        setImageWidth(imageWH.width)
        changeSize(imageWH.width, imageWH.height)
        changeToCenter(imageWH)
        // const callback = center ? changeToCenter(imageWH) : changeToBasePoint
      })
      .catch((e) => {
        console.error(e)
      })
  }

  /**
   * 重新计算图片尺寸，使宽高都不会超过视口尺寸
   * @param imageWidth
   * @param imageHeight
   * @returns {*}
   */
  const recalcImageSizeToContain = (width: number, height: number): WHProps => {
    const rate = width / height
    const tempViewportDOM = viewportDOM.current
    let [viewPortWidth, viewPortHeight] = [0, 0]
    if (tempViewportDOM) {
      ;[viewPortWidth, viewPortHeight] = [
        tempViewportDOM.clientWidth,
        tempViewportDOM.clientHeight
      ]
    }

    if (width > viewPortWidth) {
      width = viewPortWidth
      height = width / rate
      return recalcImageSizeToContain(width, height)
    } else if (height > viewPortHeight) {
      height = viewPortHeight
      width = height * rate
      return recalcImageSizeToContain(width, height)
    } else {
      return { width, height }
    }
  }

  /**
   * 获取图片原始尺寸信息
   * @param image
   * @returns {Promise<any>}
   * @private
   */
  const _getImageOriginSize = (src: string): Promise<WHProps> => {
    return new Promise((resolve) => {
      const image = new Image()
      image.src = src
      image.onload = function () {
        const { width, height } = image
        resolve({
          width,
          height
        })
      }
    })
  }

  /**
   * 改变图片位置
   * @param currentLeft {Number} 当前 left
   * @param currentTop {Number} 当前 top
   */
  const changePosition = (currentLeft: number, currentTop: number) => {
    const image = imgDOM.current
    if (image) {
      image.style.top = `${currentTop}px`
      image.style.left = `${currentLeft}px`
    }
  }
  /**
   * 修改标记的位置
   */
  const changePointPostion = (currentLeft: number, currentTop: number) => {
    const point = pointpDOM.current
    const currentImageWidth = scale * imageWidth * currentLeft
    const currentImageHeight = scale * imageHeight * currentTop

    if (point) {
      const width = point.clientWidth / 2
      const height = point.clientHeight / 2

      point.style.top = `${currentImage[1] + currentImageHeight - height}px`
      point.style.left = `${currentImage[0] + currentImageWidth - width}px`
    }
  }

  /**
   * 获取鼠标当前相对于某个元素的位置
   * @param e        {object}    原生事件对象
   * @param target {DOMobject} 目标DOM元素
   * @return object 包括offsetLeft和offsetTop
   *
   * Tips:
   * 1.offset 相关属性在 display: none 的元素上失效，为0
   * 2.offsetWidth/offsetHeight 包括border-width，clientWidth/clientHeight不包括border-width，只是可见区域而已
   * 3.offsetLeft/offsetTop 是从当前元素边框外缘开始算，一直到定位父元素的距离，clientLeft/clientTop其实就是border-width
   */
  const _getOffsetInElement = (
    e: any,
    target: HTMLElement
  ): { top: number; left: number; right: number; bottom: number } | null => {
    const currentDOM = e.target
    if (currentDOM && !_inTargetArea(currentDOM, target)) return null

    const { left: x, top: y } = _getOffset(target)
    const left = e.clientX - x
    const top = e.clientY - y
    const right = target.offsetWidth - left
    const bottom = target.offsetHeight - top
    return { top, left, right, bottom }
  }

  /**
   * 获取某个 DOM 元素相对视口的位置信息
   * @param el {object} 目标元素
   * @return object {object} 位置信息对象
   */
  const _getOffset = (el: HTMLElement) => {
    const doc = document.documentElement
    const docClientWidth = doc.clientWidth
    const docClientHeight = doc.clientHeight
    const positionInfo = el.getBoundingClientRect()
    return {
      left: positionInfo.left,
      top: positionInfo.top,
      right: docClientWidth - positionInfo.right,
      bottom: docClientHeight - positionInfo.bottom
    }
  }

  /**
   * 判断一个DOM元素是否包裹在另一个DOM元素中【父子关系或者层级嵌套都可以】
   * @param  {Object} DOM         事件对象中的event.target/或者是需要检测的DOM元素
   * @param  {Object} targetDOM   作为限制范围的DOM元素
   * @return {Boolean}            true----是包裹关系，false----不是包裹关系
   */
  const _inTargetArea = (DOM: EventTarget, targetDOM: HTMLElement) => {
    if (DOM instanceof Node) {
      if (DOM === targetDOM) return true
      let parent = DOM.parentNode
      while (parent != null) {
        if (parent === targetDOM) return true
        DOM = parent
        if (DOM instanceof Node) {
          parent = DOM.parentNode
        }
      }
      return false
    }
    return true
  }

  // 鼠标移出
  const handleMouseLeave = () => {
    handleMouseUp()
  }
  // 鼠标按下
  const handleMouseDown = (e: React.SyntheticEvent) => {
    const currentDOM = e.target
    const div = viewportDOM.current
    const point = pointpDOM.current
    let ishas = false
    if (currentDOM !== imgDOM.current) {
      if (point) {
        ishas = isHasElement(currentDOM, point)
        if (!ishas) {
          return
        } else {
          setFocusePoint(true)
        }
      } else {
        return
      }
    }

    if (div) {
      const postion = _getOffsetInElement(e, div)
      setFocuse(true)
      if (postion) setStartMouse([postion.left, postion.top])
    }
  }

  const isHasElement = (child: EventTarget, point: Element) => {
    if (child === point) {
      return true
    }
    const a = Array.from(point.children)
    let isHas = false
    a.forEach((item: Element) => {
      isHas = isHasElement(child, item)
    })
    return isHas
  }

  // 鼠标移动
  const handleMouseMove = (e: React.SyntheticEvent) => {
    if (!focuse) return

    const div = viewportDOM.current
    if (div) {
      const postion = _getOffsetInElement(e, div)
      if (postion) {
        const [diffX, diffY] = [
          postion.left - startMouse[0],
          postion.top - startMouse[1]
        ]
        if (focusePoint) {
          const w = diffX / imageWidth / scale
          const y = diffY / imageHeight / scale

          if (
            postion.left - startImage[0] < 0 ||
            postion.top - startImage[1] < 0 ||
            postion.left - startImage[0] > imageWidth * scale ||
            postion.top - startImage[1] > imageHeight * scale
          ) {
            handleMouseUp()
            return
          }

          setCurrentPoint([startPoint[0] + w, startPoint[1] + y])
          changePointPostion(startPoint[0] + w, startPoint[1] + y)
        } else {
          setCurrentImage([startImage[0] + diffX, startImage[1] + diffY])
          changePosition(startImage[0] + diffX, startImage[1] + diffY)
        }
      }
    }
  }
  // 鼠标抬起
  const handleMouseUp = () => {
    setFocusePoint(false)
    setFocuse(false)
    setStartMouse([0, 0])
    setStartImage([currentImage[0], currentImage[1]])
    setStartPoint([currentPoint[0], currentPoint[1]])
  }

  /**
   * 处理滚轮缩放
   * @param e {Event Object} 事件对象
   */
  const handleMouseWheel = (e: any) => {
    const image = imgDOM.current
    if (image) {
      // minimum, maximum, rate
      // const { imageWidth: originWidth, imageHeight: originHeight, currentLeft, currentTop, scale: lastScale } = this.state
      const imageWh = [image.clientWidth, image.clientHeight]
      const event = e.nativeEvent || e
      event.preventDefault()

      // 这块的 scale 每次都需要用 1 去加，作为图片的实时缩放比率
      const tScale = 1 + event.wheelDelta / (12000 / rate)
      // 最小缩放至 minimum 就不能再缩小了
      // 最大放大至 maximum 倍就不能再放大了
      if ((scale <= minimum && tScale < 1) || (scale >= maximum && tScale > 1))
        return
      // 真实的图片缩放比率需要用尺寸相除
      let nextScale = (imageWh[0] * tScale) / imageWidth

      // 进行缩放比率检测
      // 如果小于最小值，使用原始图片尺寸和最小缩放值
      // 如果大于最大值，使用最大图片尺寸和最大缩放值
      nextScale =
        nextScale <= minimum
          ? minimum
          : nextScale >= maximum
          ? maximum
          : nextScale
      const currentImageWidth = nextScale * imageWidth
      const currentImageHeight = nextScale * imageHeight

      const mPostion = _getOffsetInElement(e, image)
      if (mPostion) {
        const rateX = mPostion.left / imageWh[0]
        const rateY = mPostion.top / imageWh[1]
        const newLeft = rateX * currentImageWidth
        const newTop = rateY * currentImageHeight
        setStartImage([
          currentImage[0] + (mPostion.left - newLeft),
          currentImage[1] + (mPostion.top - newTop)
        ])
        setCurrentImage([
          currentImage[0] + (mPostion.left - newLeft),
          currentImage[1] + (mPostion.top - newTop)
        ])
        setScale(nextScale)
        changePosition(
          currentImage[0] + (mPostion.left - newLeft),
          currentImage[1] + (mPostion.top - newTop)
        )
      }

      // this.setState({
      //     scale: nextScale,
      //     startLeft: currentLeft + (left - newLeft),
      //     startTop: currentTop + (top - newTop),
      //     currentLeft: currentLeft + (left - newLeft),
      //     currentTop: currentTop + (top - newTop)
      // })
    }
  }

  return (
    <div
      ref={viewportDOM as React.RefObject<HTMLDivElement>}
      className={styles.marker}
      // ondragstart="return false;"

      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <img
        className={styles.img}
        ref={imgDOM as React.RefObject<HTMLImageElement>}
        src={src}
        alt=''
        draggable='false'
      />
      <div
        className={styles.point}
        ref={pointpDOM as React.RefObject<HTMLDivElement>}
      >
        {renderPoint}
      </div>
    </div>
  )
}

export default ImageMarker
