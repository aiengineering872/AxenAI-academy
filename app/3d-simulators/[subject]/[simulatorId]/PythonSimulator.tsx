"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, RotateCcw, ChevronLeft, ChevronRight, FileText, Brain, Box, Lightbulb, Briefcase, Code, Memory } from "lucide-react";

// Python Memory & Variable Flow Simulator Component
const MemorySimulator: React.FC = () => {
  const [code, setCode] = useState("");
  const [preset, setPreset] = useState("");
  const [variables, setVariables] = useState<any[]>([]);
  const [memoryObjects, setMemoryObjects] = useState<any[]>([]);
  const [explanation, setExplanation] = useState("No execution yet");
  const [stepIndex, setStepIndex] = useState(0);
  const [executionSteps, setExecutionSteps] = useState<any[]>([]);

  const presets = {
    "variable-assignment": `a = 10
b = a
a = 20`,
    "list-reference": `a = [1, 2, 3]
b = a
a.append(4)`,
    "list-copy": `a = [1, 2, 3]
b = a.copy()
a.append(4)`,
    "dictionary": `d = {'x': 1, 'y': 2}
e = d
d['z'] = 3`,
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setPreset(value);
    if (value && presets[value as keyof typeof presets]) {
      setCode(presets[value as keyof typeof presets]);
    }
  };

  const parseCode = (codeText: string) => {
    const lines = codeText.split("\n").filter((line) => line.trim());
    const steps: any[] = [];
    const vars: Record<string, any> = {};
    const memObjects: Record<string, any> = {};
    let objId = 1;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;

      // Variable assignment: a = 10
      if (trimmed.includes("=") && !trimmed.includes(".append") && !trimmed.includes(".copy()")) {
        const [varName, ...rest] = trimmed.split("=").map((s) => s.trim());
        const expression = rest.join("=").trim();

        let value: any;
        let explanation = "";

        // List literal: a = [1, 2, 3]
        if (expression.startsWith("[") && expression.endsWith("]")) {
          try {
            value = JSON.parse(expression);
            const id = `obj_${objId++}`;
            memObjects[id] = { type: "list", value: [...value] };
            vars[varName] = id;
            explanation = `Created list ${JSON.stringify(value)} in memory (${id}). Variable '${varName}' references it.`;
          } catch {
            explanation = `Error parsing list: ${expression}`;
          }
        }
        // Dictionary literal: d = {'x': 1}
        else if (expression.startsWith("{") && expression.endsWith("}")) {
          try {
            value = JSON.parse(expression.replace(/'/g, '"'));
            const id = `obj_${objId++}`;
            memObjects[id] = { type: "dict", value: { ...value } };
            vars[varName] = id;
            explanation = `Created dictionary ${JSON.stringify(value)} in memory (${id}). Variable '${varName}' references it.`;
          } catch {
            explanation = `Error parsing dictionary: ${expression}`;
          }
        }
        // Variable reference: b = a
        else if (vars[expression] !== undefined) {
          vars[varName] = vars[expression];
          if (typeof vars[expression] === "string" && vars[expression].startsWith("obj_")) {
            explanation = `Variable '${varName}' now references the same object as '${expression}' (${vars[expression]}).`;
          } else {
            explanation = `Variable '${varName}' now has the same value as '${expression}'.`;
          }
        }
        // Primitive value: a = 10
        else {
          try {
            value = eval(expression);
            vars[varName] = value;
            explanation = `Assigned ${value} to variable '${varName}'.`;
          } catch {
            explanation = `Error evaluating: ${expression}`;
          }
        }

        steps.push({
          line: trimmed,
          lineNumber: idx + 1,
          variables: { ...vars },
          memoryObjects: { ...memObjects },
          explanation,
        });
      }
      // List append: a.append(4)
      else if (trimmed.includes(".append(")) {
        const [varName] = trimmed.split(".").map((s) => s.trim());
        const appendValue = trimmed.match(/\.append\((.+)\)/)?.[1];
        if (vars[varName] && typeof vars[varName] === "string" && vars[varName].startsWith("obj_")) {
          const objId = vars[varName];
          if (memObjects[objId] && memObjects[objId].type === "list") {
            try {
              const val = eval(appendValue || "");
              memObjects[objId].value.push(val);
              explanation = `Appended ${val} to list '${varName}' (${objId}). The list is modified in place.`;
            } catch {
              explanation = `Error appending to list: ${appendValue}`;
            }
          }
        }
        steps.push({
          line: trimmed,
          lineNumber: idx + 1,
          variables: { ...vars },
          memoryObjects: JSON.parse(JSON.stringify(memObjects)),
          explanation,
        });
      }
      // List copy: b = a.copy()
      else if (trimmed.includes(".copy()")) {
        const [varName] = trimmed.split("=").map((s) => s.trim());
        const sourceVar = trimmed.split("=")[0].trim();
        const sourceObjId = vars[sourceVar];
        if (sourceObjId && typeof sourceObjId === "string" && sourceObjId.startsWith("obj_")) {
          if (memObjects[sourceObjId] && memObjects[sourceObjId].type === "list") {
            const newId = `obj_${objId++}`;
            memObjects[newId] = {
              type: "list",
              value: [...memObjects[sourceObjId].value],
            };
            vars[varName] = newId;
            explanation = `Created a copy of list '${sourceVar}' (${sourceObjId}) as a new list (${newId}). Variable '${varName}' references the copy.`;
          }
        }
        steps.push({
          line: trimmed,
          lineNumber: idx + 1,
          variables: { ...vars },
          memoryObjects: JSON.parse(JSON.stringify(memObjects)),
          explanation,
        });
      }
      // Dictionary assignment: d['z'] = 3
      else if (trimmed.match(/^[a-zA-Z_][a-zA-Z0-9_]*\['.+'\]\s*=/)) {
        const match = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\[['"](.+)['"]\]\s*=\s*(.+)$/);
        if (match) {
          const [, varName, key, valueExpr] = match;
          const objId = vars[varName];
          if (objId && typeof objId === "string" && objId.startsWith("obj_")) {
            if (memObjects[objId] && memObjects[objId].type === "dict") {
              try {
                const val = eval(valueExpr);
                memObjects[objId].value[key] = val;
                explanation = `Set key '${key}' to ${val} in dictionary '${varName}' (${objId}).`;
              } catch {
                explanation = `Error setting dictionary key: ${valueExpr}`;
              }
            }
          }
        }
        steps.push({
          line: trimmed,
          lineNumber: idx + 1,
          variables: { ...vars },
          memoryObjects: JSON.parse(JSON.stringify(memObjects)),
          explanation,
        });
      }
    });

    return steps;
  };

  const handleExecute = () => {
    const steps = parseCode(code);
    setExecutionSteps(steps);
    setStepIndex(0);
    if (steps.length > 0) {
      setVariables(steps[0].variables);
      setMemoryObjects(steps[0].memoryObjects);
      setExplanation(steps[0].explanation);
    }
  };

  const handleNextStep = () => {
    if (stepIndex < executionSteps.length - 1) {
      const nextIdx = stepIndex + 1;
      setStepIndex(nextIdx);
      setVariables(executionSteps[nextIdx].variables);
      setMemoryObjects(executionSteps[nextIdx].memoryObjects);
      setExplanation(executionSteps[nextIdx].explanation);
    }
  };

  const handlePrevStep = () => {
    if (stepIndex > 0) {
      const prevIdx = stepIndex - 1;
      setStepIndex(prevIdx);
      setVariables(executionSteps[prevIdx].variables);
      setMemoryObjects(executionSteps[prevIdx].memoryObjects);
      setExplanation(executionSteps[prevIdx].explanation);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Python Memory & Variable Flow Simulator</h1>
        <p className="text-gray-600 mb-6">
          Visualize how Python manages variables, references, and memory for objects.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Code Editor */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-600" />
              Python Code
            </h2>
            <textarea
              className="w-full h-64 bg-gray-50 border border-gray-300 rounded-lg p-4 font-mono text-sm text-gray-800 focus:outline-none focus:border-blue-500"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter Python code here..."
              spellCheck="false"
            />
            <div className="mt-4 space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Presets</label>
              <select
                value={preset}
                onChange={handlePresetChange}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-gray-800"
              >
                <option value="">Select a preset...</option>
                <option value="variable-assignment">Variable Assignment</option>
                <option value="list-reference">List Reference</option>
                <option value="list-copy">List Copy</option>
                <option value="dictionary">Dictionary</option>
              </select>
            </div>
            <button
              onClick={handleExecute}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <Play className="w-4 h-4" />
              Execute Code
            </button>
          </div>

          {/* Visualization */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Memory className="w-5 h-5 text-purple-600" />
              Memory State
            </h2>
            <div className="space-y-4">
              {/* Variables (Stack) */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Variables (Stack)</h3>
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 min-h-[100px]">
                  {Object.keys(variables).length > 0 ? (
                    <ul className="space-y-2">
                      {Object.entries(variables).map(([key, value]) => (
                        <li key={key} className="text-sm">
                          <span className="font-mono text-blue-600">{key}</span>:{" "}
                          {typeof value === "string" && value.startsWith("obj_") ? (
                            <span className="font-mono text-purple-600">→ {value}</span>
                          ) : (
                            <span className="font-mono text-gray-800">{JSON.stringify(value)}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-sm">No variables defined</p>
                  )}
                </div>
              </div>

              {/* Memory Objects (Heap) */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Memory Objects (Heap)</h3>
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 min-h-[100px]">
                  {Object.keys(memoryObjects).length > 0 ? (
                    <ul className="space-y-2">
                      {Object.entries(memoryObjects).map(([id, obj]: [string, any]) => (
                        <li key={id} className="text-sm">
                          <span className="font-mono text-purple-600">{id}</span> ({obj.type}):{" "}
                          <span className="font-mono text-gray-800">{JSON.stringify(obj.value)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-sm">No objects in memory</p>
                  )}
                </div>
              </div>
            </div>

            {/* Step Navigation */}
            {executionSteps.length > 0 && (
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={handlePrevStep}
                  disabled={stepIndex === 0}
                  className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>
                <span className="text-sm text-gray-600">
                  Step {stepIndex + 1} of {executionSteps.length}
                </span>
                <button
                  onClick={handleNextStep}
                  disabled={stepIndex >= executionSteps.length - 1}
                  className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Explanation */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Explanation</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 min-h-[100px]">
                <p className="text-gray-700 mb-4">{explanation}</p>
                {executionSteps.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevStep}
                      disabled={stepIndex === 0}
                      className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Prev
                    </button>
                    <span className="text-sm text-gray-600">
                      Step {stepIndex + 1} of {executionSteps.length}
                    </span>
                    <button
                      onClick={handleNextStep}
                      disabled={stepIndex === executionSteps.length - 1}
                      className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import PandasDataFrameSimulator from './PandasDataFrameSimulator';

// Pandas DataFrame Simulator Component
const PandasSimulator: React.FC<{ onSwitchToMemory: () => void }> = ({ onSwitchToMemory }) => {
  return <PandasDataFrameSimulator />;
};

// Memory Simulator Component with back button
const MemorySimulatorWithToggle: React.FC<{ onSwitchToPandas: () => void }> = ({ onSwitchToPandas }) => {
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={onSwitchToPandas}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          Pandas DataFrame Simulator
        </button>
      </div>
      <MemorySimulator />
    </div>
  );
};

// Main Python Simulator Component with Toggle
const PythonSimulator: React.FC = () => {
  const [activeSimulator, setActiveSimulator] = useState<"pandas" | "memory">("pandas");

  return (
    <>
      {activeSimulator === "pandas" ? (
        <PandasSimulator onSwitchToMemory={() => setActiveSimulator("memory")} />
      ) : (
        <MemorySimulatorWithToggle onSwitchToPandas={() => setActiveSimulator("pandas")} />
      )}
    </>
  );
};

export default PythonSimulator;
