// Custom scroll-triggered fade/slide-in wrapper using motion/react
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

const FadeIn = ({
  children,
  direction = 'up',
  distance = 40,
  duration = 0.6,
  delay = 0,
  threshold = 0.1,
  className = '',
  once = true,
  blur = false,
  scale = false,
  ...props
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });

  const getInitial = () => {
    const initial = { opacity: 0 };
    if (blur) initial.filter = 'blur(8px)';
    if (scale) initial.scale = 0.95;

    switch (direction) {
      case 'up':
        initial.y = distance;
        break;
      case 'down':
        initial.y = -distance;
        break;
      case 'left':
        initial.x = distance;
        break;
      case 'right':
        initial.x = -distance;
        break;
      default:
        break;
    }
    return initial;
  };

  const getAnimate = () => {
    const animate = { opacity: 1, x: 0, y: 0 };
    if (blur) animate.filter = 'blur(0px)';
    if (scale) animate.scale = 1;
    return animate;
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={getInitial()}
      animate={isInView ? getAnimate() : getInitial()}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default FadeIn;
