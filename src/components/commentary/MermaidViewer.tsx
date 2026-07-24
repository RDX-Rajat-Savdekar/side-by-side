import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Maximize2, Minimize2, Network } from 'lucide-react';

interface MermaidViewerProps {
  chart: string;
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  themeVariables: {
    darkMode: true,
    background: '#161b22',
    primaryColor: '#21262d',
    primaryTextColor: '#e6edf3',
    primaryBorderColor: '#58a6ff',
    lineColor: '#8b949e',
    secondaryColor: '#1c2128',
    tertiaryColor: '#0d1117',
  }
});

export const MermaidViewer: React.FC<MermaidViewerProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      if (!chart) return;
      try {
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        if (isMounted) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('Mermaid rendering warning:', err);
          setError('Failed to render architecture diagram');
        }
      }
    };

    renderDiagram();
    return () => { isMounted = false; };
  }, [chart]);

  if (error || !chart) return null;

  return (
    <div className={`mermaid-card ${isExpanded ? 'expanded-modal' : ''}`}>
      <div className="card-header">
        <div className="card-title">
          <Network size={16} className="text-accent-blue" />
          <span>Class & Architecture Diagram</span>
        </div>
        <button
          className="btn-icon"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? "Collapse diagram" : "Expand diagram fullscreen"}
        >
          {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      <div className="card-body diagram-body" ref={containerRef}>
        <div
          className="mermaid-svg-container"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>
    </div>
  );
};
