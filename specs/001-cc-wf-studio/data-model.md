# Data Model: Claude Code Workflow Studio

**Branch**: 001-cc-wf-studio
**Date**: 2025-11-01
**Status**: Phase 1 Design

## Overview

このドキュメントは、Claude Code Workflow Studio のデータモデル定義を記述します。主要なエンティティ、フィールド、関係性、バリデーションルール、状態遷移を定義します。

---

## 1. Core Entities

### 1.1 Workflow（ワークフロー）

ワークフローは、複数のノードとその接続関係で構成される実行可能な定義です。

#### Fields:

| フィールド | 型 | 必須 | デフォルト | 説明 |
|----------|------|------|-----------|------|
| `id` | `string` | ✅ | UUID | ワークフローの一意識別子 |
| `name` | `string` | ✅ | - | ワークフロー名（ファイル名のベース） |
| `description` | `string` | ❌ | `""` | ワークフローの説明（エクスポート時にSlashCommandのdescriptionに使用） |
| `version` | `string` | ✅ | `"1.0.0"` | セマンティックバージョニング（MAJOR.MINOR.PATCH） |
| `nodes` | `WorkflowNode[]` | ✅ | `[]` | ワークフローに含まれるノードの配列 |
| `connections` | `Connection[]` | ✅ | `[]` | ノード間の接続の配列 |
| `createdAt` | `Date` | ✅ | `new Date()` | 作成日時（ISO 8601形式） |
| `updatedAt` | `Date` | ✅ | `new Date()` | 最終更新日時（ISO 8601形式） |
| `metadata` | `WorkflowMetadata` | ❌ | `{}` | その他のメタデータ（将来の拡張用） |

#### TypeScript Definition:

```typescript
interface Workflow {
  id: string;
  name: string;
  description?: string;
  version: string;
  nodes: WorkflowNode[];
  connections: Connection[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: WorkflowMetadata;
}

interface WorkflowMetadata {
  tags?: string[];
  author?: string;
  [key: string]: unknown;
}
```

#### Validation Rules:

- `name`: 1-100文字、英数字とハイフン・アンダースコアのみ、ファイル名として有効であること
- `version`: セマンティックバージョニング形式（例: `1.0.0`, `2.1.3`）
- `nodes`: 最大50ノード（NFR-001）
- `connections`: 循環参照の警告（MVP版では検出しない - Edge Cases参照）

---

### 1.2 Node（ノード）

ノードはワークフロー内の1つの処理単位です。2種類のノードタイプ（AgentSkills、AskUserQuestion）をサポートします。

#### Base Node Fields:

| フィールド | 型 | 必須 | デフォルト | 説明 |
|----------|------|------|-----------|------|
| `id` | `string` | ✅ | UUID | ノードの一意識別子 |
| `type` | `NodeType` | ✅ | - | ノードタイプ（`'agentSkill'` または `'askUserQuestion'`） |
| `name` | `string` | ✅ | - | ノード名（エクスポート時にファイル名のベース） |
| `position` | `Position` | ✅ | `{x: 0, y: 0}` | キャンバス上の位置座標 |
| `data` | `NodeData` | ✅ | - | ノードタイプ固有のデータ |

#### NodeType Enum:

```typescript
enum NodeType {
  AgentSkill = 'agentSkill',
  AskUserQuestion = 'askUserQuestion'
}
```

#### Position:

```typescript
interface Position {
  x: number; // ピクセル単位
  y: number; // ピクセル単位
}
```

---

### 1.3 AgentSkillNode（AgentSkillsノード）

AgentSkillsノードは、Claude Code の AgentSkills を呼び出すノードです。

#### Fields:

| フィールド | 型 | 必須 | デフォルト | 説明 |
|----------|------|------|-----------|------|
| `id` | `string` | ✅ | UUID | ノードID（ベースノードから継承） |
| `type` | `'agentSkill'` | ✅ | - | 固定値 `'agentSkill'` |
| `name` | `string` | ✅ | - | ノード名（エクスポート時に `{name}.md` として保存） |
| `position` | `Position` | ✅ | - | キャンバス上の位置 |
| `data` | `AgentSkillData` | ✅ | - | AgentSkills固有のデータ |

#### AgentSkillData:

| フィールド | 型 | 必須 | デフォルト | 説明 |
|----------|------|------|-----------|------|
| `prompt` | `string` | ✅ | - | AgentSkillsのプロンプト内容（SKILL.mdのボディに出力） |
| `outputPorts` | `number` | ✅ | `1` | 出力ポート数（通常は1、MVP版では固定） |

#### TypeScript Definition:

```typescript
interface AgentSkillNode extends Node {
  type: 'agentSkill';
  data: AgentSkillData;
}

interface AgentSkillData {
  prompt: string;
  outputPorts: number;
}
```

#### Validation Rules:

- `name`: 1-50文字、英数字とハイフン・アンダースコアのみ、小文字に変換されてファイル名として使用
- `prompt`: 1-10000文字、空白のみは不可
- `outputPorts`: 固定値1（MVP版）

---

### 1.4 AskUserQuestionNode（AskUserQuestionノード）

AskUserQuestionノードは、Claude Code の AskUserQuestion ツールを使用して条件分岐を行うノードです。

#### Fields:

| フィールド | 型 | 必須 | デフォルト | 説明 |
|----------|------|------|-----------|------|
| `id` | `string` | ✅ | UUID | ノードID |
| `type` | `'askUserQuestion'` | ✅ | - | 固定値 `'askUserQuestion'` |
| `name` | `string` | ✅ | - | ノード名（識別用） |
| `position` | `Position` | ✅ | - | キャンバス上の位置 |
| `data` | `AskUserQuestionData` | ✅ | - | AskUserQuestion固有のデータ |

#### AskUserQuestionData:

| フィールド | 型 | 必須 | デフォルト | 説明 |
|----------|------|------|-----------|------|
| `questionText` | `string` | ✅ | - | ユーザーに表示する質問文 |
| `options` | `QuestionOption[]` | ✅ | - | 選択肢リスト（2-4個） |
| `outputPorts` | `number` | ✅ | `options.length` | 出力ポート数（選択肢数と同じ、2-4） |

#### QuestionOption:

| フィールド | 型 | 必須 | デフォルト | 説明 |
|----------|------|------|-----------|------|
| `label` | `string` | ✅ | - | 選択肢のラベル（ユーザーに表示） |
| `description` | `string` | ✅ | - | 選択肢の説明 |

#### TypeScript Definition:

```typescript
interface AskUserQuestionNode extends Node {
  type: 'askUserQuestion';
  data: AskUserQuestionData;
}

interface AskUserQuestionData {
  questionText: string;
  options: QuestionOption[];
  outputPorts: number; // 2-4
}

interface QuestionOption {
  label: string;
  description: string;
}
```

#### Validation Rules:

- `questionText`: 1-500文字、疑問文形式推奨
- `options`: 2-4個の配列、必須
- `options[].label`: 1-50文字
- `options[].description`: 1-200文字
- `outputPorts`: 2-4の範囲、`options.length` と一致すること

---

### 1.5 Connection（接続）

Connectionは2つのノード間の実行順序を表します。

#### Fields:

| フィールド | 型 | 必須 | デフォルト | 説明 |
|----------|------|------|-----------|------|
| `id` | `string` | ✅ | UUID | 接続の一意識別子 |
| `from` | `string` | ✅ | - | 開始ノードID（ノードの `id`） |
| `to` | `string` | ✅ | - | 終了ノードID（ノードの `id`） |
| `fromPort` | `string` | ✅ | - | 開始ノードの出力ポートID（例: `'output'`, `'branch-0'`） |
| `toPort` | `string` | ✅ | - | 終了ノードの入力ポートID（例: `'input'`） |
| `condition` | `string` | ❌ | `null` | 条件（AskUserQuestionノードからの接続の場合に選択肢ラベル） |

#### TypeScript Definition:

```typescript
interface Connection {
  id: string;
  from: string; // Node ID
  to: string;   // Node ID
  fromPort: string; // Handle ID
  toPort: string;   // Handle ID
  condition?: string; // Option label for AskUserQuestion branches
}
```

#### Validation Rules:

- `from`, `to`: ワークフロー内に存在するノードIDであること
- `fromPort`, `toPort`: ノードが持つポートIDであること
- `condition`: AskUserQuestionノードからの接続の場合のみ設定、選択肢ラベルと一致すること
- 循環参照: MVP版では検出しない（Edge Cases参照）

---

## 2. React Flow Integration Types

React Flow ライブラリとの統合のため、以下の型定義を使用します。

```typescript
import { Node as RFNode, Edge as RFEdge } from 'reactflow';

// React Flow Node 型のカスタマイズ
type WorkflowNode =
  | RFNode<AgentSkillData, 'agentSkill'>
  | RFNode<AskUserQuestionData, 'askUserQuestion'>;

// React Flow Edge 型のカスタマイズ
type WorkflowEdge = RFEdge<{ label?: string }>;

// React Flow State（Zustandストアで管理）
interface ReactFlowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}
```

---

## 3. File Storage Format

### 3.1 Workflow Definition File (`.vscode/workflows/{name}.json`)

ワークフロー定義はJSON形式で保存されます。

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "sample-workflow",
  "description": "サンプルワークフロー",
  "version": "1.0.0",
  "nodes": [
    {
      "id": "node-1",
      "type": "agentSkill",
      "name": "data-analysis",
      "position": { "x": 100, "y": 100 },
      "data": {
        "prompt": "データ分析を実行してください",
        "outputPorts": 1
      }
    },
    {
      "id": "node-2",
      "type": "askUserQuestion",
      "name": "next-step-selection",
      "position": { "x": 300, "y": 100 },
      "data": {
        "questionText": "次のステップを選択してください",
        "options": [
          { "label": "レポート作成", "description": "分析結果をレポート化" },
          { "label": "データ可視化", "description": "グラフやチャートを作成" }
        ],
        "outputPorts": 2
      }
    },
    {
      "id": "node-3",
      "type": "agentSkill",
      "name": "report-generation",
      "position": { "x": 500, "y": 50 },
      "data": {
        "prompt": "レポートを生成してください",
        "outputPorts": 1
      }
    },
    {
      "id": "node-4",
      "type": "agentSkill",
      "name": "data-visualization",
      "position": { "x": 500, "y": 150 },
      "data": {
        "prompt": "データを可視化してください",
        "outputPorts": 1
      }
    }
  ],
  "connections": [
    {
      "id": "edge-1",
      "from": "node-1",
      "to": "node-2",
      "fromPort": "output",
      "toPort": "input"
    },
    {
      "id": "edge-2",
      "from": "node-2",
      "to": "node-3",
      "fromPort": "branch-0",
      "toPort": "input",
      "condition": "レポート作成"
    },
    {
      "id": "edge-3",
      "from": "node-2",
      "to": "node-4",
      "fromPort": "branch-1",
      "toPort": "input",
      "condition": "データ可視化"
    }
  ],
  "createdAt": "2025-11-01T00:00:00.000Z",
  "updatedAt": "2025-11-01T12:00:00.000Z"
}
```

---

### 3.2 Claude Config Export Format

#### SKILL.md (`.claude/skills/{node-name}.md`)

```markdown
---
name: data-analysis
description: data-analysis
allowed-tools: []
---

データ分析を実行してください
```

#### SlashCommand (`.claude/commands/{workflow-name}.md`)

```markdown
---
description: サンプルワークフロー
allowed-tools: Skill,AskUserQuestion
---

まず、Skillツールを使用して「data-analysis」スキルを実行してください。

次に、AskUserQuestionツールを使用して以下の質問をユーザーに行ってください:
- 質問: "次のステップを選択してください"
- 選択肢:
  - "レポート作成" → Skillツールで「report-generation」スキルを実行
  - "データ可視化" → Skillツールで「data-visualization」スキルを実行

ユーザーの選択に応じて、対応するスキルを実行してください。
```

---

## 4. State Transitions

### 4.1 Workflow Lifecycle

```
┌──────────┐
│  Draft   │ 初期作成状態
└────┬─────┘
     │ save()
     ▼
┌──────────┐
│  Saved   │ ファイルに保存済み
└────┬─────┘
     │ export()
     ▼
┌──────────┐
│ Exported │ .claude形式にエクスポート済み
└──────────┘
     │ modify()
     ▼
┌──────────┐
│ Modified │ エクスポート後に変更あり
└────┬─────┘
     │ export()
     ▼
┌──────────┐
│ Exported │ 再エクスポート
└──────────┘
```

### 4.2 Node Editing States

```
┌──────────┐
│ Unselected │ 選択されていない状態
└────┬───────┘
     │ click()
     ▼
┌──────────┐
│ Selected │ 選択中（プロパティパネル表示）
└────┬─────┘
     │ edit()
     ▼
┌──────────┐
│ Editing  │ 編集中（入力フィールドフォーカス）
└────┬─────┘
     │ blur()
     ▼
┌──────────┐
│ Modified │ 変更あり（未保存）
└────┬─────┘
     │ save()
     ▼
┌──────────┐
│ Saved    │ 保存済み
└──────────┘
```

---

## 5. Validation Summary

### Workflow Level:
- ✅ ワークフロー名: 1-100文字、ファイル名として有効
- ✅ バージョン: セマンティックバージョニング形式
- ✅ ノード数: 最大50ノード
- ⚠️ 循環参照: MVP版では検出しない（警告のみ）

### Node Level:
- ✅ ノード名: 1-50文字、英数字とハイフン・アンダースコア
- ✅ AgentSkill プロンプト: 1-10000文字、空白のみ不可
- ✅ AskUserQuestion 質問文: 1-500文字
- ✅ AskUserQuestion 選択肢: 2-4個、各ラベル1-50文字、説明1-200文字

### Connection Level:
- ✅ 開始/終了ノード: ワークフロー内に存在すること
- ✅ ポートID: ノードが持つポートと一致すること
- ✅ 条件: AskUserQuestionノードからの接続の場合、選択肢ラベルと一致すること

---

## 6. Extension Points (Future)

MVP版では実装しませんが、将来の拡張を考慮した設計上のポイント:

- **新しいノードタイプ追加**: `NodeType` enum に追加、対応する `NodeData` インターフェース定義
- **ノード固有の設定**: `data` オブジェクトに任意のフィールド追加可能
- **ワークフローメタデータ**: `metadata` オブジェクトに任意のカスタムフィールド追加可能
- **バリデーションルールの拡張**: 各エンティティの validation メソッドを追加実装
- **状態管理の拡張**: Zustand store に新しいアクションを追加

---

## 7. References

- Feature Spec: `/specs/001-cc-wf-studio/spec.md`
- Implementation Plan: `/specs/001-cc-wf-studio/plan.md`
- Research Report: `/specs/001-cc-wf-studio/research.md`
- React Flow Types: https://reactflow.dev/api-reference/types
- Zustand Documentation: https://docs.pmnd.rs/zustand
