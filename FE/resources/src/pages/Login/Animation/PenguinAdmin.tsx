import React, { useRef, useEffect } from 'react';
import { Box } from '@mui/material';

interface PenguinProps {
  isPasswordField: boolean;
  isPasswordVisible: boolean;
  inputPosition: { x: number, y: number } | null;
}

const PenguinAdmin: React.FC<PenguinProps> = ({ isPasswordField, isPasswordVisible, inputPosition }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Handle eye movement based on input field position
  useEffect(() => {
    if (!svgRef.current || !inputPosition) return;
    
    const leftEye = svgRef.current.querySelector('#leftEye');
    const rightEye = svgRef.current.querySelector('#rightEye');
    
    if (leftEye && rightEye) {
      // Only move eyes if not in password field or if password is visible
      if (!isPasswordField || (isPasswordField && isPasswordVisible)) {
        // Calculate eye movement (limited range)
        const moveX = Math.min(Math.max(inputPosition.x - 0.5, -0.3), 0.3);
        const moveY = Math.min(Math.max(inputPosition.y - 0.5, -0.3), 0.3);
        
        // Apply transformation to eyes
        leftEye.setAttribute('transform', `translate(${moveX * 4} ${moveY * 4})`);
        rightEye.setAttribute('transform', `translate(${moveX * 4} ${moveY * 4})`);
      }
    }
  }, [inputPosition, isPasswordField, isPasswordVisible]);

  return (
    <Box
      sx={{
        width: '180px',
        height: '220px',
        margin: '0 auto',
        position: 'relative',
        animation: 'float 6s ease-in-out infinite',
        '@keyframes float': {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
          '100%': { transform: 'translateY(0px)' },
        },
      }}
    >
      <svg 
        ref={svgRef}
        viewBox="0 0 240 300" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Body */}
        <ellipse cx="120" cy="160" rx="70" ry="90" fill="#1F2937" />
        
        {/* White belly */}
        <ellipse cx="120" cy="170" rx="55" ry="75" fill="#F9FAFB" />
        
        {/* Head */}
        <circle cx="120" cy="90" r="55" fill="#1F2937" />
        
        {/* Face */}
        <ellipse cx="120" cy="100" rx="45" ry="40" fill="#F9FAFB" />
        
        {/* Beak */}
        <path d="M110 110 L130 110 L120 125 Z" fill="#FF9800" />
        
        {/* Eyes Group */}
        <g id="eyes">
          {/* Left Eye Socket */}
          <circle cx="100" cy="90" r="12" fill="white" />
          
          {/* Right Eye Socket */}
          <circle cx="140" cy="90" r="12" fill="white" />
          
          {/* Left Eye */}
          {isPasswordField && !isPasswordVisible ? (
            // Closed eye (line)
            <line 
              id="leftEye" 
              x1="95" y1="90" x2="105" y2="90" 
              stroke="#1F2937" 
              strokeWidth="3" 
              strokeLinecap="round"
            />
          ) : (
            // Open eye (with pupil)
            <g>
              <circle 
                id="leftEye" 
                cx="100" cy="90" r="5" 
                fill="#1F2937"
              />
              <circle cx="102" cy="88" r="2" fill="white" />
            </g>
          )}
          
          {/* Right Eye */}
          {isPasswordField && !isPasswordVisible ? (
            // Closed eye (line)
            <line 
              id="rightEye" 
              x1="135" y1="90" x2="145" y2="90" 
              stroke="#1F2937" 
              strokeWidth="3" 
              strokeLinecap="round"
            />
          ) : (
            // Open eye (with pupil)
            <g>
              <circle 
                id="rightEye" 
                cx="140" cy="90" r="5" 
                fill="#1F2937"
              />
              <circle cx="142" cy="88" r="2" fill="white" />
            </g>
          )}
        </g>
        
        {/* Wings */}
        <path 
          d="M50 160 Q60 130 50 100 Q75 120 75 160 Z" 
          fill="#1F2937"
          transform="rotate(-5 50 130)"
        />
        <path 
          d="M190 160 Q180 130 190 100 Q165 120 165 160 Z" 
          fill="#1F2937"
          transform="rotate(5 190 130)"
        />
        
        {/* Admin Badge */}
        <g transform="translate(90, 135) scale(0.8)">
          <rect x="0" y="0" width="60" height="25" rx="5" fill="#3B82F6" />
          <text x="30" y="17" fontFamily="Arial" fontSize="12" fontWeight="bold" fill="white" textAnchor="middle">ADMIN</text>
        </g>
        
        {/* Tie */}
        <path d="M120 130 L130 150 L120 170 L110 150 Z" fill="#DC2626" />
        
        {/* Feet */}
        <ellipse cx="95" cy="250" rx="15" ry="10" fill="#FF9800" transform="rotate(-15 95 250)" />
        <ellipse cx="145" cy="250" rx="15" ry="10" fill="#FF9800" transform="rotate(15 145 250)" />
      </svg>
    </Box>
  );
};

export default PenguinAdmin;