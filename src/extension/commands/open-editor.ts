/**
 * Claude Code Workflow Studio - Open Editor Command
 *
 * Creates and manages the Webview panel for the workflow editor
 * Based on: /specs/001-cc-wf-studio/contracts/vscode-extension-api.md section 1.1
 */

import * as vscode from 'vscode';
import { getWebviewContent } from '../webview-content';
import { FileService } from '../services/file-service';
import { loadWorkflowList } from './load-workflow-list';
import { loadWorkflow } from './load-workflow';
import type { WebviewMessage } from '../../shared/types/messages';

/**
 * Register the open editor command
 *
 * @param context - VSCode extension context
 */
export function registerOpenEditorCommand(context: vscode.ExtensionContext): vscode.WebviewPanel | null {
  let currentPanel: vscode.WebviewPanel | undefined;
  let fileService: FileService;

  const openEditorCommand = vscode.commands.registerCommand(
    'cc-wf-studio.openEditor',
    () => {
      // Initialize file service
      try {
        fileService = new FileService();
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to initialize File Service: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        return;
      }
      const columnToShowIn = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;

      // If panel already exists, reveal it
      if (currentPanel) {
        currentPanel.reveal(columnToShowIn);
        return;
      }

      // Create new webview panel
      currentPanel = vscode.window.createWebviewPanel(
        'ccWorkflowStudio',
        'Claude Code Workflow Studio',
        columnToShowIn || vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.joinPath(context.extensionUri, 'src', 'webview', 'dist'),
          ],
        }
      );

      // Set webview HTML content
      currentPanel.webview.html = getWebviewContent(currentPanel.webview, context.extensionUri);

      // Handle messages from webview
      currentPanel.webview.onDidReceiveMessage(
        async (message: WebviewMessage) => {
          switch (message.type) {
            case 'SAVE_WORKFLOW':
              // Execute save workflow command
              await vscode.commands.executeCommand(
                'cc-wf-studio.saveWorkflow',
                message.payload,
                currentPanel?.webview
              );
              break;

            case 'EXPORT_WORKFLOW':
              // TODO: Will be implemented in Phase 4
              console.log('EXPORT_WORKFLOW:', message.payload);
              break;

            case 'LOAD_WORKFLOW_LIST':
              // Load workflow list
              await loadWorkflowList(fileService, currentPanel!.webview, message.requestId);
              break;

            case 'LOAD_WORKFLOW':
              // Load specific workflow
              if (message.payload?.workflowId) {
                await loadWorkflow(
                  fileService,
                  currentPanel!.webview,
                  message.payload.workflowId,
                  message.requestId
                );
              } else {
                currentPanel!.webview.postMessage({
                  type: 'ERROR',
                  requestId: message.requestId,
                  payload: {
                    code: 'VALIDATION_ERROR',
                    message: 'Workflow ID is required',
                  },
                });
              }
              break;

            case 'STATE_UPDATE':
              // State update from webview (for persistence)
              console.log('STATE_UPDATE:', message.payload);
              break;

            case 'CONFIRM_OVERWRITE':
              // TODO: Will be implemented in Phase 4
              console.log('CONFIRM_OVERWRITE:', message.payload);
              break;

            default:
              console.warn('Unknown message type:', message);
          }
        },
        undefined,
        context.subscriptions
      );

      // Handle panel disposal
      currentPanel.onDidDispose(
        () => {
          currentPanel = undefined;
        },
        undefined,
        context.subscriptions
      );

      // Show information message
      vscode.window.showInformationMessage('Claude Code Workflow Studio: Editor opened!');
    }
  );

  context.subscriptions.push(openEditorCommand);

  return currentPanel || null;
}
