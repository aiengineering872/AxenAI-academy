"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, ChevronLeft, ChevronRight, FileText, Briefcase, Lightbulb } from "lucide-react";

// Type Definitions
type DataType = "int" | "float" | "object";
type FilterOperator = ">" | "<" | ">=" | "<=" | "==" | "contains";
type AggFunction = "mean" | "sum" | "count";
type MissingOp = "none" | "fillna" | "dropna";
type ColumnOp = "add" | "rename" | "drop";

interface DataRow {
  [key: string]: any;
}

interface DataFrameState {
  columns: string[];
  rows: DataRow[];
  dtypes: Record<string, DataType>;
}

interface OperationStep {
  title: string;
  code: string;
  description: string;
  reason: string;
  before: DataFrameState;
  after: DataFrameState;
  highlightRows: number[];
  highlightColumns: string[];
}

// Helper Functions
const cloneDataFrame = (df: DataFrameState): DataFrameState => {
  return {
    columns: [...df.columns],
    rows: df.rows.map((row) => ({ ...row })),
    dtypes: { ...df.dtypes },
  };
};

const inferDtype = (value: any): DataType => {
  if (value === null || value === undefined) return "object";
  if (typeof value === "number") {
    return Number.isInteger(value) ? "int" : "float";
  }
  return "object";
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return "NaN";
  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  }
  return String(value);
};

// Dataset Definitions
const datasets: Record<string, DataFrameState> = {
  employees: {
    columns: ["index", "id", "name", "department", "salary", "age", "city"],
    rows: [
      { index: 0, id: 1, name: "Alice", department: "IT", salary: 95000, age: 29, city: "NYC" },
      { index: 1, id: 2, name: "Bob", department: "Sales", salary: 72000, age: 34, city: "SF" },
      { index: 2, id: 3, name: "Carlos", department: "HR", salary: 65000, age: 42, city: "Chicago" },
      { index: 3, id: 4, name: "Diana", department: "IT", salary: 99000, age: 31, city: "NYC" },
      { index: 4, id: 5, name: "Eve", department: "Sales", salary: 78000, age: 27, city: "Austin" },
      { index: 5, id: 6, name: "Frank", department: "IT", salary: null, age: 36, city: "Seattle" },
    ],
    dtypes: {
      index: "int",
      id: "int",
      name: "object",
      department: "object",
      salary: "float",
      age: "int",
      city: "object",
    },
  },
  sales: {
    columns: ["index", "id", "product", "category", "quantity", "price", "revenue"],
    rows: [
      { index: 0, id: 1, product: "Laptop", category: "Electronics", quantity: 15, price: 999, revenue: 14985 },
      { index: 1, id: 2, product: "Phone", category: "Electronics", quantity: 30, price: 699, revenue: 20970 },
      { index: 2, id: 3, product: "Tablet", category: "Electronics", quantity: 20, price: 499, revenue: 9980 },
      { index: 3, id: 4, product: "Monitor", category: "Electronics", quantity: 12, price: 299, revenue: 3588 },
      { index: 4, id: 5, product: "Keyboard", category: "Accessories", quantity: 50, price: 79, revenue: 3950 },
      { index: 5, id: 6, product: "Mouse", category: "Accessories", quantity: 45, price: 49, revenue: 2205 },
    ],
    dtypes: {
      index: "int",
      id: "int",
      product: "object",
      category: "object",
      quantity: "int",
      price: "int",
      revenue: "int",
    },
  },
  students: {
    columns: ["index", "id", "name", "grade", "score", "age", "subject"],
    rows: [
      { index: 0, id: 1, name: "John", grade: "A", score: 95, age: 20, subject: "Math" },
      { index: 1, id: 2, name: "Sarah", grade: "B", score: 85, age: 19, subject: "Science" },
      { index: 2, id: 3, name: "Mike", grade: "A", score: 92, age: 21, subject: "Math" },
      { index: 3, id: 4, name: "Emma", grade: "C", score: 75, age: 20, subject: "English" },
      { index: 4, id: 5, name: "David", grade: "B", score: 88, age: 22, subject: "Science" },
      { index: 5, id: 6, name: "Lisa", grade: "A", score: 96, age: 19, subject: "Math" },
    ],
    dtypes: {
      index: "int",
      id: "int",
      name: "object",
      grade: "object",
      score: "int",
      age: "int",
      subject: "object",
    },
  },
};

const PandasDataFrameSimulator: React.FC = () => {
  // Configuration State
  const [selectedDataset, setSelectedDataset] = useState<string>("employees");
  const [filterConfig, setFilterConfig] = useState<{
    column: string;
    operator: FilterOperator;
    value: string;
  }>({ column: "", operator: ">", value: "" });
  const [groupByConfig, setGroupByConfig] = useState<{
    groupColumn: string;
    aggColumn: string;
    function: AggFunction;
  }>({ groupColumn: "", aggColumn: "", function: "mean" });
  const [missingConfig, setMissingConfig] = useState<{
    operation: MissingOp;
    fillValue: string;
  }>({ operation: "none", fillValue: "0" });
  const [columnOpConfig, setColumnOpConfig] = useState<{
    operation: ColumnOp;
    sourceColumn: string;
    newColumnName: string;
    multiplier: string;
    oldColumnName: string;
  }>({
    operation: "add",
    sourceColumn: "",
    newColumnName: "",
    multiplier: "0.1",
    oldColumnName: "",
  });

  // Execution State
  const [steps, setSteps] = useState<OperationStep[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [isAuto, setIsAuto] = useState<boolean>(false);
  const [latestFrame, setLatestFrame] = useState<DataFrameState | null>(null);

  // Get current dataset
  const currentDataset = datasets[selectedDataset];

  // Build all operation steps
  const buildSteps = (): OperationStep[] => {
    const builtSteps: OperationStep[] = [];
    let workingDF = cloneDataFrame(currentDataset);

    // Step 1: Load DataFrame
    builtSteps.push({
      title: "Load DataFrame",
      code: `df = pd.DataFrame(${selectedDataset}_data)`,
      description: `Loaded ${selectedDataset} dataset with ${workingDF.rows.length} rows and ${workingDF.columns.length} columns.`,
      reason: "The first step in any data analysis workflow is loading your data into a DataFrame structure.",
      before: cloneDataFrame({ columns: [], rows: [], dtypes: {} }),
      after: cloneDataFrame(workingDF),
      highlightRows: [],
      highlightColumns: [],
    });

    // Step 2: Filter (if configured)
    if (filterConfig.column && filterConfig.value) {
      const beforeDF = cloneDataFrame(workingDF);
      const filteredRows: number[] = [];
      const newRows: DataRow[] = [];

      workingDF.rows.forEach((row, idx) => {
        const colValue = row[filterConfig.column];
        let matches = false;

        if (colValue === null || colValue === undefined) {
          matches = false;
        } else if (filterConfig.operator === "contains") {
          matches = String(colValue).toLowerCase().includes(filterConfig.value.toLowerCase());
        } else {
          const numValue = Number(filterConfig.value);
          const numColValue = Number(colValue);
          if (!isNaN(numValue) && !isNaN(numColValue)) {
            switch (filterConfig.operator) {
              case ">":
                matches = numColValue > numValue;
                break;
              case "<":
                matches = numColValue < numValue;
                break;
              case ">=":
                matches = numColValue >= numValue;
                break;
              case "<=":
                matches = numColValue <= numValue;
                break;
              case "==":
                matches = numColValue === numValue;
                break;
            }
          }
        }

        if (matches) {
          filteredRows.push(idx);
          newRows.push({ ...row });
        }
      });

      workingDF.rows = newRows;
      workingDF.rows.forEach((row, idx) => {
        row.index = idx;
      });

      builtSteps.push({
        title: "Filter Rows",
        code: `df[df["${filterConfig.column}"] ${filterConfig.operator} ${filterConfig.operator === "contains" ? `"${filterConfig.value}"` : filterConfig.value}]`,
        description: `Filtered DataFrame to show ${workingDF.rows.length} rows where ${filterConfig.column} ${filterConfig.operator} ${filterConfig.value}.`,
        reason: "Filtering is essential for data analysis, allowing you to focus on specific subsets of data based on business criteria.",
        before: beforeDF,
        after: cloneDataFrame(workingDF),
        highlightRows: filteredRows,
        highlightColumns: [filterConfig.column],
      });
    }

    // Step 3: GroupBy (if configured)
    if (groupByConfig.groupColumn && groupByConfig.aggColumn) {
      const beforeDF = cloneDataFrame(workingDF);
      const groups: Record<string, DataRow[]> = {};

      workingDF.rows.forEach((row) => {
        const key = String(row[groupByConfig.groupColumn]);
        if (!groups[key]) groups[key] = [];
        groups[key].push(row);
      });

      const newRows: DataRow[] = [];
      Object.entries(groups).forEach(([key, groupRows], idx) => {
        const values = groupRows
          .map((r) => r[groupByConfig.aggColumn])
          .filter((v) => v !== null && v !== undefined)
          .map(Number)
          .filter((v) => !isNaN(v));

        let aggValue = 0;
        if (values.length > 0) {
          switch (groupByConfig.function) {
            case "mean":
              aggValue = values.reduce((a, b) => a + b, 0) / values.length;
              break;
            case "sum":
              aggValue = values.reduce((a, b) => a + b, 0);
              break;
            case "count":
              aggValue = values.length;
              break;
          }
        }

        newRows.push({
          index: idx,
          [groupByConfig.groupColumn]: key,
          [groupByConfig.aggColumn]: aggValue,
        });
      });

      const newColumns = [groupByConfig.groupColumn, groupByConfig.aggColumn];
      workingDF = {
        columns: newColumns,
        rows: newRows,
        dtypes: {
          [groupByConfig.groupColumn]: "object",
          [groupByConfig.aggColumn]: "float",
        },
      };

      builtSteps.push({
        title: "Group By & Aggregate",
        code: `df.groupby("${groupByConfig.groupColumn}")["${groupByConfig.aggColumn}"].${groupByConfig.function}()`,
        description: `Grouped data by ${groupByConfig.groupColumn} and calculated ${groupByConfig.function} of ${groupByConfig.aggColumn} for each group.`,
        reason: "GroupBy operations are fundamental for business intelligence, enabling analysis of metrics by categories like department, region, or product type.",
        before: beforeDF,
        after: cloneDataFrame(workingDF),
        highlightRows: [],
        highlightColumns: [groupByConfig.groupColumn, groupByConfig.aggColumn],
      });
    }

    // Step 4: Missing Values (if configured)
    if (missingConfig.operation !== "none") {
      const beforeDF = cloneDataFrame(workingDF);

      if (missingConfig.operation === "fillna") {
        const fillNum = Number(missingConfig.fillValue);
        workingDF.rows = workingDF.rows.map((row) => {
          const newRow = { ...row };
          workingDF.columns.forEach((col) => {
            if (newRow[col] === null || newRow[col] === undefined) {
              newRow[col] = isNaN(fillNum) ? missingConfig.fillValue : fillNum;
            }
          });
          return newRow;
        });

        builtSteps.push({
          title: "Fill Missing Values",
          code: `df.fillna(${isNaN(fillNum) ? `"${missingConfig.fillValue}"` : missingConfig.fillValue})`,
          description: `Replaced all missing (NaN) values with ${missingConfig.fillValue}.`,
          reason: "Handling missing data is crucial for maintaining data quality and ensuring accurate analysis in production systems.",
          before: beforeDF,
          after: cloneDataFrame(workingDF),
          highlightRows: [],
          highlightColumns: [],
        });
      } else if (missingConfig.operation === "dropna") {
        workingDF.rows = workingDF.rows.filter((row) => {
          return workingDF.columns.every((col) => row[col] !== null && row[col] !== undefined);
        });
        workingDF.rows.forEach((row, idx) => {
          row.index = idx;
        });

        builtSteps.push({
          title: "Drop Missing Values",
          code: `df.dropna()`,
          description: `Removed ${beforeDF.rows.length - workingDF.rows.length} rows containing missing values.`,
          reason: "Removing incomplete records helps maintain data integrity, especially when missing data would skew analytical results.",
          before: beforeDF,
          after: cloneDataFrame(workingDF),
          highlightRows: [],
          highlightColumns: [],
        });
      }
    }

    // Step 5: Column Operations (if configured)
    if (columnOpConfig.operation === "add" && columnOpConfig.sourceColumn && columnOpConfig.newColumnName) {
      const beforeDF = cloneDataFrame(workingDF);
      const multiplier = Number(columnOpConfig.multiplier) || 0.1;

      workingDF.rows = workingDF.rows.map((row) => {
        const sourceValue = row[columnOpConfig.sourceColumn] || 0;
        const newValue = Number(sourceValue) * multiplier;
        return { ...row, [columnOpConfig.newColumnName]: newValue };
      });

      if (!workingDF.columns.includes(columnOpConfig.newColumnName)) {
        workingDF.columns.push(columnOpConfig.newColumnName);
        workingDF.dtypes[columnOpConfig.newColumnName] = "float";
      }

      builtSteps.push({
        title: "Add Column",
        code: `df["${columnOpConfig.newColumnName}"] = df["${columnOpConfig.sourceColumn}"] * ${multiplier}`,
        description: `Created new column "${columnOpConfig.newColumnName}" by multiplying ${columnOpConfig.sourceColumn} by ${multiplier}.`,
        reason: "Feature engineering and business metrics often require derived columns to support data-driven decision making.",
        before: beforeDF,
        after: cloneDataFrame(workingDF),
        highlightRows: [],
        highlightColumns: [columnOpConfig.newColumnName],
      });
    } else if (columnOpConfig.operation === "rename" && columnOpConfig.oldColumnName && columnOpConfig.newColumnName) {
      const beforeDF = cloneDataFrame(workingDF);

      workingDF.columns = workingDF.columns.map((col) =>
        col === columnOpConfig.oldColumnName ? columnOpConfig.newColumnName : col
      );
      workingDF.rows = workingDF.rows.map((row) => {
        const newRow: DataRow = {};
        Object.keys(row).forEach((key) => {
          newRow[key === columnOpConfig.oldColumnName ? columnOpConfig.newColumnName : key] = row[key];
        });
        return newRow;
      });
      workingDF.dtypes[columnOpConfig.newColumnName] = workingDF.dtypes[columnOpConfig.oldColumnName];
      delete workingDF.dtypes[columnOpConfig.oldColumnName];

      builtSteps.push({
        title: "Rename Column",
        code: `df.rename(columns={"${columnOpConfig.oldColumnName}": "${columnOpConfig.newColumnName}"})`,
        description: `Renamed column "${columnOpConfig.oldColumnName}" to "${columnOpConfig.newColumnName}".`,
        reason: "Standardizing column names improves code readability and ensures consistency across data pipelines.",
        before: beforeDF,
        after: cloneDataFrame(workingDF),
        highlightRows: [],
        highlightColumns: [columnOpConfig.newColumnName],
      });
    } else if (columnOpConfig.operation === "drop" && columnOpConfig.oldColumnName) {
      const beforeDF = cloneDataFrame(workingDF);

      workingDF.columns = workingDF.columns.filter((col) => col !== columnOpConfig.oldColumnName);
      workingDF.rows = workingDF.rows.map((row) => {
        const newRow = { ...row };
        delete newRow[columnOpConfig.oldColumnName];
        return newRow;
      });
      delete workingDF.dtypes[columnOpConfig.oldColumnName];

      builtSteps.push({
        title: "Drop Column",
        code: `df.drop(columns=["${columnOpConfig.oldColumnName}"])`,
        description: `Removed column "${columnOpConfig.oldColumnName}" from the DataFrame.`,
        reason: "Removing unnecessary columns reduces memory usage and improves processing speed in large-scale data operations.",
        before: beforeDF,
        after: cloneDataFrame(workingDF),
        highlightRows: [],
        highlightColumns: [],
      });
    }

    return builtSteps;
  };

  // Handlers
  const handleRunSimulation = () => {
    const newSteps = buildSteps();
    setSteps(newSteps);
    setCurrentStep(0);
    setIsAuto(false);
    if (newSteps.length > 0) {
      setLatestFrame(newSteps[0].after);
    }
  };

  const handleNext = () => {
    if (steps.length > 0 && currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setIsAuto(false); // Stop auto-advance when manually navigating
      if (steps[nextStep]) {
        setLatestFrame(steps[nextStep].after);
      }
    }
  };

  const handlePrev = () => {
    if (steps.length > 0 && currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setIsAuto(false); // Stop auto-advance when manually navigating
      if (steps[prevStep]) {
        setLatestFrame(steps[prevStep].after);
      }
    }
  };

  const handleRunAll = () => {
    if (steps.length === 0) {
      const newSteps = buildSteps();
      setSteps(newSteps);
      if (newSteps.length > 0) {
        setIsAuto(true);
        setCurrentStep(0);
        setLatestFrame(newSteps[0].after);
      }
      return;
    }
    setIsAuto(true);
    setCurrentStep(0);
    setLatestFrame(steps[0].after);
  };

  const handleReset = () => {
    setSteps([]);
    setCurrentStep(-1);
    setIsAuto(false);
    setLatestFrame(null);
  };

  // Auto-advance effect
  useEffect(() => {
    if (isAuto && currentStep >= 0 && currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        if (steps[nextStep]) {
          setLatestFrame(steps[nextStep].after);
        }
      }, 1800);
      return () => clearTimeout(timer);
    } else if (isAuto && currentStep === steps.length - 1) {
      setIsAuto(false);
    }
  }, [isAuto, currentStep, steps]);

  // Update latestFrame when dataset changes
  useEffect(() => {
    if (steps.length === 0) {
      setLatestFrame(null);
    }
  }, [selectedDataset, steps.length]);

  // Display logic: show current step's after state, or original dataset if no steps
  const displayFrame = latestFrame || currentDataset;
  const currentStepData = currentStep >= 0 && currentStep < steps.length ? steps[currentStep] : null;
  const progress = steps.length > 0 && currentStep >= 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Pandas DataFrame Simulator</h1>
            <p className="text-gray-400">
              Visualize how Pandas creates, filters, groups, and transforms DataFrames — front-end only.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRunSimulation}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition"
            >
              <Play className="w-4 h-4" />
              Run Simulation
            </button>
            <button
              onClick={handleRunAll}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition"
            >
              <Play className="w-4 h-4" />
              Run All
            </button>
            <button
              onClick={handlePrev}
              disabled={currentStep <= 0 || steps.length === 0}
              className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
            <button
              onClick={handleNext}
              disabled={currentStep >= steps.length - 1 || steps.length === 0}
              className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Left Panel - Controls */}
          <div className="col-span-12 lg:col-span-3 bg-slate-900 rounded-xl p-4 border border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-red-500" />
              Controls
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Configure Pandas-like operations and run step-by-step.
            </p>

            <div className="space-y-4">
              {/* Dataset Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Dataset</label>
                <select
                  value={selectedDataset}
                  onChange={(e) => {
                    setSelectedDataset(e.target.value);
                    handleReset();
                  }}
                  className="w-full bg-slate-800 text-white rounded-lg p-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="employees">Employees</option>
                  <option value="sales">Sales</option>
                  <option value="students">Students</option>
                </select>
              </div>

              {/* Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Filter <span className="text-xs text-gray-500">df[df[col] op value]</span>
                </label>
                <div className="space-y-2">
                  <select
                    value={filterConfig.column}
                    onChange={(e) =>
                      setFilterConfig({ ...filterConfig, column: e.target.value })
                    }
                    className="w-full bg-slate-800 text-white rounded-lg p-2 border border-slate-600"
                  >
                    <option value="">column...</option>
                    {currentDataset.columns
                      .filter((col) => col !== "index")
                      .map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                  </select>
                  <select
                    value={filterConfig.operator}
                    onChange={(e) =>
                      setFilterConfig({
                        ...filterConfig,
                        operator: e.target.value as FilterOperator,
                      })
                    }
                    className="w-full bg-slate-800 text-white rounded-lg p-2 border border-slate-600"
                  >
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                    <option value=">=">&gt;=</option>
                    <option value="<=">&lt;=</option>
                    <option value="==">==</option>
                    <option value="contains">contains</option>
                  </select>
                  <input
                    type="text"
                    value={filterConfig.value}
                    onChange={(e) =>
                      setFilterConfig({ ...filterConfig, value: e.target.value })
                    }
                    placeholder="value"
                    className="w-full bg-slate-800 text-white rounded-lg p-2 border border-slate-600"
                  />
                </div>
              </div>

              {/* GroupBy */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  GroupBy <span className="text-xs text-gray-500">df.groupby(col)[col].agg()</span>
                </label>
                <div className="space-y-2">
                  <select
                    value={groupByConfig.groupColumn}
                    onChange={(e) =>
                      setGroupByConfig({ ...groupByConfig, groupColumn: e.target.value })
                    }
                    className="w-full bg-slate-800 text-white rounded-lg p-2 border border-slate-600"
                  >
                    <option value="">group...</option>
                    {currentDataset.columns
                      .filter((col) => col !== "index")
                      .map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                  </select>
                  <select
                    value={groupByConfig.aggColumn}
                    onChange={(e) =>
                      setGroupByConfig({ ...groupByConfig, aggColumn: e.target.value })
                    }
                    className="w-full bg-slate-800 text-white rounded-lg p-2 border border-slate-600"
                  >
                    <option value="">agg...</option>
                    {currentDataset.columns
                      .filter((col) => col !== "index")
                      .map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                  </select>
                  <select
                    value={groupByConfig.function}
                    onChange={(e) =>
                      setGroupByConfig({
                        ...groupByConfig,
                        function: e.target.value as AggFunction,
                      })
                    }
                    className="w-full bg-slate-800 text-white rounded-lg p-2 border border-slate-600"
                  >
                    <option value="mean">mean</option>
                    <option value="sum">sum</option>
                    <option value="count">count</option>
                  </select>
                </div>
              </div>

              {/* Missing Values */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Missing Values <span className="text-xs text-gray-500">df.isnull() / fillna / dropna</span>
                </label>
                <div className="space-y-2">
                  <select
                    value={missingConfig.operation}
                    onChange={(e) =>
                      setMissingConfig({
                        ...missingConfig,
                        operation: e.target.value as MissingOp,
                      })
                    }
                    className="w-full bg-slate-800 text-white rounded-lg p-2 border border-slate-600"
                  >
                    <option value="none">none</option>
                    <option value="fillna">fillna</option>
                    <option value="dropna">dropna</option>
                  </select>
                  {missingConfig.operation === "fillna" && (
                    <input
                      type="text"
                      value={missingConfig.fillValue}
                      onChange={(e) =>
                        setMissingConfig({ ...missingConfig, fillValue: e.target.value })
                      }
                      placeholder="fill value"
                      className="w-full bg-slate-800 text-white rounded-lg p-2 border border-slate-600"
                    />
                  )}
                </div>
              </div>

              {/* Column Operations */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Column Ops <span className="text-xs text-gray-500">add / rename / drop</span>
                </label>
                <select
                  value={columnOpConfig.operation}
                  onChange={(e) =>
                    setColumnOpConfig({
                      ...columnOpConfig,
                      operation: e.target.value as ColumnOp,
                    })
                  }
                  className="w-full bg-slate-800 text-white rounded-lg p-2 border border-slate-600 mb-2"
                >
                  <option value="add">add</option>
                  <option value="rename">rename</option>
                  <option value="drop">drop</option>
                </select>
                {columnOpConfig.operation === "add" && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={columnOpConfig.sourceColumn}
                      onChange={(e) =>
                        setColumnOpConfig({ ...columnOpConfig, sourceColumn: e.target.value })
                      }
                      placeholder="source column"
                      className="w-full bg-slate-800 text-white rounded-lg p-2 border border-slate-600"
                    />
                    <input
                      type="text"
                      value={columnOpConfig.newColumnName}
                      onChange={(e) =>
                        setColumnOpConfig({ ...columnOpConfig, newColumnName: e.target.value })
                      }
                      placeholder="new column name"
                      className="w-full bg-slate-800 text-white rounded-lg p-2 border border-slate-600"
                    />
                    <input
                      type="text"
                      value={columnOpConfig.multiplier}
                      onChange={(e) =>
                        setColumnOpConfig({ ...columnOpConfig, multiplier: e.target.value })
                      }
                      placeholder="multiplier (e.g., 0.1)"
                      className="w-full bg-slate-800 text-white rounded-lg p-2 border border-slate-600"
                    />
                  </div>
                )}
                {columnOpConfig.operation === "rename" && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={columnOpConfig.oldColumnName}
                      onChange={(e) =>
                        setColumnOpConfig({ ...columnOpConfig, oldColumnName: e.target.value })
                      }
                      placeholder="old name"
                      className="w-full bg-slate-800 text-white rounded-lg p-2 border border-slate-600"
                    />
                    <input
                      type="text"
                      value={columnOpConfig.newColumnName}
                      onChange={(e) =>
                        setColumnOpConfig({ ...columnOpConfig, newColumnName: e.target.value })
                      }
                      placeholder="new name"
                      className="w-full bg-slate-800 text-white rounded-lg p-2 border border-slate-600"
                    />
                  </div>
                )}
                {columnOpConfig.operation === "drop" && (
                  <input
                    type="text"
                    value={columnOpConfig.oldColumnName}
                    onChange={(e) =>
                      setColumnOpConfig({ ...columnOpConfig, oldColumnName: e.target.value })
                    }
                    placeholder="column name"
                    className="w-full bg-slate-800 text-white rounded-lg p-2 border border-slate-600"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Center Panel - DataFrame */}
          <div className="col-span-12 lg:col-span-6 bg-slate-900 rounded-xl p-4 border border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Current DataFrame
            </h2>
            <div className="mb-2 text-sm text-gray-400">
              rows: {displayFrame.rows.length} • cols: {displayFrame.columns.length}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-600 text-sm">
                <thead>
                  <tr className="bg-slate-800">
                    {displayFrame.columns.map((col) => (
                      <th
                        key={col}
                        className={`border border-slate-600 px-3 py-2 text-left font-semibold text-white ${
                          currentStepData?.highlightColumns.includes(col)
                            ? "bg-blue-900/50"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{col}</span>
                          <span className="text-xs text-gray-400 font-normal">
                            ({displayFrame.dtypes[col] || "object"})
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {displayFrame.rows.map((row, idx) => {
                      const isHighlighted =
                        currentStepData?.highlightRows.includes(
                          currentStepData.before.rows.findIndex(
                            (r) => r.index === row.index
                          )
                        ) || false;
                      return (
                        <motion.tr
                          key={idx}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className={`hover:bg-slate-800/50 ${
                            isHighlighted ? "bg-blue-900/30" : ""
                          }`}
                        >
                          {displayFrame.columns.map((col) => (
                            <td
                              key={col}
                              className="border border-slate-600 px-3 py-2 text-gray-300"
                            >
                              {formatValue(row[col])}
                            </td>
                          ))}
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Panel - Explanation */}
          <div className="col-span-12 lg:col-span-3 bg-slate-900 rounded-xl p-4 border border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Explanation
            </h2>
            <div className="bg-gray-950 rounded-lg p-4 min-h-[400px] text-white">
              {currentStepData ? (
                <div className="space-y-4">
                  {/* Step Indicator */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      Step {currentStep + 1} of {steps.length}
                    </span>
                    <span className="text-sm font-semibold text-blue-400">
                      {currentStepData.title}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <motion.div
                      className="bg-blue-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Pandas Code */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">Pandas code:</h3>
                    <div className="bg-gray-800 rounded-lg p-3 font-mono text-sm overflow-x-auto">
                      <code className="text-green-400">
                        {currentStepData.code.split(/(\["|"\]|"|\(|\)|\[|\]|,|\s+)/).map((part, i) => {
                          if (part.match(/^"[^"]*"$/)) {
                            return <span key={i} className="text-green-300">{part}</span>;
                          } else if (part.match(/^\d+\.?\d*$/)) {
                            return <span key={i} className="text-green-200">{part}</span>;
                          } else if (part.match(/[=<>!+\-*/]/)) {
                            return <span key={i} className="text-white">{part}</span>;
                          } else {
                            return <span key={i} className="text-green-400">{part}</span>;
                          }
                        })}
                      </code>
                    </div>
                  </div>

                  {/* What Happened */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">What happened</h3>
                    <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-3">
                      <p className="text-white text-sm">{currentStepData.description}</p>
                    </div>
                  </div>

                  {/* Industry Context */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">
                      Why this matters in industry
                    </h3>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                      <p className="text-gray-300 text-sm">{currentStepData.reason}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 text-center">
                    Run a simulation to see step-by-step insights.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PandasDataFrameSimulator;

