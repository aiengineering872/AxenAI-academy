// Python Memory & Variable Flow Simulator - Parser and State Management

export interface MemoryObject {
  id: string;
  type: 'int' | 'float' | 'str' | 'bool' | 'None' | 'list' | 'dict' | 'set' | 'tuple';
  value: any;
  isMutable: boolean;
  references: string[]; // Variable names that reference this object
}

export interface Variable {
  name: string;
  objectId: string | null; // null means variable doesn't exist or was deleted
}

export interface ExecutionStep {
  lineNumber: number;
  code: string;
  explanation: string;
  variables: Variable[];
  memoryObjects: Record<string, MemoryObject>;
  highlightedVar?: string;
  highlightedObj?: string;
  operation: 'assign' | 'reference' | 'copy' | 'mutate' | 'delete' | 'method';
}

// Check if a type is mutable
export function isMutableType(type: MemoryObject['type']): boolean {
  return ['list', 'dict', 'set'].includes(type);
}

// Get color for type
export function getTypeColor(type: MemoryObject['type']): string {
  if (isMutableType(type)) {
    return 'rgba(220, 77, 1, 0.8)'; // Orange/Red for mutable
  }
  return 'rgba(59, 130, 246, 0.8)'; // Blue for immutable
}

// Parse Python code into execution steps
export function parsePythonCode(code: string): ExecutionStep[] {
  try {
    const lines = code.split('\n').map((line, idx) => ({ line, number: idx + 1 }));
    const steps: ExecutionStep[] = [];
    const variables: Record<string, string | null> = {}; // varName -> objectId
    const memoryObjects: Record<string, MemoryObject> = {};
    let objectIdCounter = 1;

  // Helper to generate object ID
  const generateObjectId = () => `obj_${objectIdCounter++}`;

  // Helper to parse value - improved version
  const parseValue = (expr: string, allowVariableRef: boolean = true): { value: any; type: MemoryObject['type']; isVariableRef?: boolean } => {
    expr = expr.trim();
    
    // None
    if (expr === 'None' || expr === 'none') {
      return { value: null, type: 'None' };
    }
    
    // Boolean
    if (expr === 'True' || expr === 'true') {
      return { value: true, type: 'bool' };
    }
    if (expr === 'False' || expr === 'false') {
      return { value: false, type: 'bool' };
    }
    
    // String (handles both single and double quotes)
    if ((expr.startsWith('"') && expr.endsWith('"')) || 
        (expr.startsWith("'") && expr.endsWith("'"))) {
      return { value: expr.slice(1, -1), type: 'str' };
    }
    
    // Set literal: {1, 2, 3}
    if (expr.startsWith('{') && expr.endsWith('}')) {
      const content = expr.slice(1, -1).trim();
      if (!content) {
        return { value: [], type: 'set' };
      }
      try {
        // Try to parse as JSON first (for simple cases)
        const items = content.split(',').map(s => parseValue(s.trim(), false));
        return { value: items.map(i => i.value), type: 'set' };
      } catch {
        return { value: [], type: 'set' };
      }
    }
    
    // List literal: [1, 2, 3]
    if (expr.startsWith('[') && expr.endsWith(']')) {
      const content = expr.slice(1, -1).trim();
      if (!content) {
        return { value: [], type: 'list' };
      }
      try {
        // Try JSON parse first
        const parsed = JSON.parse(expr.replace(/'/g, '"'));
        return { value: parsed, type: 'list' };
      } catch {
        // Manual parsing for lists with mixed quotes
        const items: any[] = [];
        let current = '';
        let inString = false;
        let stringChar = '';
        
        for (let i = 0; i < content.length; i++) {
          const char = content[i];
          if ((char === '"' || char === "'") && (i === 0 || content[i-1] !== '\\')) {
            if (!inString) {
              inString = true;
              stringChar = char;
            } else if (char === stringChar) {
              inString = false;
              items.push(parseValue(stringChar + current + stringChar, false));
              current = '';
              continue;
            }
          }
          if (inString) {
            current += char;
            continue;
          }
          if (char === ',') {
            if (current.trim()) {
              items.push(parseValue(current.trim(), false));
            }
            current = '';
          } else {
            current += char;
          }
        }
        if (current.trim()) {
          items.push(parseValue(current.trim(), false));
        }
        return { value: items.map(i => i.value), type: 'list' };
      }
    }
    
    // Dictionary literal: {'x': 1, 'y': 2}
    if (expr.startsWith('{') && expr.includes(':')) {
      try {
        // Try JSON parse
        const parsed = JSON.parse(expr.replace(/'/g, '"'));
        return { value: parsed, type: 'dict' };
      } catch {
        // Simple dict parsing
        return { value: {}, type: 'dict' };
      }
    }
    
    // Tuple literal: (1, 2, 3)
    if (expr.startsWith('(') && expr.endsWith(')')) {
      const content = expr.slice(1, -1).trim();
      if (!content) {
        return { value: [], type: 'tuple' };
      }
      const items = content.split(',').map(s => parseValue(s.trim(), false));
      return { value: items.map(i => i.value), type: 'tuple' };
    }
    
    // Number (integer)
    if (/^-?\d+$/.test(expr)) {
      return { value: parseInt(expr, 10), type: 'int' };
    }
    
    // Number (float)
    if (/^-?\d*\.\d+$/.test(expr)) {
      return { value: parseFloat(expr), type: 'float' };
    }
    
    // Variable reference (only if allowed and variable exists)
    if (allowVariableRef && variables[expr] !== undefined && variables[expr] !== null) {
      return { value: variables[expr], type: 'None', isVariableRef: true };
    }
    
    // Default to string if nothing matches
    return { value: expr, type: 'str' };
  };

  // Helper to safely deep copy a value
  const deepCopy = (value: any): any => {
    if (value === null || value === undefined) {
      return value;
    }
    if (typeof value !== 'object') {
      return value; // Primitives are already copied
    }
    if (Array.isArray(value)) {
      return value.map(item => deepCopy(item));
    }
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (e) {
      // Fallback for objects that can't be JSON serialized
      if (Array.isArray(value)) {
        return [...value];
      }
      return { ...value };
    }
  };

  // Helper to create memory object
  const createMemoryObject = (value: any, type: MemoryObject['type']): string => {
    const id = generateObjectId();
    try {
      memoryObjects[id] = {
        id,
        type,
        value: deepCopy(value),
        isMutable: isMutableType(type),
        references: [],
      };
    } catch (error) {
      // Fallback for problematic values
      memoryObjects[id] = {
        id,
        type,
        value: value,
        isMutable: isMutableType(type),
        references: [],
      };
    }
    return id;
  };

  // Helper to update references
  const updateReferences = () => {
    try {
      // Clear all references
      Object.values(memoryObjects).forEach(obj => {
        if (obj && typeof obj === 'object' && 'references' in obj) {
          obj.references = [];
        }
      });
      
      // Rebuild references
      Object.entries(variables).forEach(([varName, objId]) => {
        if (objId && memoryObjects[objId] && typeof memoryObjects[objId] === 'object') {
          const obj = memoryObjects[objId];
          if (obj && Array.isArray(obj.references) && !obj.references.includes(varName)) {
            obj.references.push(varName);
          }
        }
      });
    } catch (error) {
      console.error('Error updating references:', error);
    }
  };

  // Helper to safely copy memory objects
  const copyMemoryObjects = (): Record<string, MemoryObject> => {
    const copied: Record<string, MemoryObject> = {};
    try {
      Object.entries(memoryObjects).forEach(([id, obj]) => {
        if (!obj || typeof obj !== 'object') {
          return; // Skip invalid objects
        }
        try {
          const references = Array.isArray(obj.references) ? [...obj.references] : [];
          copied[id] = {
            id: String(obj.id || id),
            type: obj.type || 'None',
            value: deepCopy(obj.value),
            isMutable: Boolean(obj.isMutable),
            references: references,
          };
        } catch (error) {
          // Fallback - create minimal valid object
          const references = Array.isArray(obj.references) ? [...obj.references] : [];
          copied[id] = {
            id: String(obj.id || id),
            type: obj.type || 'None',
            value: obj.value !== undefined ? obj.value : null,
            isMutable: Boolean(obj.isMutable),
            references: references,
          };
        }
      });
    } catch (error) {
      console.error('Error copying memory objects:', error);
    }
    return copied;
  };

  // Helper to create step
  const createStep = (
    lineNumber: number,
    code: string,
    explanation: string,
    highlightedVar?: string,
    highlightedObj?: string,
    operation: ExecutionStep['operation'] = 'assign'
  ): ExecutionStep => {
    try {
      updateReferences();
      const step: ExecutionStep = {
        lineNumber: Number(lineNumber) || 0,
        code: String(code || ''),
        explanation: String(explanation || ''),
        variables: Object.entries(variables)
          .filter(([name]) => name && typeof name === 'string')
          .map(([name, objId]) => ({
            name: String(name),
            objectId: objId ? String(objId) : null,
          })),
        memoryObjects: copyMemoryObjects(),
        highlightedVar: highlightedVar ? String(highlightedVar) : undefined,
        highlightedObj: highlightedObj ? String(highlightedObj) : undefined,
        operation: operation || 'assign',
      };
      return step;
    } catch (error) {
      console.error('Error creating step:', error);
      // Return minimal valid step
      return {
        lineNumber: Number(lineNumber) || 0,
        code: String(code || ''),
        explanation: String(explanation || ''),
        variables: [],
        memoryObjects: {},
        highlightedVar: highlightedVar ? String(highlightedVar) : undefined,
        highlightedObj: highlightedObj ? String(highlightedObj) : undefined,
        operation: operation || 'assign',
      };
    }
  };

  // Process each line
  lines.forEach(({ line, number }) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return; // Skip empty lines and comments
    }

    // Copy operation: b = a.copy()
    if (trimmed.includes('.copy()')) {
      const parts = trimmed.split('=').map(s => s.trim());
      if (parts.length === 2) {
        const varName = parts[0];
        const sourceExpr = parts[1];
        const sourceVar = sourceExpr.replace('.copy()', '').trim();
        
        if (variables[sourceVar] && memoryObjects[variables[sourceVar]!]) {
          const sourceObj = memoryObjects[variables[sourceVar]!];
          
          if (sourceObj.isMutable) {
            const newObjId = createMemoryObject(sourceObj.value, sourceObj.type);
            variables[varName] = newObjId;
            steps.push(createStep(
              number,
              trimmed,
              `Created a copy of the ${sourceObj.type} object. Variable '${varName}' references the new copy (${newObjId}), independent of '${sourceVar}'.`,
              varName,
              newObjId,
              'copy'
            ));
            return;
          }
        }
      }
    }

    // List methods: a.append(4), a.extend([5, 6])
    if (trimmed.includes('.append(') || trimmed.includes('.extend(')) {
      const dotIndex = trimmed.indexOf('.');
      if (dotIndex > 0) {
        const varName = trimmed.substring(0, dotIndex).trim();
        const methodCall = trimmed.substring(dotIndex + 1);
        const method = methodCall.includes('append') ? 'append' : 'extend';
        const argMatch = methodCall.match(/\((.*?)\)/);
        
        if (variables[varName] && memoryObjects[variables[varName]!]) {
          const obj = memoryObjects[variables[varName]!];
          
          if (obj.type === 'list') {
            if (method === 'append' && argMatch) {
              const argValue = parseValue(argMatch[1], false).value;
              obj.value.push(argValue);
              steps.push(createStep(
                number,
                trimmed,
                `Modified the list object in-place. Added ${JSON.stringify(argValue)} to the list. All variables referencing this object will see the change.`,
                varName,
                obj.id,
                'mutate'
              ));
              return;
            } else if (method === 'extend' && argMatch) {
              const argValue = parseValue(argMatch[1], false).value;
              if (Array.isArray(argValue)) {
                obj.value.push(...argValue);
                steps.push(createStep(
                  number,
                  trimmed,
                  `Extended the list object in-place. Added ${JSON.stringify(argValue)} to the list. All variables referencing this object will see the change.`,
                  varName,
                  obj.id,
                  'mutate'
                ));
                return;
              }
            }
          }
        }
      }
    }

    // Set methods: s.add(1), s.remove(2)
    if (trimmed.includes('.add(') || trimmed.includes('.remove(')) {
      const dotIndex = trimmed.indexOf('.');
      if (dotIndex > 0) {
        const varName = trimmed.substring(0, dotIndex).trim();
        const methodCall = trimmed.substring(dotIndex + 1);
        const method = methodCall.includes('add') ? 'add' : 'remove';
        const argMatch = methodCall.match(/\((.*?)\)/);
        
        if (variables[varName] && memoryObjects[variables[varName]!]) {
          const obj = memoryObjects[variables[varName]!];
          
          if (obj.type === 'set') {
            const argValue = parseValue(argMatch?.[1] || '', false).value;
            if (method === 'add') {
              if (!obj.value.includes(argValue)) {
                obj.value.push(argValue);
              }
              steps.push(createStep(
                number,
                trimmed,
                `Modified the set object in-place. Added ${JSON.stringify(argValue)} to the set. All variables referencing this object will see the change.`,
                varName,
                obj.id,
                'mutate'
              ));
              return;
            } else if (method === 'remove') {
              const index = obj.value.indexOf(argValue);
              if (index > -1) {
                obj.value.splice(index, 1);
                steps.push(createStep(
                  number,
                  trimmed,
                  `Modified the set object in-place. Removed ${JSON.stringify(argValue)} from the set. All variables referencing this object will see the change.`,
                  varName,
                  obj.id,
                  'mutate'
                ));
                return;
              }
            }
          }
        }
      }
    }

    // Dictionary operations: d['key'] = 'value' or d["key"] = "value"
    if (trimmed.includes('[') && trimmed.includes(']') && trimmed.includes('=')) {
      const equalIndex = trimmed.indexOf('=');
      const varAndKey = trimmed.substring(0, equalIndex).trim();
      const valueExpr = trimmed.substring(equalIndex + 1).trim();
      
      const varMatch = varAndKey.match(/^(\w+)\s*\[/);
      const keyMatch = varAndKey.match(/\[(['"]?)(\w+)\1\]/);
      
      if (varMatch && keyMatch) {
        const varName = varMatch[1];
        const key = keyMatch[2];
        
        if (variables[varName] && memoryObjects[variables[varName]!]) {
          const obj = memoryObjects[variables[varName]!];
          
          if (obj.type === 'dict') {
            const { value } = parseValue(valueExpr, false);
            obj.value[key] = value;
            steps.push(createStep(
              number,
              trimmed,
              `Modified the dictionary object in-place. Set key '${key}' to ${JSON.stringify(value)}. All variables referencing this object will see the change.`,
              varName,
              obj.id,
              'mutate'
            ));
            return;
          }
        }
      }
    }

    // Variable assignment: a = 10, b = a, a = [1, 2, 3]
    if (trimmed.includes('=')) {
      const parts = trimmed.split('=').map(s => s.trim());
      if (parts.length >= 2) {
        const varName = parts[0];
        const expression = parts.slice(1).join('=').trim(); // Handle cases with = in value
        
        const parsed = parseValue(expression, true);
        
        // Check if it's a variable reference
        if (parsed.isVariableRef && typeof parsed.value === 'string' && parsed.value.startsWith('obj_')) {
          // Reference assignment: b = a
          const oldObjId = variables[varName];
          variables[varName] = parsed.value;
          steps.push(createStep(
            number,
            trimmed,
            `Variable '${varName}' now references the same object as the source variable. Both variables point to the same memory location (${parsed.value}).`,
            varName,
            parsed.value,
            'reference'
          ));
          return;
        }
        
        // New object creation or reassignment
        const oldObjId = variables[varName];
        const newObjId = createMemoryObject(parsed.value, parsed.type);
        variables[varName] = newObjId;
        
        let explanation = '';
        if (oldObjId && memoryObjects[oldObjId]) {
          const oldObj = memoryObjects[oldObjId];
          if (oldObj.references.length === 0) {
            // Object will be garbage collected
            delete memoryObjects[oldObjId];
            explanation = `Variable '${varName}' now references a new ${parsed.type} object (${newObjId}). The old ${oldObj.type} object (${oldObjId}) has no references and will be garbage collected.`;
          } else {
            explanation = `Variable '${varName}' now references a new ${parsed.type} object (${newObjId}). The old object (${oldObjId}) is still referenced by: ${oldObj.references.join(', ')}.`;
          }
        } else {
          explanation = `Created ${parsed.type} object ${JSON.stringify(parsed.value)} in memory (${newObjId}). Variable '${varName}' references it.`;
        }
        
        steps.push(createStep(
          number,
          trimmed,
          explanation,
          varName,
          newObjId,
          'assign'
        ));
        return;
      }
    }
  });

    return steps;
  } catch (error) {
    console.error('Error in parsePythonCode:', error);
    // Return empty steps array on error
    return [];
  }
}
