import React from 'react';

interface CircularGaugeProps {
  percentage: number;
  size: number;
  strokeWidth: number;
  color: string;
}

const CircularGauge: React.FC<CircularGaugeProps> = ({ percentage, size, strokeWidth, color }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const fillPercentage = Math.min(percentage, 100);
  const overflowPercentage = Math.max(0, percentage - 100);
  const dashOffset = circumference - (fillPercentage / 100) * circumference;
  const overflowDashOffset = circumference - (overflowPercentage / 100) * circumference;

  const thinStrokeWidth = strokeWidth / 6;
  const shadowArcLength = (Math.PI / 180) * radius; // Approximately 1 degree of arc

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Thin background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#444444"
        strokeWidth={thinStrokeWidth}
      />
      
      {/* Filled gauge (always visible) */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      
      {/* Shadow for the front of the line (visible when >= 100%) */}
      {percentage >= 100 && (
        <>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${shadowArcLength} ${circumference}`}
            strokeDashoffset={overflowDashOffset + shadowArcLength / 2}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            filter="url(#shadow)"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${shadowArcLength} ${circumference}`}
            strokeDashoffset={overflowDashOffset - shadowArcLength / 2}
            strokeLinecap="round"
            transform={`rotate(90 ${size / 2} ${size / 2})`}
            filter="url(#shadow)"
          />
        </>
      )}
      
      {/* Shadow filter */}
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="1" stdDeviation="2" floodColor="black" floodOpacity="0.3" />
        </filter>
      </defs>
    </svg>
  );
};

export default CircularGauge;