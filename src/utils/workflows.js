const STORAGE_KEY = "nexusflow-workflows";

export function getWorkflows() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveWorkflow(workflow) {
  const workflows = getWorkflows();
  const now = new Date().toISOString();

  const savedWorkflow = {
    ...workflow,
    id: workflow.id || `workflow-${Date.now()}`,
    createdAt: workflow.createdAt || now,
    updatedAt: now,
  };

  const index = workflows.findIndex(
    (item) => item.id === savedWorkflow.id
  );

  if (index >= 0) {
    workflows[index] = savedWorkflow;
  } else {
    workflows.unshift(savedWorkflow);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));

  return savedWorkflow;
}

export function deleteWorkflow(id) {
  const workflows = getWorkflows().filter(
    (workflow) => workflow.id !== id
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
  return workflows;
}
