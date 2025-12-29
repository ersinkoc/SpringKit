import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSpring } from '@oxog/springkit/react'

export function SpringDemo() {
  const [isOpen, setIsOpen] = useState(false)

  const style = useSpring({
    scale: isOpen ? 1.2 : 1,
    rotate: isOpen ? 180 : 0,
  })

  return (
    <div className="flex justify-center">
      <motion.div
        className="w-32 h-32 rounded-xl bg-gradient-to-br from-primary to-orange-500 cursor-pointer"
        style={{
          transform: `scale(${style.scale}) rotate(${style.rotate}deg)`,
        }}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: style.scale * 1.05 }}
        whileTap={{ scale: style.scale * 0.95 }}
      />
    </div>
  )
}
