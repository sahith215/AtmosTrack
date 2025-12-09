import React, { useState, useEffect } from 'react';

interface CountUpProps {
  end: number;
  duration?: number;
  start?: number;
}

const CountUp: React.FC<CountUpProps> = ({ end, duration = 1000, start = 0 }) => {
  const [count, setCount] = useState(start);

  useEffect(() => {
    if (end === 0) return;
    
    const increment = end / (duration / 16); // 60fps
    let current = start;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end, duration, start]);

  return <span>{count}</span>;
};

export default CountUp;