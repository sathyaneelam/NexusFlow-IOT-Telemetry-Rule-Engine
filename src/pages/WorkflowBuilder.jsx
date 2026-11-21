
import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  addEdge,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import "../WorkflowBuilder.css";

function SensorNode({ data }) {
  return (
    <div className="builder-node sensor-node">
      <Handle type="target" position={Position.Left} />

      <div className="builder-node-heading">
        <span className="node-icon sensor-icon">S</span>
        <span>Sensor</span>
        <span className="node-status">●</span>
      </div>

      <p>{data.label}</p>
      <small>{data.device}</small>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function ConditionNode({ data }) {
  return (
    <div className="builder-node condition-node">
      <Handle type="target" position={Position.Left} />

      <div className="builder-node-heading">
        <span className="node-icon condition-icon">?</span>
        <span>Condition</span>
      </div>

      <p>{data.label}</p>
      <small>{data.rule}</small>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = {
  sensor: SensorNode,
  condition: ConditionNode,
};

const initialNodes = [
  {
    id: "sensor-1",
    type: "sensor",
    position: { x: 100, y: 150 },
    data: {
      label: "Temperature Sensor",
      device: "TEMP-001",
    },
  },
  {
    id: "condition-1",
    type: "condition",
    position: { x: 420, y: 150 },
    data: {
      label: "Temperature > 30°C",
      rule: "Greater than 30",
    },
  },
];

const initialEdges = [
  {
    id: "sensor-condition",
    source: "sensor-1",
    target: "condition-1",
    animated: true,
  },
];

function WorkflowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(
  JSON.parse(localStorage.getItem("nexusflow-workflow-nodes") || "null") || initialNodes
);

const [edges, setEdges, onEdgesChange] = useEdgesState(
  JSON.parse(localStorage.getItem("nexusflow-workflow-edges") || "null") || initialEdges
);
useEffect(() => {
  localStorage.setItem("nexusflow-workflow-nodes", JSON.stringify(nodes));
}, [nodes]);

useEffect(() => {
  localStorage.setItem("nexusflow-workflow-edges", JSON.stringify(edges));
}, [edges]);
  const [workflowName, setWorkflowName] = useState("New Automation");

  const onConnect = useCallback(
    (connection) => {
      setEdges((currentEdges) =>
        addEdge(
          { ...connection, animated: true },
          currentEdges
        )
      );
    },
    [setEdges]
  );

  const addNode = (type) => {
    const id = `${type}-${Date.now()}`;

    const newNode = {
      id,
      type,
      position: {
        x: 180 + Math.random() * 180,
        y: 100 + Math.random() * 180,
      },
      data:
        type === "sensor"
          ? {
              label: "New Sensor",
              device: "Select a device",
            }
          : {
              label: "New Condition",
              rule: "Configure condition",
            },
    };

    setNodes((currentNodes) => [...currentNodes, newNode]);
  };

  return (
    <div className="page-content builder-page">
      <div className="builder-topbar">
        <div>
          <div className="builder-breadcrumb">
            Workflows / <span>Builder</span>
          </div>

          <input
            className="workflow-name-input"
            value={workflowName}
            onChange={(event) => setWorkflowName(event.target.value)}
            aria-label="Workflow name"
          />

          <p className="builder-subtitle">
            Design your automation by connecting nodes
          </p>
        </div>

        <div className="builder-actions">
          <span className="draft-status">● Draft</span>
          <button className="builder-save-button" disabled>
            Save workflow
          </button>
        </div>
      </div>

      <div className="builder-workspace">
        <aside className="node-sidebar">
          <div className="node-sidebar-heading">
            <h3>Node Library</h3>
            <p>Build your automation</p>
          </div>

          <div className="node-category">
            <span>INPUTS</span>
            <button
              className="node-library-item"
              onClick={() => addNode("sensor")}
            >
              <span className="node-icon sensor-icon">S</span>
              <span>
                <strong>Sensor</strong>
                <small>Receive device data</small>
              </span>
              <b>+</b>
            </button>
          </div>

          <div className="node-category">
            <span>LOGIC</span>
            <button
              className="node-library-item"
              onClick={() => addNode("condition")}
            >
              <span className="node-icon condition-icon">?</span>
              <span>
                <strong>Condition</strong>
                <small>Evaluate a rule</small>
              </span>
              <b>+</b>
            </button>
          </div>

          <div className="node-sidebar-note">
            <strong>How to connect</strong>
            <p>
              Drag from the small circle on one node to another node's circle.
            </p>
          </div>
        </aside>

        <div className="builder-canvas">
          <div className="canvas-label">
            <span>WORKFLOW CANVAS</span>
            <span>{nodes.length} nodes · {edges.length} connections</span>
          </div>

          <ReactFlow
          colorMode="light"
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            fitViewOptions={{ padding: 0.25 }}
          >
            <Background color="#d9ded8" gap={22} size={1} />
            <Controls />
            <MiniMap
              nodeColor={(node) =>
                node.type === "sensor" ? "#648b78" : "#d5a45c"
              }
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

export default WorkflowBuilder;
