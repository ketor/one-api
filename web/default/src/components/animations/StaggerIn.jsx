// Staggered children animation using motion/react
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

const StaggerIn = ({
  children,
  staggerDelay = 0.1,
  direction = 'up',
  distance = 30,
  duration = 0.5,
  threshold = 0.1,
  className = '',
  childClassName = '',
  once = true,
  ...props
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });

  const getChildInitial = () => {
    const initial = { opacity: 0 };
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

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const childVariants = {
    hidden: getChildInitial(),
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={containerVariants}
      initial='hidden'
      animate={isInView ? 'visible' : 'hidden'}
      {...props}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div key={i} variants={childVariants} className={childClassName}>
              {child}
            </motion.div>
          ))
        : <motion.div variants={childVariants} className={childClassName}>{children}</motion.div>
      }
    </motion.div>
  );
};

export default StaggerIn;
