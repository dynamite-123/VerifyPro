'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { Settings, Play, RotateCcw, Activity, Eye, Shield, TrendingUp } from 'lucide-react';

// Types
interface NetworkNode extends d3.SimulationNodeDatum {
  id: string;
  type: 'target' | 'shell' | 'person' | 'hidden' | 'institution' | 'trust';
  name: string;
  risk: number;
  assets: string;
  jurisdiction: string;
}

interface NetworkLink extends d3.SimulationLinkDatum<NetworkNode> {
  source: string | NetworkNode;
  target: string | NetworkNode;
  strength: number;
  type: 'ownership' | 'control' | 'hidden' | 'financial' | 'associate';
  percentage: string;
}

interface QuantumState {
  qubits: number;
  coherenceTime: number;
  fidelity: number;
  entangledPairs: number;
  quantumVolume: number;
  isAnalyzing: boolean;
  progress: number;
  phase: string;
}

interface AnalysisResults {
  riskScore: number;
  hiddenOwners: Array<{
    entity: string;
    target: string;
    strength: number;
    risk: number;
    type: string;
    percentage: string;
  }>;
  riskLinks: Array<{
    entity?: string;
    endpoint?: string;
    risk?: number;
    totalRisk?: number;
    path?: string[];
    connections?: number;
    type?: string;
  }>;
}

const QuantumTrustGraph: React.FC = () => {
  // State management
  const [quantumState, setQuantumState] = useState<QuantumState>({
    qubits: 12,
    coherenceTime: 100,
    fidelity: 0.999,
    entangledPairs: 0,
    quantumVolume: 0,
    isAnalyzing: false,
    progress: 0,
    phase: 'Idle'
  });

  const [analysisResults, setAnalysisResults] = useState<AnalysisResults>({
    riskScore: 0,
    hiddenOwners: [],
    riskLinks: []
  });

  const [showSettings, setShowSettings] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, data: null as NetworkNode | null });

  // Refs
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<NetworkNode, NetworkLink> | null>(null);

  // Network data
  const networkData = {
    nodes: [
      { id: 'TARGET_CORP', type: 'target', name: 'Zenith Industries Ltd', risk: 0.3, x: 400, y: 300, assets: '$2.4B', jurisdiction: 'Delaware' },
      { id: 'SHELL_A', type: 'shell', name: 'Nebula Holdings SA', risk: 0.85, x: 200, y: 150, assets: '$450M', jurisdiction: 'Panama' },
      { id: 'SHELL_B', type: 'shell', name: 'Apex Investments BV', risk: 0.92, x: 600, y: 150, assets: '$680M', jurisdiction: 'Netherlands' },
      { id: 'BENEFICIAL_1', type: 'person', name: 'Alexander Petrov', risk: 0.75, x: 100, y: 100, assets: '$120M', jurisdiction: 'Cyprus' },
      { id: 'BENEFICIAL_2', type: 'person', name: 'Elena Rodriguez', risk: 0.68, x: 300, y: 50, assets: '$95M', jurisdiction: 'Switzerland' },
      { id: 'BENEFICIAL_HIDDEN', type: 'hidden', name: 'Unknown Entity #1', risk: 0.98, x: 700, y: 100, assets: 'Unknown', jurisdiction: 'Unknown' },
      { id: 'BANK_A', type: 'institution', name: 'Alpine Private Banking', risk: 0.45, x: 150, y: 400, assets: '$12B', jurisdiction: 'Switzerland' },
      { id: 'TRUST_A', type: 'trust', name: 'Oceanic Trust Foundation', risk: 0.88, x: 650, y: 400, assets: '$320M', jurisdiction: 'Cook Islands' },
      { id: 'SHELL_C', type: 'shell', name: 'Quantum Ventures Ltd', risk: 0.79, x: 500, y: 450, assets: '$280M', jurisdiction: 'BVI' },
      { id: 'BENEFICIAL_3', type: 'person', name: 'Viktor Kozlov', risk: 0.82, x: 750, y: 250, assets: '$65M', jurisdiction: 'Malta' },
      { id: 'CRYPTO_EXCHANGE', type: 'institution', name: 'Digital Asset Exchange', risk: 0.71, x: 350, y: 500, assets: '$1.8B', jurisdiction: 'Estonia' }
    ] as NetworkNode[],
    links: [
      { source: 'SHELL_A', target: 'TARGET_CORP', strength: 0.85, type: 'ownership', percentage: '34%' },
      { source: 'SHELL_B', target: 'TARGET_CORP', strength: 0.72, type: 'ownership', percentage: '28%' },
      { source: 'BENEFICIAL_1', target: 'SHELL_A', strength: 0.91, type: 'control', percentage: '67%' },
      { source: 'BENEFICIAL_2', target: 'SHELL_A', strength: 0.73, type: 'control', percentage: '33%' },
      { source: 'BENEFICIAL_HIDDEN', target: 'SHELL_B', strength: 0.96, type: 'hidden', percentage: '89%' },
      { source: 'BANK_A', target: 'SHELL_A', strength: 0.54, type: 'financial', percentage: 'N/A' },
      { source: 'TRUST_A', target: 'SHELL_B', strength: 0.87, type: 'financial', percentage: 'N/A' },
      { source: 'BENEFICIAL_HIDDEN', target: 'TRUST_A', strength: 0.93, type: 'hidden', percentage: '78%' },
      { source: 'SHELL_C', target: 'TARGET_CORP', strength: 0.65, type: 'ownership', percentage: '15%' },
      { source: 'BENEFICIAL_3', target: 'SHELL_C', strength: 0.88, type: 'control', percentage: '92%' },
      { source: 'CRYPTO_EXCHANGE', target: 'SHELL_B', strength: 0.69, type: 'financial', percentage: 'N/A' },
      { source: 'BENEFICIAL_3', target: 'BENEFICIAL_HIDDEN', strength: 0.84, type: 'associate', percentage: 'N/A' }
    ] as NetworkLink[]
  };

  // Utility functions
  const getLinkColor = (type: string): string => {
    const colors: Record<string, string> = {
      'ownership': '#3b82f6',  // Blue
      'control': '#f59e0b',    // Amber
      'hidden': '#ef4444',     // Red
      'financial': '#10b981',  // Green
      'associate': '#8b5cf6'   // Purple
    };
    return colors[type] || '#6b7280';  // Gray default
  };

  const getNodeColor = (type: string, risk: number): string => {
    const intensity = Math.min(1, risk);
    const colors: Record<string, string> = {
      'target': `rgba(59, 130, 246, ${0.7 + intensity * 0.3})`,   // Blue
      'shell': `rgba(239, 68, 68, ${0.6 + intensity * 0.4})`,     // Red
      'person': `rgba(16, 185, 129, ${0.6 + intensity * 0.4})`,   // Green
      'hidden': `rgba(220, 38, 38, ${0.8 + intensity * 0.2})`,    // Red (darker)
      'institution': `rgba(139, 92, 246, ${0.6 + intensity * 0.4})`, // Purple
      'trust': `rgba(245, 158, 11, ${0.6 + intensity * 0.4})`     // Amber
    };
    return colors[type] || '#6b7280';  // Gray default
  };

  const getNodeSize = (type: string): number => {
    const sizes: Record<string, number> = {
      'target': 25,
      'shell': 18,
      'person': 15,
      'hidden': 20,
      'institution': 16,
      'trust': 17
    };
    return sizes[type] || 12;
  };

  // Network visualization
  const initializeNetwork = useCallback(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 600;

    svg.selectAll('*').remove();

    // Create simulation
    const simulation = d3.forceSimulation(networkData.nodes)
      .force('link', d3.forceLink(networkData.links).id((d: any) => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30))
      .alpha(0.3)
      .stop(); // Stop the simulation immediately
      
    // Run the simulation synchronously for a fixed number of ticks
    // This will calculate positions without animation
    simulation.tick(300);

    simulationRef.current = simulation;

    // Add gradients
    const defs = svg.append('defs');
    const riskGradient = defs.append('linearGradient').attr('id', 'riskGradient');
    riskGradient.append('stop').attr('offset', '0%').attr('stop-color', '#10b981');
    riskGradient.append('stop').attr('offset', '50%').attr('stop-color', '#f59e0b');
    riskGradient.append('stop').attr('offset', '100%').attr('stop-color', '#ef4444');

    // Add links
    const link = svg.append('g')
      .selectAll('line')
      .data(networkData.links)
      .enter()
      .append('line')
      .attr('stroke', (d: any) => getLinkColor(d.type))
      .attr('stroke-width', (d: any) => Math.max(1, d.strength * 4))
      .attr('stroke-dasharray', (d: any) => d.type === 'hidden' ? '5,5' : 'none')
      .style('opacity', 0.8);

    // Add nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(networkData.nodes)
      .enter()
      .append('circle')
      .attr('r', (d: any) => getNodeSize(d.type))
      .attr('fill', (d: any) => getNodeColor(d.type, d.risk))
      .style('cursor', 'pointer')
      .style('stroke', '#fff')
      .style('stroke-width', '2px')
      .on('mouseover', function(event: any, d: any) {
        setTooltip({ show: true, x: event.pageX, y: event.pageY, data: d });
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', getNodeSize(d.type) * 1.2);
      })
      .on('mouseout', function(event: any, d: any) {
        setTooltip({ show: false, x: 0, y: 0, data: null });
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', getNodeSize(d.type));
      })
      .on('click', (event: any, d: any) => {
        setSelectedNode(d);
      });

    // Add labels
    const label = svg.append('g')
      .selectAll('text')
      .data(networkData.nodes)
      .enter()
      .append('text')
      .text((d: any) => d.name)
      .attr('dy', (d: any) => getNodeSize(d.type) + 15)
      .style('font-size', '10px')
      .style('text-anchor', 'middle')
      .style('fill', '#333')  // Dark color for better visibility on white background
      .style('pointer-events', 'none');

    // Update positions once (no animation)
    link
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y);

    node
      .attr('cx', (d: any) => d.x)
      .attr('cy', (d: any) => d.y);

    label
      .attr('x', (d: any) => d.x)
      .attr('y', (d: any) => d.y);

    // Add static drag behavior without simulation
    node.call(d3.drag<any, any>()
      .on('drag', (event: any, d: any) => {
        // Move the node
        d.x = event.x;
        d.y = event.y;
        d3.select(event.sourceEvent.target)
          .attr('cx', d.x)
          .attr('cy', d.y);

        // Move connected links
        link
          .filter((l: any) => l.source.id === d.id || l.target.id === d.id)
          .attr('x1', (l: any) => l.source.x)
          .attr('y1', (l: any) => l.source.y)
          .attr('x2', (l: any) => l.target.x)
          .attr('y2', (l: any) => l.target.y);
        
        // Move the label
        label
          .filter((t: any) => t.id === d.id)
          .attr('x', d.x)
          .attr('y', d.y);
      }));

  }, [networkData]);

  // Quantum state updates
  const updateQuantumState = useCallback(() => {
    setQuantumState(prev => {
      const entangledPairs = Math.floor(Math.random() * (prev.qubits / 2));
      const quantumVolume = Math.floor(prev.qubits * prev.fidelity * (prev.coherenceTime / 100));
      
      return {
        ...prev,
        entangledPairs,
        quantumVolume
      };
    });
  }, []);

  // Analysis functions
  const runQuantumAnalysis = async () => {
    if (quantumState.isAnalyzing) return;

    setQuantumState(prev => ({ ...prev, isAnalyzing: true, progress: 0, phase: 'Initialization' }));

    const phases = [
      { phase: 'Initialization', progress: 10, duration: 1000 },
      { phase: 'Superposition', progress: 25, duration: 1200 },
      { phase: 'Entanglement', progress: 45, duration: 1500 },
      { phase: 'Graph Traversal', progress: 65, duration: 2000 },
      { phase: 'Interference', progress: 80, duration: 1000 },
      { phase: 'Measurement', progress: 95, duration: 800 },
      { phase: 'Complete', progress: 100, duration: 500 }
    ];

    for (const phaseData of phases) {
      await new Promise(resolve => setTimeout(resolve, phaseData.duration));
      setQuantumState(prev => ({ ...prev, phase: phaseData.phase, progress: phaseData.progress }));
      updateQuantumState();
    }

    // Perform analysis
    const riskScore = networkData.nodes.reduce((sum, node) => sum + node.risk, 0) / networkData.nodes.length;
    
    const hiddenOwners = networkData.links
      .filter(link => link.type === 'hidden' || link.strength > 0.8)
      .map(link => {
        const sourceNode = networkData.nodes.find(n => n.id === link.source);
        const targetNode = networkData.nodes.find(n => n.id === link.target);
        return {
          entity: sourceNode?.name || '',
          target: targetNode?.name || '',
          strength: link.strength,
          risk: sourceNode?.risk || 0,
          type: link.type,
          percentage: link.percentage
        };
      });

    const riskLinks = networkData.nodes
      .filter(node => node.risk > 0.6)
      .map(node => ({
        entity: node.name,
        risk: node.risk,
        type: node.type
      }));

    setAnalysisResults({ riskScore, hiddenOwners, riskLinks });
    setQuantumState(prev => ({ ...prev, isAnalyzing: false }));
  };

  const resetAnalysis = () => {
    setQuantumState(prev => ({ ...prev, progress: 0, phase: 'Idle' }));
    setAnalysisResults({ riskScore: 0, hiddenOwners: [], riskLinks: [] });
    setSelectedNode(null);
  };

  // Effects
  useEffect(() => {
    initializeNetwork();
  }, [initializeNetwork]);

  useEffect(() => {
    const interval = setInterval(updateQuantumState, 2000);
    return () => clearInterval(interval);
  }, [updateQuantumState]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-gray-800">Ownership Network Analysis</h1>
              <p className="text-sm text-gray-500">Analyze hidden relationships and risk patterns</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg">
              <div className={`w-2 h-2 ${quantumState.isAnalyzing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'} rounded-full`} />
              <span className="text-gray-600 text-sm">{quantumState.phase === 'Idle' ? 'Ready' : quantumState.phase}</span>
            </div>
            
            <button
              onClick={() => setShowSettings(true)}
              className="px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            
            <button
              onClick={runQuantumAnalysis}
              disabled={quantumState.isAnalyzing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all disabled:opacity-50"
            >
              {quantumState.isAnalyzing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {quantumState.isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
            </button>
            
            <button
              onClick={resetAnalysis}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
        {/* Main Visualization */}
        <div className="lg:col-span-2 xl:col-span-3 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              Network Topology
            </h2>
            <span className="text-gray-500 text-sm">
              Nodes: {networkData.nodes.length} | Links: {networkData.links.length}
            </span>
          </div>
          <div className="relative h-[550px] md:h-[600px]">
            <svg ref={svgRef} width="100%" height="100%" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 self-start lg:sticky lg:top-20 space-y-6">
          {/* Analysis Progress */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-medium text-gray-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-600" />
                Analysis Progress
              </h3>
            </div>
            <div className="p-4">
              <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${quantumState.progress}%` }}
                />
              </div>
              <p className="text-center text-gray-500 text-sm">{quantumState.phase}</p>
            </div>
          </div>

          {/* Quantum Metrics */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-medium text-gray-800">Quantum Metrics</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 border border-gray-100 rounded-lg">
                  <div className="text-xl font-medium text-gray-800">{quantumState.coherenceTime}μs</div>
                  <div className="text-xs text-gray-500">Coherence</div>
                </div>
                <div className="text-center p-3 bg-gray-50 border border-gray-100 rounded-lg">
                  <div className="text-xl font-medium text-gray-800">{(quantumState.fidelity * 100).toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">Fidelity</div>
                </div>
                <div className="text-center p-3 bg-gray-50 border border-gray-100 rounded-lg">
                  <div className="text-xl font-medium text-gray-800">{quantumState.entangledPairs}</div>
                  <div className="text-xs text-gray-500">Entangled</div>
                </div>
                <div className="text-center p-3 bg-gray-50 border border-gray-100 rounded-lg">
                  <div className="text-xl font-medium text-gray-800">{quantumState.quantumVolume}</div>
                  <div className="text-xs text-gray-500">Q-Volume</div>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-medium text-gray-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-gray-600" />
                Risk Assessment
              </h3>
            </div>
            <div className="p-4">
              <div className="text-center p-3 bg-red-50 border border-red-100 rounded-lg mb-4">
                <div className="text-2xl font-medium text-red-600">{(analysisResults.riskScore * 100).toFixed(1)}%</div>
                <div className="text-xs text-red-500">Overall Risk Score</div>
              </div>
              <div className="space-y-2 max-h-[160px] overflow-y-auto">
                {analysisResults.riskLinks.slice(0, 5).map((item, index) => (
                  <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="font-medium text-gray-800 text-sm">{item.entity || item.endpoint}</div>
                    <div className="text-red-500 text-xs">Risk: {((item.risk || item.totalRisk || 0) * 100).toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hidden Ownership */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-medium text-gray-800 flex items-center gap-2">
                <Eye className="w-5 h-5 text-gray-600" />
                Hidden Ownership
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-2 max-h-[160px] overflow-y-auto">
                {analysisResults.hiddenOwners.slice(0, 4).map((owner, index) => (
                  <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="font-medium text-gray-800 text-sm">{owner.entity}</div>
                    <div className="text-amber-500 text-xs">Control: {owner.percentage} | Risk: {(owner.risk * 100).toFixed(1)}%</div>
                    <div className="text-gray-500 text-xs">Connected to: {owner.target}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.show && tooltip.data && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 rounded-lg p-3 pointer-events-none shadow-lg"
          style={{ left: tooltip.x + 10, top: tooltip.y + 10 }}
        >
          <div className="font-medium text-gray-800">{tooltip.data.name}</div>
          <div className="text-gray-600">Type: {tooltip.data.type.charAt(0).toUpperCase() + tooltip.data.type.slice(1)}</div>
          <div className="text-red-500">Risk Score: {(tooltip.data.risk * 100).toFixed(1)}%</div>
          <div className="text-green-600">Assets: {tooltip.data.assets}</div>
          <div className="text-blue-600">Jurisdiction: {tooltip.data.jurisdiction}</div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium text-gray-800">Analysis Configuration</h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-600 mb-2 text-sm">API Key</label>
                <input 
                  type="password" 
                  placeholder="Enter API Key for Enhanced Analysis"
                  className="w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 border-gray-200"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-2 text-sm">Quantum Qubits</label>
                <input 
                  type="number" 
                  value={quantumState.qubits}
                  onChange={(e) => setQuantumState(prev => ({ ...prev, qubits: parseInt(e.target.value) || 12 }))}
                  min="4" 
                  max="20"
                  className="w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 border-gray-200"
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-500 shadow-sm rounded-lg"
                >
                  Save Configuration
                </button>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 bg-transparent hover:bg-gray-50 focus:ring-gray-300 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuantumTrustGraph;
