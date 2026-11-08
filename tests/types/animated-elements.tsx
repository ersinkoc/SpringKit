import * as React from 'react'
import { Animated } from '@oxog/springkit/react'
export const html = <Animated.div ref={React.createRef<HTMLDivElement>()} />
export const svg = <Animated.svg ref={React.createRef<SVGSVGElement>()} />
export const path = <Animated.path ref={React.createRef<SVGPathElement>()} />
