import React, { useState, useEffect, useRef } from 'react';

import { Play, Pause, RotateCcw, Plus, Trash2, Code, AlertCircle, Info } from 'lucide-react';

/* ===================== TYPES ===================== */

type Variable = {
  name: string;
  pointsTo: number;
};

type MemoryValue = string | number | boolean | string[] | number[] | null;

type MemoryObject = {
  id: number;
  type: string;
  value: MemoryValue;
  display: string;
  refs: string[];
  color: string;
};

type HistoryItem = {
  code: string;
  desc: string;
};

type LogType =
  | 'info'
  | 'error'
  | 'success'
  | 'gc'
  | 'reference'
  | 'reuse'
  | 'create';

type Log = {
  message: string;
  type: LogType;
  time: string;
};

type ParsedValue = {
  type: string;
  value: MemoryValue;
  display: string;
};

type ExampleItem = {
  label: string;
  code: string;
};

/* ===================== COMPONENT ===================== */

const PythonMemorySimulator = () => {

  const [customCode, setCustomCode] = useState<string>('');

  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [memory, setMemory] = useState<MemoryObject[]>([]);

  const [variables, setVariables] = useState<Variable[]>([]);

  const [gcQueue, setGcQueue] = useState<number[]>([]);

  const [logs, setLogs] = useState<Log[]>([]);

  const [showHelp, setShowHelp] = useState<boolean>(false);

  const [animating, setAnimating] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const nextMemId = useRef<number>(1);



  const predefinedExamples: ExampleItem[] = [

    { label: 'Basic Assignment', code: 'x = 5' },

    { label: 'Copy Reference', code: 'y = x' },

    { label: 'Reassignment', code: 'x = 10' },

    { label: 'List Creation', code: 'lst = [1, 2, 3]' },

    { label: 'List Reference', code: 'lst2 = lst' },

    { label: 'String Assignment', code: 's = "hello"' },

    { label: 'Delete Variable', code: 'del x' },

    { label: 'Modify List', code: 'lst.append(4)' },

  ];



  const parseValue = (val: string): ParsedValue => {

    const trimmed = val.trim();

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {

      return { type: 'list', value: trimmed, display: trimmed };

    } else if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {

      return { type: 'str', value: trimmed, display: trimmed };

    } else if (!isNaN(Number(trimmed))) {

      return { type: 'int', value: parseInt(trimmed, 10), display: trimmed };

    } else if (trimmed === 'True' || trimmed === 'False') {

      return { type: 'bool', value: trimmed === 'True', display: trimmed };

    }

    return { type: 'unknown', value: trimmed, display: trimmed };

  };



  const getColorForType = (type: string): string => {

    const colors: Record<string, string> = {

      int: '#60a5fa',

      str: '#34d399',

      list: '#f59e0b',

      bool: '#a78bfa',

      unknown: '#94a3b8'

    };

    return colors[type] || colors.unknown;

  };



  const addLog = (message: string, type: LogType = 'info'): void => {

    setLogs((prev: Log[]) => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);

  };



  const executeCode = (code: string): void => {

    if (!code.trim()) return;



    setAnimating(code);

    setTimeout(() => setAnimating(null), 500);



    const parts = code.trim().split('=');

    

    if (code.trim().startsWith('del ')) {

      const varName = code.trim().substring(4).trim();

      const varExists = variables.find((v: Variable) => v.name === varName);

      

      if (!varExists) {

        addLog(`Error: Variable '${varName}' not found`, 'error');

        return;

      }



      const memObj = memory.find((m: MemoryObject) => m.id === varExists.pointsTo);

      

      setVariables((prev: Variable[]) => prev.filter((v: Variable) => v.name !== varName));

      

      setMemory((prev: MemoryObject[]) => prev.map((m: MemoryObject) => {

        if (m.id === varExists.pointsTo) {

          const newRefs = m.refs.filter((r: string) => r !== varName);

          if (newRefs.length === 0) {

            setGcQueue((q: number[]) => [...q, m.id]);

            addLog(`Object ${m.id} (${m.display}) marked for garbage collection`, 'gc');

          }

          return { ...m, refs: newRefs };

        }

        return m;

      }));



      addLog(`Deleted variable '${varName}' - reference removed`, 'success');

      setHistory((prev: HistoryItem[]) => [...prev, { code, desc: `Variable '${varName}' deleted, reference count decreased` }]);

      return;

    }



    if (code.includes('.append(')) {

      const match = code.match(/(\w+)\.append\((.+)\)/);

      if (match) {

        const varName = match[1];

        const appendVal = match[2];

        const variable = variables.find((v: Variable) => v.name === varName);

        

        if (!variable) {

          addLog(`Error: Variable '${varName}' not found`, 'error');

          return;

        }



        const memObj = memory.find((m: MemoryObject) => m.id === variable.pointsTo);

        if (memObj && memObj.type === 'list') {

          const currentList = memObj.display.slice(1, -1);

          const newList = `[${currentList}${currentList ? ', ' : ''}${appendVal.trim()}]`;

          

          setMemory((prev: MemoryObject[]) => prev.map((m: MemoryObject) => 

            m.id === memObj.id ? { ...m, display: newList, value: newList } : m

          ));

          

          addLog(`Appended ${appendVal} to ${varName} - mutable object modified in-place`, 'success');

          setHistory((prev: HistoryItem[]) => [...prev, { 

            code, 

            desc: `List '${varName}' modified in-place. All references see the change.` 

          }]);

        }

        return;

      }

    }



    if (parts.length === 2) {

      const varName = parts[0].trim();

      const value = parts[1].trim();



      const existingVar = variables.find((v: Variable) => v.name === value);

      

      if (existingVar) {

        const oldVar = variables.find((v: Variable) => v.name === varName);

        

        if (oldVar) {

          setMemory((prev: MemoryObject[]) => prev.map((m: MemoryObject) => {

            if (m.id === oldVar.pointsTo) {

              const newRefs = m.refs.filter((r: string) => r !== varName);

              if (newRefs.length === 0) {

                setGcQueue((q: number[]) => [...q, m.id]);

                addLog(`Object ${m.id} marked for garbage collection`, 'gc');

              }

              return { ...m, refs: newRefs };

            }

            return m;

          }));

        }



        setMemory((prev: MemoryObject[]) => prev.map((m: MemoryObject) => 

          m.id === existingVar.pointsTo 

            ? { ...m, refs: [...m.refs, varName] }

            : m

        ));



        setVariables((prev: Variable[]) => {

          const filtered = prev.filter((v: Variable) => v.name !== varName);

          return [...filtered, { name: varName, pointsTo: existingVar.pointsTo }];

        });



        addLog(`Variable '${varName}' now references same object as '${value}' (ID: ${existingVar.pointsTo})`, 'reference');

        setHistory((prev: HistoryItem[]) => [...prev, { 

          code, 

          desc: `'${varName}' and '${value}' now reference the same memory location. No new object created.` 

        }]);

        return;

      }



      const parsedValue = parseValue(value);

      const oldVar = variables.find((v: Variable) => v.name === varName);



      let existingMemory = null;

      if (parsedValue.type === 'int' || parsedValue.type === 'str' || parsedValue.type === 'bool') {

        existingMemory = memory.find((m: MemoryObject) => 

          m.type === parsedValue.type && m.value === parsedValue.value

        );

      }



      if (oldVar) {

        setMemory((prev: MemoryObject[]) => prev.map((m: MemoryObject) => {

          if (m.id === oldVar.pointsTo) {

            const newRefs = m.refs.filter((r: string) => r !== varName);

            if (newRefs.length === 0) {

              setGcQueue((q: number[]) => [...q, m.id]);

              addLog(`Object ${m.id} marked for garbage collection`, 'gc');

            }

            return { ...m, refs: newRefs };

          }

          return m;

        }));

      }



      if (existingMemory) {

        setMemory((prev: MemoryObject[]) => prev.map((m: MemoryObject) => 

          m.id === existingMemory.id 

            ? { ...m, refs: [...m.refs, varName] }

            : m

        ));



        setVariables((prev: Variable[]) => {

          const filtered = prev.filter((v: Variable) => v.name !== varName);

          return [...filtered, { name: varName, pointsTo: existingMemory.id }];

        });



        addLog(`Variable '${varName}' references existing immutable object (ID: ${existingMemory.id})`, 'reuse');

        setHistory((prev: HistoryItem[]) => [...prev, { 

          code, 

          desc: `Python reuses existing immutable object for efficiency. '${varName}' points to existing memory.` 

        }]);

      } else {

        const newMemObj = {

          id: nextMemId.current++,

          type: parsedValue.type,

          value: parsedValue.value,

          display: parsedValue.display,

          refs: [varName],

          color: getColorForType(parsedValue.type)

        };



        setMemory((prev: MemoryObject[]) => [...prev, newMemObj]);

        setVariables((prev: Variable[]) => {

          const filtered = prev.filter((v: Variable) => v.name !== varName);

          return [...filtered, { name: varName, pointsTo: newMemObj.id }];

        });



        addLog(`Created new ${parsedValue.type} object (ID: ${newMemObj.id}) and assigned to '${varName}'`, 'create');

        setHistory((prev: HistoryItem[]) => [...prev, { 

          code, 

          desc: `New ${parsedValue.type} object created in heap memory. Variable '${varName}' references it.` 

        }]);

      }

    }

  };



  const runGarbageCollection = (): void => {

    if (gcQueue.length > 0) {

      const collected = gcQueue[0];

      setMemory((prev: MemoryObject[]) => prev.filter((m: MemoryObject) => m.id !== collected));

      setGcQueue((prev: number[]) => prev.slice(1));

      addLog(`Garbage collected object ID ${collected}`, 'gc');

    }

  };



  useEffect(() => {

    const canvas = canvasRef.current;

    if (!canvas) return;

    

    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const w = canvas.width;

    const h = canvas.height;

    

    ctx.clearRect(0, 0, w, h);

    

    ctx.strokeStyle = '#1e293b';

    ctx.lineWidth = 1;

    for (let i = 0; i < w; i += 30) {

      ctx.beginPath();

      ctx.moveTo(i, 0);

      ctx.lineTo(i, h);

      ctx.stroke();

    }

    for (let i = 0; i < h; i += 30) {

      ctx.beginPath();

      ctx.moveTo(0, i);

      ctx.lineTo(w, i);

      ctx.stroke();

    }

    

    const memoryY = 100;

    const varY = 380;

    

    ctx.fillStyle = '#0f172a';

    ctx.fillRect(20, 30, w - 40, 220);

    ctx.strokeStyle = '#3b82f6';

    ctx.lineWidth = 2;

    ctx.strokeRect(20, 30, w - 40, 220);

    

    ctx.fillStyle = '#3b82f6';

    ctx.font = 'bold 18px monospace';

    ctx.fillText('HEAP MEMORY', 35, 55);

    ctx.font = '12px monospace';

    ctx.fillStyle = '#94a3b8';

    ctx.fillText('Objects stored here • Reference counted', 35, 73);

    

    memory.forEach((mem: MemoryObject, i: number) => {

      const x = 50 + (i % 5) * 170;

      const y = memoryY + Math.floor(i / 5) * 90;

      

      ctx.fillStyle = '#00000040';

      ctx.fillRect(x + 6, y + 6, 130, 65);

      

      const isMarkedForGC = gcQueue.includes(mem.id);

      ctx.fillStyle = isMarkedForGC ? '#ef4444' : mem.color;

      ctx.fillRect(x, y, 130, 65);

      

      ctx.strokeStyle = isMarkedForGC ? '#fca5a5' : '#0f172a';

      ctx.lineWidth = 3;

      ctx.strokeRect(x, y, 130, 65);

      

      ctx.fillStyle = '#1e293b';

      ctx.fillRect(x, y, 130, 22);

      ctx.fillStyle = '#fff';

      ctx.font = 'bold 11px monospace';

      ctx.fillText(`MEM:0x${mem.id.toString(16).padStart(4, '0')}`, x + 8, y + 15);

      

      ctx.fillStyle = '#fbbf24';

      ctx.font = '9px monospace';

      ctx.fillText(mem.type.toUpperCase(), x + 95, y + 15);

      

      ctx.fillStyle = '#fff';

      ctx.font = 'bold 16px monospace';

      const displayVal = mem.display.length > 12 ? mem.display.substring(0, 12) + '...' : mem.display;

      ctx.fillText(displayVal, x + 8, y + 43);

      

      ctx.font = 'bold 11px monospace';

      ctx.fillStyle = mem.refs.length === 0 ? '#ef4444' : '#10b981';

      ctx.fillText(`Refs: ${mem.refs.length}`, x + 8, y + 58);

      

      if (mem.refs.length > 0) {

        ctx.fillStyle = '#a78bfa';

        ctx.font = '9px monospace';

        const refText = mem.refs.join(', ');

        ctx.fillText(refText.length > 15 ? refText.substring(0, 15) + '...' : refText, x + 65, y + 58);

      }

    });

    

    ctx.fillStyle = '#0f172a';

    ctx.fillRect(20, 300, w - 40, 180);

    ctx.strokeStyle = '#8b5cf6';

    ctx.lineWidth = 2;

    ctx.strokeRect(20, 300, w - 40, 180);

    

    ctx.fillStyle = '#8b5cf6';

    ctx.font = 'bold 18px monospace';

    ctx.fillText('VARIABLE NAMESPACE', 35, 325);

    ctx.font = '12px monospace';

    ctx.fillStyle = '#94a3b8';

    ctx.fillText('Variables are references to memory', 35, 343);

    

    variables.forEach((v: Variable, i: number) => {

      const x = 50 + (i % 6) * 140;

      const y = varY;

      

      ctx.fillStyle = '#6366f1';

      ctx.fillRect(x, y, 110, 45);

      ctx.strokeStyle = '#312e81';

      ctx.lineWidth = 2;

      ctx.strokeRect(x, y, 110, 45);

      

      ctx.fillStyle = '#fff';

      ctx.font = 'bold 16px monospace';

      ctx.fillText(v.name, x + 12, y + 22);

      

      ctx.font = '9px monospace';

      ctx.fillStyle = '#c7d2fe';

      ctx.fillText(`→ 0x${v.pointsTo.toString(16).padStart(4, '0')}`, x + 12, y + 37);

      

      const memObj = memory.find((m: MemoryObject) => m.id === v.pointsTo);

      if (memObj) {

        const memIndex = memory.indexOf(memObj);

        const targetX = 50 + (memIndex % 5) * 170 + 65;

        const targetY = memoryY + Math.floor(memIndex / 5) * 90 + 65;

        

        ctx.beginPath();

        ctx.moveTo(x + 55, y);

        

        const controlY = y - 40;

        ctx.quadraticCurveTo(x + 55, controlY, targetX, targetY);

        

        const gradient = ctx.createLinearGradient(x + 55, y, targetX, targetY);

        gradient.addColorStop(0, '#8b5cf6');

        gradient.addColorStop(1, memObj.color);

        ctx.strokeStyle = gradient;

        ctx.lineWidth = 3;

        ctx.stroke();

        

        ctx.beginPath();

        ctx.moveTo(targetX, targetY);

        ctx.lineTo(targetX - 8 * Math.cos(Math.atan2(targetY - controlY, targetX - x - 55) - Math.PI / 6), targetY - 8 * Math.sin(Math.atan2(targetY - controlY, targetX - x - 55) - Math.PI / 6));

        ctx.lineTo(targetX - 8 * Math.cos(Math.atan2(targetY - controlY, targetX - x - 55) + Math.PI / 6), targetY - 8 * Math.sin(Math.atan2(targetY - controlY, targetX - x - 55) + Math.PI / 6));

        ctx.closePath();

        ctx.fillStyle = memObj.color;

        ctx.fill();

      }

    });

    

    if (gcQueue.length > 0) {

      ctx.fillStyle = '#ef444480';

      ctx.fillRect(w - 180, 35, 160, 50);

      ctx.strokeStyle = '#ef4444';

      ctx.lineWidth = 2;

      ctx.strokeRect(w - 180, 35, 160, 50);

      ctx.fillStyle = '#fff';

      ctx.font = 'bold 12px monospace';

      ctx.fillText('🗑️ GC QUEUE', w - 170, 52);

      ctx.font = '11px monospace';

      ctx.fillText(`${gcQueue.length} object(s) pending`, w - 170, 70);

    }

    

  }, [memory, variables, gcQueue, animating]);



  const getLogClassName = (logType: LogType): string => {

    if (logType === 'error') return 'bg-red-900/30 text-red-300';

    if (logType === 'success') return 'bg-green-900/30 text-green-300';

    if (logType === 'gc') return 'bg-orange-900/30 text-orange-300';

    if (logType === 'reference') return 'bg-blue-900/30 text-blue-300';

    if (logType === 'reuse') return 'bg-purple-900/30 text-purple-300';

    if (logType === 'create') return 'bg-cyan-900/30 text-cyan-300';

    return 'bg-slate-800 text-slate-300';

  };



  return (

    <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-4">

      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-6">

          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-2">

            Python Memory Manager Pro

          </h1>

          <p className="text-slate-300 text-lg">

            Professional-grade memory visualization • Step-by-step execution • Interactive learning

          </p>

        </div>



        <div className="grid lg:grid-cols-3 gap-4 mb-4">

          <div className="lg:col-span-2 bg-slate-900 rounded-xl shadow-2xl border-2 border-slate-700 p-4">

            <canvas 

              ref={canvasRef} 

              width={900} 

              height={500}

              className="w-full rounded-lg"

            />

            

            <div className="mt-4 flex gap-2 justify-center">

              <button

                onClick={runGarbageCollection}

                disabled={gcQueue.length === 0}

                className="bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"

              >

                <Trash2 size={16} />

                Run GC ({gcQueue.length})

              </button>

              

              <button

                onClick={() => {

                  setMemory([]);

                  setVariables([]);

                  setHistory([]);

                  setGcQueue([]);

                  setLogs([]);

                  nextMemId.current = 1;

                  addLog('System reset - all memory cleared', 'info');

                }}

                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"

              >

                <RotateCcw size={16} />

                Reset All

              </button>



              <button

                onClick={() => setShowHelp(!showHelp)}

                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"

              >

                <Info size={16} />

                {showHelp ? 'Hide' : 'Show'} Help

              </button>

            </div>

          </div>



          <div className="space-y-4">

            <div className="bg-slate-900 rounded-xl shadow-xl border-2 border-purple-500 p-4">

              <h3 className="text-white font-bold mb-3 flex items-center gap-2">

                <Code size={18} className="text-purple-400" />

                Execute Python Code

              </h3>

              

              <div className="mb-3">

                <input

                  type="text"

                  value={customCode}

                  onChange={(e) => setCustomCode(e.target.value)}

                  onKeyPress={(e) => {

                    if (e.key === 'Enter') {

                      executeCode(customCode);

                      setCustomCode('');

                    }

                  }}

                  placeholder="e.g., x = 10 or y = x"

                  className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg border-2 border-slate-700 focus:border-purple-500 focus:outline-none font-mono"

                />

              </div>



              <button

                onClick={() => {

                  executeCode(customCode);

                  setCustomCode('');

                }}

                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"

              >

                <Play size={18} />

                Execute

              </button>

            </div>



            <div className="bg-slate-900 rounded-xl shadow-xl border-2 border-blue-500 p-4">

              <h3 className="text-white font-bold mb-3 flex items-center gap-2">

                <AlertCircle size={18} className="text-blue-400" />

                Quick Examples

              </h3>

              

              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">

                {predefinedExamples.map((ex: ExampleItem, i: number) => (

                  <button

                    key={i}

                    onClick={() => {

                      setCustomCode(ex.code);

                    }}

                    className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded text-xs font-mono transition text-left"

                  >

                    <div className="text-blue-400 font-bold text-[10px] mb-1">{ex.label}</div>

                    {ex.code}

                  </button>

                ))}

              </div>

            </div>



            <div className="bg-slate-900 rounded-xl shadow-xl border-2 border-green-500 p-4">

              <h3 className="text-white font-bold mb-3">Memory Statistics</h3>

              <div className="space-y-2 text-sm">

                <div className="flex justify-between text-slate-300">

                  <span>Active Objects:</span>

                  <span className="font-bold text-green-400">{memory.length}</span>

                </div>

                <div className="flex justify-between text-slate-300">

                  <span>Active Variables:</span>

                  <span className="font-bold text-blue-400">{variables.length}</span>

                </div>

                <div className="flex justify-between text-slate-300">

                  <span>GC Queue:</span>

                  <span className="font-bold text-red-400">{gcQueue.length}</span>

                </div>

                <div className="flex justify-between text-slate-300">

                  <span>Operations:</span>

                  <span className="font-bold text-purple-400">{history.length}</span>

                </div>

              </div>

            </div>

          </div>

        </div>



        {showHelp && (

          <div className="bg-slate-900 rounded-xl shadow-xl border-2 border-indigo-500 p-6 mb-4">

            <h3 className="text-2xl font-bold text-white mb-4">How It Works</h3>

            <div className="grid md:grid-cols-3 gap-4 text-sm">

              <div className="bg-slate-800 p-4 rounded-lg">

                <div className="text-blue-400 font-bold mb-2 text-lg">📦 Heap Memory</div>

                <p className="text-slate-300 leading-relaxed">

                  Objects are stored in heap memory. Each object has a unique memory address, type, value, and reference count tracking how many variables point to it.

                </p>

              </div>

              <div className="bg-slate-800 p-4 rounded-lg">

                <div className="text-purple-400 font-bold mb-2 text-lg">🔗 References</div>

                <p className="text-slate-300 leading-relaxed">

                  Variables don't store values—they store references (pointers) to memory locations. Multiple variables can reference the same object.

                </p>

              </div>

              <div className="bg-slate-800 p-4 rounded-lg">

                <div className="text-green-400 font-bold mb-2 text-lg">♻️ Garbage Collection</div>

                <p className="text-slate-300 leading-relaxed">

                  When an object's reference count reaches zero, it's marked for garbage collection. Python automatically frees this memory.

                </p>

              </div>

              <div className="bg-slate-800 p-4 rounded-lg">

                <div className="text-yellow-400 font-bold mb-2 text-lg">🔒 Immutability</div>

                <p className="text-slate-300 leading-relaxed">

                  Integers, strings, and booleans are immutable. Reassigning creates new objects. Python may reuse existing immutable objects for efficiency.

                </p>

              </div>

              <div className="bg-slate-800 p-4 rounded-lg">

                <div className="text-orange-400 font-bold mb-2 text-lg">📝 Mutability</div>

                <p className="text-slate-300 leading-relaxed">

                  Lists and dicts are mutable. Modifying them changes the object in-place. All variables referencing it see the change immediately.

                </p>

              </div>

              <div className="bg-slate-800 p-4 rounded-lg">

                <div className="text-red-400 font-bold mb-2 text-lg">🗑️ Deletion</div>

                <p className="text-slate-300 leading-relaxed">

                  The 'del' statement removes a variable reference. If it was the last reference, the object becomes eligible for garbage collection.

                </p>

              </div>

            </div>

          </div>

        )}



        <div className="grid lg:grid-cols-2 gap-4">

          <div className="bg-slate-900 rounded-xl shadow-xl border-2 border-slate-700 p-4">

            <h3 className="text-white font-bold mb-3 flex items-center gap-2">

              <Code size={18} className="text-green-400" />

              Execution History

            </h3>

            <div className="space-y-2 max-h-64 overflow-y-auto">

              {history.length === 0 ? (

                <p className="text-slate-500 text-sm italic">No operations yet. Try executing some code!</p>

              ) : (

                history.map((h: HistoryItem, i: number) => (

                  <div key={i} className="bg-slate-800 p-3 rounded-lg border-l-4 border-purple-500">

                    <div className="text-purple-400 font-mono font-bold text-sm mb-1">{h.code}</div>

                    <div className="text-slate-300 text-xs leading-relaxed">{h.desc}</div>

                  </div>

                ))

              )}

            </div>

          </div>



          <div className="bg-slate-900 rounded-xl shadow-xl border-2 border-slate-700 p-4">

            <h3 className="text-white font-bold mb-3 flex items-center gap-2">

              <AlertCircle size={18} className="text-yellow-400" />

              System Logs

            </h3>

            <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-xs">

              {logs.length === 0 ? (

                <p className="text-slate-500 text-sm italic">System logs will appear here</p>

              ) : (

                logs.map((log: Log, i: number) => (

                  <div key={i} className={`p-2 rounded ${getLogClassName(log.type)}`}>

                    <span className="text-slate-500">[{log.time}]</span> {log.message}

                  </div>

                ))

              )}

            </div>

          </div>

        </div>

      </div>

    </div>

  );

};



export default PythonMemorySimulator;

