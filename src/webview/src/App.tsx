/**
 * Claude Code Workflow Studio - Main App Component
 *
 * Root component for the Webview UI with 3-column layout
 * Based on: /specs/001-cc-wf-studio/plan.md
 */

import React, { useState } from 'react';
import { NodePalette } from './components/NodePalette';
import { WorkflowEditor } from './components/WorkflowEditor';
import { PropertyPanel } from './components/PropertyPanel';
import { Toolbar } from './components/Toolbar';
import { ErrorNotification } from './components/ErrorNotification';
import type { ErrorPayload } from '@shared/types/messages';

const App: React.FC = () => {
  const [error, setError] = useState<ErrorPayload | null>(null);

  const handleError = (errorData: ErrorPayload) => {
    setError(errorData);
  };

  const handleDismissError = () => {
    setError(null);
  };

  return (
    <div
      className="app"
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Top: Toolbar */}
      <Toolbar onError={handleError} />

      {/* Main Content: 3-column layout */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
        }}
      >
        {/* Left Panel: Node Palette */}
        <NodePalette />

        {/* Center: Workflow Editor */}
        <div style={{ flex: 1, position: 'relative' }}>
          <WorkflowEditor />
        </div>

        {/* Right Panel: Property Panel */}
        <PropertyPanel />
      </div>

      {/* Error Notification Overlay */}
      <ErrorNotification error={error} onDismiss={handleDismissError} />
    </div>
  );
};

export default App;
