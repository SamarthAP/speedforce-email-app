import React, { useState, useEffect, useRef } from 'react';


const getRandomNumber = (min: number, max: number): number => Math.random() * (max - min) + min;

interface Dot {
  x: number;
  y: number;
  size: number;
  horizontalSpeed: number;
  verticalSpeed: number;
}

const generateRandomDots = (
  numDots: number,
  minSize: number,
  maxSize: number,
  maxWidth: number,
  maxHeight: number
): Dot[] => {
  const dots: Dot[] = [];
  for (let i = 0; i < numDots; i++) {
    const x = getRandomNumber(-200, maxWidth + 200);
    const y = getRandomNumber(-100, maxHeight + 100);
    const size = getRandomNumber(minSize, maxSize);
    const horizontalSpeed = getRandomNumber(-0.5, 0.5); // Adjust the horizontal speed range as needed
    const verticalSpeed = getRandomNumber(-0.5, 0.5); // Adjust the vertical speed range as needed
    dots.push({ x, y, size, horizontalSpeed, verticalSpeed });
  }
  return dots;
};

interface DotProps {
  x: number;
  y: number;
  size: number;
}

const Dot: React.FC<DotProps> = ({ x, y, size }) => {
  // Calculate the hue value based on the size
  const hue = Math.round((size - 5) * -2) + 240;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: `hsl(${hue}, 100%, 60%)`, // Use hsl color with dynamic hue value
      }}
    ></div>
  );
};

const RandomDots = () => {
  const numDots = 300; // Adjust the number of dots as needed
  const minSize = 3; // Minimum size of dots
  const maxSize = 13; // Maximum size of dots

  const [dots, setDots] = useState<Dot[]>([]);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [divPosition, setDivPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const requestRef = useRef<number>();

  useEffect(() => {
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;
    const randomDots = generateRandomDots(numDots, minSize, maxSize, maxWidth, maxHeight);

    setDots(randomDots);
  }, []);

  const moveDots = () => {
    setDots(prevDots =>
      prevDots.map(dot => {
        let newX = dot.x + dot.horizontalSpeed;
        let newY = dot.y + dot.verticalSpeed;

        // Wrap the dot movement around the window boundaries + some buffer space
        if (newX < -400) {
          newX = window.innerWidth + 400;
        } else if (newX > window.innerWidth + 400) {
          newX = -400;
        }

        if (newY < -200) {
          newY = window.innerHeight + 200;
        } else if (newY > window.innerHeight + 200) {
          newY = -200;
        }

        return { ...dot, x: newX, y: newY };
      })
    );

    requestRef.current = requestAnimationFrame(moveDots);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(moveDots);

    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  const handleMouseMove = (event: React.MouseEvent) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const distanceX = mouseX - centerX;
    const distanceY = mouseY - centerY;

    setMousePosition({ x: mouseX, y: mouseY });
    setDivPosition({ x: distanceX / 3, y: distanceY / 3 });
  };

  return (
    <div className="" style={{
      position: 'absolute',
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        transform: `translate(${divPosition.x}px, ${divPosition.y}px)`,
      }}
        onMouseMove={handleMouseMove}
        className="h-full w-screen"
      >
        {dots.map((dot, index) => (
          <Dot key={index} x={dot.x} y={dot.y} size={dot.size} />
        ))}
      </div>
    </div>
  );
};

export default RandomDots;