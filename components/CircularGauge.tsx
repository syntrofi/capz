import React from 'react';

interface CircularGaugeProps {
  percentage?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

const CircularGauge: React.FC<CircularGaugeProps> = ({ 
  percentage = 0, 
  size = 100, 
  strokeWidth = 10, 
  color = '#00ff00' 
}) => {
  const validPercentage = Math.max(0, Math.min(100, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (validPercentage / 100) * circumference;

  return (
    <svg height={size} width={size} className="transform -rotate-90">
      <circle
        stroke="#e6e6e6"
        fill="transparent"
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
    </svg>
  );
};

export default CircularGauge;