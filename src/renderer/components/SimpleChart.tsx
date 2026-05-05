import React, { useState } from 'react';
import { Box, Typography, styled } from '@mui/material';

interface ChartDataPoint {
  sequence: number;
  time: number;
  success: boolean;
  name?: string;
  ip?: string;
}

interface SimpleChartProps {
  data: ChartDataPoint[];
  width?: number | string;
  height?: number | string;
  title?: string;
}

const ChartContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  backgroundColor: theme.palette.background.paper,
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: theme.spacing(2),
}));

const TooltipBox = styled(Box)(({ theme }) => ({
  position: 'absolute',
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '6px',
  padding: '6px 10px',
  pointerEvents: 'none',
  zIndex: 100,
  fontSize: '12px',
  color: '#fff',
  whiteSpace: 'nowrap',
}));

const SimpleChart: React.FC<SimpleChartProps> = ({
  data,
  width = '100%',
  height = 300,
  title = 'Response Time Chart',
}) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: ChartDataPoint } | null>(null);

  if (data.length === 0) {
    return (
      <ChartContainer sx={{ width, height }}>
        <Typography variant="body2" color="text.secondary" align="center">
          No data available for chart
        </Typography>
      </ChartContainer>
    );
  }

  const chartWidth = 800;
  const chartHeight = 220;
  const padding = { top: 30, right: 80, bottom: 50, left: 65 };

  const xValues = data.map(d => d.sequence);
  const yValues = data.map(d => d.time);

  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const rawMaxY = Math.max(...yValues);
  const maxY = rawMaxY < 1 ? 10 : rawMaxY * 1.2;

  const scaleX = (value: number) => {
    if (maxX === minX) return padding.left + (chartWidth - padding.left - padding.right) / 2;
    return padding.left + ((value - minX) / (maxX - minX)) * (chartWidth - padding.left - padding.right);
  };

  const scaleY = (value: number) => {
    if (maxY === 0) return chartHeight - padding.bottom;
    return chartHeight - padding.bottom - ((value - 0) / (maxY - 0)) * (chartHeight - padding.top - padding.bottom);
  };

  // Build full line path through ALL points (including failures at y=0)
  const allLinePoints = data.map((d, i) => {
    const x = scaleX(d.sequence);
    const y = scaleY(d.time);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Y axis tick values
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(r => maxY * r);

  // X axis ticks - show all if <= 20 points, otherwise sample
  const xTickCount = data.length <= 20 ? data.length : 10;
  const xTicks = data.length <= 20
    ? data.map(d => d.sequence)
    : Array.from({ length: xTickCount }, (_, i) =>
        minX + Math.round((i / (xTickCount - 1)) * (maxX - minX))
      );

  return (
    <ChartContainer sx={{ width, position: 'relative' }}>
      <Typography variant="h6" gutterBottom sx={{ fontSize: '0.95rem' }}>
        {title}
      </Typography>

      {/* Tooltip */}
      {tooltip && (
        <TooltipBox sx={{ left: tooltip.x + 12, top: tooltip.y - 10 }}>
          <div style={{ color: tooltip.point.success ? '#00ff88' : '#ff4444', fontWeight: 600 }}>
            {tooltip.point.name || `Hop ${tooltip.point.sequence}`}
          </div>
          {tooltip.point.ip && <div style={{ color: '#aaa' }}>IP: {tooltip.point.ip}</div>}
          <div>
            {tooltip.point.success
              ? `${tooltip.point.time} ms`
              : 'Timeout'}
          </div>
        </TooltipBox>
      )}

      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight + 10}`}
        style={{ width: '100%', height: typeof height === 'number' ? height - 60 : 240, display: 'block' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines Y */}
        {yTicks.map((val, i) => (
          <line
            key={`gy-${i}`}
            x1={padding.left} y1={scaleY(val)}
            x2={chartWidth - padding.right} y2={scaleY(val)}
            stroke="rgba(255,255,255,0.08)" strokeWidth="1"
          />
        ))}

        {/* Grid lines X */}
        {xTicks.map((val, i) => (
          <line
            key={`gx-${i}`}
            x1={scaleX(val)} y1={padding.top}
            x2={scaleX(val)} y2={chartHeight - padding.bottom}
            stroke="rgba(255,255,255,0.08)" strokeWidth="1"
          />
        ))}

        {/* Axes */}
        <line x1={padding.left} y1={chartHeight - padding.bottom} x2={chartWidth - padding.right} y2={chartHeight - padding.bottom} stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={chartHeight - padding.bottom} stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />

        {/* Y axis labels */}
        {yTicks.map((val, i) => (
          <text key={`yl-${i}`} x={padding.left - 8} y={scaleY(val) + 4} textAnchor="end" fill="rgba(255,255,255,0.6)" fontSize="11">
            {Math.round(val)}
          </text>
        ))}

        {/* X axis labels */}
        {xTicks.map((val, i) => (
          <text key={`xl-${i}`} x={scaleX(val)} y={chartHeight - padding.bottom + 18} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="11">
            {Math.round(val)}
          </text>
        ))}

        {/* Axis titles */}
        <text x={chartWidth / 2} y={chartHeight - 2} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11">
          Sequence Number
        </text>
        <text x={14} y={chartHeight / 2} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11" transform={`rotate(-90, 14, ${chartHeight / 2})`}>
          ms
        </text>

        {/* Full line through all points */}
        <path
          d={allLinePoints}
          fill="none"
          stroke="#00cc66"
          strokeWidth="2"
          strokeLinejoin="round"
          opacity="0.7"
        />

        {/* Data points with hover */}
        {data.map((point, index) => {
          const cx = scaleX(point.sequence);
          const cy = scaleY(point.time);
          const color = point.success ? '#00ff88' : '#ff4444';
          return (
            <g key={index}>
              {/* Invisible larger hit area */}
              <circle
                cx={cx} cy={cy} r={10}
                fill="transparent"
                style={{ cursor: 'crosshair' }}
                onMouseEnter={(e) => {
                  const svgRect = (e.currentTarget.closest('svg') as SVGElement).getBoundingClientRect();
                  const containerRect = (e.currentTarget.closest('.MuiBox-root') as HTMLElement)?.getBoundingClientRect();
                  if (containerRect) {
                    setTooltip({
                      x: e.clientX - containerRect.left,
                      y: e.clientY - containerRect.top,
                      point,
                    });
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
              />
              {/* Visible point */}
              <circle
                cx={cx} cy={cy} r={point.success ? 5 : 4}
                fill={color}
                stroke={color}
                strokeWidth="1.5"
                opacity="0.9"
                style={{ pointerEvents: 'none' }}
              />
            </g>
          );
        })}

        {/* Legend */}
        <circle cx={chartWidth - 70} cy={20} r={5} fill="#00ff88" />
        <text x={chartWidth - 62} y={24} fill="rgba(255,255,255,0.7)" fontSize="11">Success</text>
        <circle cx={chartWidth - 70} cy={38} r={5} fill="#ff4444" />
        <text x={chartWidth - 62} y={42} fill="rgba(255,255,255,0.7)" fontSize="11">Failure</text>
      </svg>
    </ChartContainer>
  );
};

export default SimpleChart;
