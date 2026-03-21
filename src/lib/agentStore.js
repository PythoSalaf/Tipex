export const getAgents = () =>
  JSON.parse(localStorage.getItem("tipex_agents") || "[]");

export const saveAgents = (agents) =>
  localStorage.setItem("tipex_agents", JSON.stringify(agents));

export const getLogs = () =>
  JSON.parse(localStorage.getItem("tipex_logs") || "[]");

export const addLog = (log) => {
  const logs = getLogs();
  logs.unshift({ ...log, id: Date.now(), date: new Date().toLocaleDateString() });
  localStorage.setItem("tipex_logs", JSON.stringify(logs.slice(0, 100)));
};
