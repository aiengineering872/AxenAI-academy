'use client';

import React, { useState, useEffect, useRef, ChangeEvent, Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Upload, Trash2, Loader2, Brain, Target, Grid3x3 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

// Declare Pyodide types
declare global {
  interface Window {
    loadPyodide: (config?: any) => Promise<any>;
  }
}

const HTML_MARKER = '__HTML_OUTPUT__';
type RichOutput = { type: 'html' | 'image' | 'text'; value: string };

function CodeSimulatorContent() {
  const searchParams = useSearchParams();
  const simulatorType = searchParams.get('type') || 'default';
  
  const [code, setCode] = useState(`# Welcome to AI Code Editor
# Preloaded libraries: numpy, pandas, scikit-learn, matplotlib, scipy

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Example: Create a simple plot
x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y, label='sin(x)')
plt.xlabel('X')
plt.ylabel('Y')
plt.title('Simple Plot Example')
plt.legend()
plt.grid(True)

# Note: plt.show() doesn't work in browser, but we can display the plot data
print("Plot data generated!")
print("X values (first 5):", x[:5])
print("Y values (first 5):", y[:5])
print("Hello from AI Code Editor!")`);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pyodideReady, setPyodideReady] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pyodideRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [datasetInfo, setDatasetInfo] = useState('');
  const [datasetPath, setDatasetPath] = useState('');
  const [datasetExt, setDatasetExt] = useState('csv');
  const [richOutputs, setRichOutputs] = useState<RichOutput[]>([]);
  const [showAnimation, setShowAnimation] = useState(true);

  // Get simulator config based on type
  const getSimulatorConfig = () => {
    switch (simulatorType) {
      case 'machine-learning':
        return {
          title: 'Machine Learning Code Editor',
          icon: Brain,
          description: 'Practice machine learning concepts with interactive code',
          defaultCode: `# Machine Learning Code Editor
# Preloaded libraries: numpy, pandas, scikit-learn, matplotlib

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
import matplotlib.pyplot as plt

# Example: Simple Linear Regression
np.random.seed(42)
X = np.random.rand(100, 1) * 10
y = 2.5 * X.ravel() + np.random.randn(100) * 2

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = LinearRegression()
model.fit(X_train, y_train)

# Predictions
y_pred = model.predict(X_test)

# Evaluate
mse = mean_squared_error(y_test, y_pred)
print(f"Mean Squared Error: {mse:.2f}")
print(f"Model Coefficients: {model.coef_[0]:.2f}")
print(f"Model Intercept: {model.intercept_:.2f}")`
        };
      case 'bias-variance':
        return {
          title: 'Bias-Variance Tradeoff Code Editor',
          icon: Target,
          description: 'Explore the bias-variance tradeoff in machine learning',
          defaultCode: `# Bias-Variance Tradeoff Code Editor
# Preloaded libraries: numpy, pandas, scikit-learn, matplotlib

import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import Pipeline
from sklearn.model_selection import learning_curve

# Example: Polynomial Regression - Bias vs Variance
np.random.seed(42)
X = np.random.rand(100, 1) * 10
y = 2.5 * X.ravel() + np.random.randn(100) * 2 + 0.1 * X.ravel()**2

print("Bias-Variance Tradeoff Example")
print("Low degree = High bias, Low variance")
print("High degree = Low bias, High variance")
print(f"Data shape: {X.shape}")
print(f"Target shape: {y.shape}")`
        };
      case 'confusion-matrix':
        return {
          title: 'Confusion Matrix Code Editor',
          icon: Grid3x3,
          description: 'Visualize and understand confusion matrices',
          defaultCode: `# Confusion Matrix Code Editor
# Preloaded libraries: numpy, pandas, scikit-learn, matplotlib

import numpy as np
import pandas as pd
from sklearn.metrics import confusion_matrix, classification_report
import matplotlib.pyplot as plt

# Example: Generate confusion matrix
y_true = np.array([0, 1, 0, 1, 1, 0, 1, 0, 0, 1])
y_pred = np.array([0, 1, 0, 1, 0, 0, 1, 1, 0, 1])

# Calculate confusion matrix
cm = confusion_matrix(y_true, y_pred)
print("Confusion Matrix:")
print(cm)
print("\nClassification Report:")
print(classification_report(y_true, y_pred))`
        };
      default:
        return {
          title: 'AI Code Editor',
          icon: Brain,
          description: 'Practice AI and ML concepts with interactive code',
          defaultCode: `# Welcome to AI Code Editor
# Preloaded libraries: numpy, pandas, scikit-learn, matplotlib, scipy

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Example: Create a simple plot
x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y, label='sin(x)')
plt.xlabel('X')
plt.ylabel('Y')
plt.title('Simple Plot Example')
plt.legend()
plt.grid(True)

print("Hello from AI Code Editor!")`
        };
    }
  };

  const simulatorConfig = getSimulatorConfig();
  const SimulatorIcon = simulatorConfig.icon;

  // Update code when simulator type changes
  useEffect(() => {
    if (mounted) {
      const config = getSimulatorConfig();
      setCode(config.defaultCode);
      if (simulatorType !== 'default') {
        setShowAnimation(true);
        setTimeout(() => setShowAnimation(false), 1000);
      }
    }
  }, [simulatorType, mounted]);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize Pyodide
  useEffect(() => {
    const initPyodide = async () => {
      try {
        setInitializing(true);
        setOutput('Initializing Pyodide... This may take a moment on first load.\n');
        
        // Load Pyodide from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        script.async = true;
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

        // Wait a bit for Pyodide to be available
        await new Promise(resolve => setTimeout(resolve, 100));

        if (window.loadPyodide) {
          pyodideRef.current = await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
          });

          // Install micropip for package management
          await pyodideRef.current.loadPackage('micropip');
          
          // Install common packages
          setOutput('Loading scientific libraries...\n');
          await pyodideRef.current.loadPackage([
            'numpy',
            'pandas',
            'matplotlib',
            'scipy',
            'scikit-learn',
          ]);

          try {
            if (typeof pyodideRef.current.runPythonAsync === 'function') {
              await pyodideRef.current.runPythonAsync('import matplotlib; matplotlib.use("Agg")');
            } else {
              pyodideRef.current.runPython('import matplotlib; matplotlib.use("Agg")');
            }
          } catch (matplotlibError) {
            console.warn('Failed to set matplotlib backend:', matplotlibError);
          }

          // Set up stdout capture
          pyodideRef.current.setStdout({
            batched: (text: string) => {
              setOutput((prev) => prev + text);
            },
          });

          setPyodideReady(true);
          setInitializing(false);
          setOutput('✅ Pyodide initialized successfully!\n✅ Libraries loaded: numpy, pandas, matplotlib, scipy, scikit-learn\n\nReady to run Python code!');
        } else {
          throw new Error('Pyodide failed to load');
        }
      } catch (err: any) {
        setError(`Failed to initialize Pyodide: ${err.message}`);
        setInitializing(false);
      }
    };

    initPyodide();
  }, []);

  const executeCode = async () => {
    if (!pyodideRef.current || !pyodideReady) {
      setError('Pyodide is not ready yet. Please wait for initialization.');
      return;
    }

    setLoading(true);
    setError('');
    setOutput('');
    setRichOutputs([]);

    try {
      const pythonResult = await pyodideRef.current.runPythonAsync(`
import io
import ast
import base64
import traceback
from contextlib import redirect_stdout

HTML_MARKER = "${HTML_MARKER}"
code_str = ${JSON.stringify(code)}

namespace = globals()
stdout_buffer = io.StringIO()
html_output_ref = {'value': None}
error_text = ""
display_outputs = []

def _record_html(html_value):
    if not html_value:
        return
    display_outputs.append({'type': 'html', 'value': html_value})
    if html_output_ref['value'] is None:
        html_output_ref['value'] = html_value

def display(obj=None):
    try:
        import pandas as _pd
    except Exception:
        _pd = None

    if _pd is not None:
        if isinstance(obj, _pd.Series):
            _record_html(obj.to_frame(name=obj.name or 'value').to_html())
            try:
                stdout_buffer.write(obj.to_string() + '\\n')
            except Exception:
                stdout_buffer.write(str(obj) + '\\n')
            return
        if isinstance(obj, _pd.DataFrame):
            try:
                _record_html(obj.to_html(index=False))
            except Exception:
                _record_html(obj.to_html())
            try:
                stdout_buffer.write(obj.head(20).to_string() + '\\n')
            except Exception:
                stdout_buffer.write(str(obj) + '\\n')
            return

    try:
        from matplotlib.figure import Figure
        import matplotlib.pyplot as _plt
        import matplotlib.axes
    except Exception:
        Figure = None
        _plt = None

    if Figure is not None and isinstance(obj, Figure):
        buf = io.BytesIO()
        obj.savefig(buf, format='png', bbox_inches='tight')
        display_outputs.append({'type': 'image', 'value': base64.b64encode(buf.getvalue()).decode('utf-8')})
        stdout_buffer.write('[Matplotlib figure displayed]\\n')
        if _plt:
            _plt.close(obj)
        return

    if Figure is not None and _plt is not None:
        try:
            import matplotlib.axes as _axes
            if isinstance(obj, _axes.Axes):
                fig = obj.figure
                buf = io.BytesIO()
                fig.savefig(buf, format='png', bbox_inches='tight')
                display_outputs.append({'type': 'image', 'value': base64.b64encode(buf.getvalue()).decode('utf-8')})
                stdout_buffer.write('[Matplotlib plot displayed]\\n')
                _plt.close(fig)
                return
        except Exception:
            pass

    if hasattr(obj, '_repr_html_'):
        try:
            html_value = obj._repr_html_()
            if html_value:
                _record_html(html_value)
                try:
                    stdout_buffer.write(str(obj) + '\\n')
                except Exception:
                    pass
                return
        except Exception:
            pass

    text_value = str(obj)
    display_outputs.append({'type': 'text', 'value': text_value})
    stdout_buffer.write(text_value + '\\n')

namespace['display'] = display

try:
    import matplotlib.pyplot as _patched_plt
    def _capture_show(*args, **kwargs):
        fig = _patched_plt.gcf()
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight')
        display_outputs.append({'type': 'image', 'value': base64.b64encode(buf.getvalue()).decode('utf-8')})
        _patched_plt.close(fig)
    _patched_plt.show = _capture_show
except Exception:
    pass

try:
    tree = ast.parse(code_str, mode='exec')
    last_expr = None
    if tree.body and isinstance(tree.body[-1], ast.Expr):
        last_expr = ast.Expression(tree.body[-1].value)
        tree.body = tree.body[:-1]

    compiled = compile(tree, '<user-code>', 'exec')

    with redirect_stdout(stdout_buffer):
        exec(compiled, namespace)
        if last_expr is not None:
            value = eval(compile(last_expr, '<user-code>', 'eval'), namespace)
            if value is not None:
                try:
                    display(value)
                except Exception:
                    display_outputs.append({'type': 'text', 'value': str(value)})

    output_text = stdout_buffer.getvalue()

    if HTML_MARKER in output_text:
        before, after = output_text.split(HTML_MARKER, 1)
        output_text = before
        after = after.strip()
        if after:
            _record_html(after)

except Exception:
    error_text = traceback.format_exc()
    output_text = stdout_buffer.getvalue()

html_output = html_output_ref['value']

{'output': output_text, 'error': error_text, 'html': html_output, 'displays': display_outputs}
`);

      let result = pythonResult;
      if (pythonResult && typeof pythonResult.toJs === 'function') {
        result = pythonResult.toJs({ dict_converter: Object.fromEntries });
        if (typeof pythonResult.destroy === 'function') {
          pythonResult.destroy();
        }
      }
      const outputText = result.output || '';
      const errorText = result.error || '';
      const html = result.html || null;
      const displays = Array.isArray(result.displays) ? result.displays : [];

      if (errorText) {
        setError(errorText);
      }
      if (outputText.trim()) {
        setOutput(outputText.trim());
      } else if (!errorText) {
        setOutput('Code executed successfully. No output generated.');
      }
      const combinedRich: RichOutput[] = [];
      if (displays.length) {
        displays.forEach((item: any) => {
          if (item && typeof item === 'object' && typeof item.type === 'string' && typeof item.value === 'string') {
            const type = item.type as RichOutput['type'];
            if (type === 'html' || type === 'image' || type === 'text') {
              combinedRich.push({ type, value: item.value });
            }
          } else if (typeof item === 'string') {
            combinedRich.push({ type: 'text', value: item });
          }
        });
      } else if (html) {
        combinedRich.push({
          type: 'html',
          value: typeof html === 'string' ? html : String(html),
        });
      }
      setRichOutputs(combinedRich);
    } catch (err: any) {
      const errorMsg = err.toString();
      setError(errorMsg);
      setRichOutputs([]);
    } finally {
      setLoading(false);
    }
  };

  const clearCode = () => {
    setCode('');
    setOutput('');
    setError('');
    setRichOutputs([]);
  };

  const clearOutput = () => {
    setOutput('');
    setError('');
    setRichOutputs([]);
  };

  const handleUploadClick = () => {
    if (!pyodideReady || !pyodideRef.current) {
      setError('Pyodide must finish initializing before you can upload a dataset.');
      return;
    }
    fileInputRef.current?.click();
  };

  const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

  const getReadStatement = (pathExpression: string, ext: string) => {
    switch (ext) {
      case 'json':
        return `pd.read_json(${pathExpression})`;
      case 'tsv':
        return `pd.read_csv(${pathExpression}, sep="\\t")`;
      case 'txt':
        return `pd.read_csv(${pathExpression}, sep="\\s+", engine="python")`;
      default:
        return `pd.read_csv(${pathExpression})`;
    }
  };

  const handleDatasetUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!pyodideReady || !pyodideRef.current) {
      setError('Pyodide is not ready yet. Please wait for initialization before uploading datasets.');
      return;
    }

    try {
      setError('');
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const safeName = sanitizeFileName(file.name);
      const virtualPath = `/tmp/${safeName}`;

      pyodideRef.current.FS.writeFile(virtualPath, uint8Array);
      setDatasetPath(virtualPath);
      const extension = file.name.split('.').pop()?.toLowerCase() ?? 'csv';
      setDatasetExt(extension);
      setDatasetInfo(`📁 Dataset "${file.name}" uploaded. Previewing first 10 rows below.`);
      setError('');

      const previewScript = `
import pandas as pd
_path = r"${virtualPath}"
_df = ${getReadStatement('_path', extension)}
_df.head(10).to_html(index=False)
`;

      try {
        const previewHtml =
          typeof pyodideRef.current.runPythonAsync === 'function'
            ? await pyodideRef.current.runPythonAsync(previewScript)
            : pyodideRef.current.runPython(previewScript);

        const previewHtmlString =
          typeof previewHtml === 'string'
            ? previewHtml
            : previewHtml && typeof previewHtml.toString === 'function'
            ? previewHtml.toString()
            : '';

        setOutput(`Preview of "${file.name}" (first 10 rows):`);
        setRichOutputs(
          previewHtmlString ? [{ type: 'html', value: previewHtmlString }] : []
        );
      } catch (previewError: any) {
        console.error('Failed to generate preview:', previewError);
        setRichOutputs([]);
        setOutput(
          `Dataset "${file.name}" uploaded to ${virtualPath}, but preview failed. Run your own code to inspect it.`
        );
      }
    } catch (uploadError: any) {
      console.error('Failed to upload dataset:', uploadError);
      setError(`Failed to upload dataset: ${uploadError.message ?? uploadError}`);
      setDatasetInfo('');
      setDatasetPath('');
      setRichOutputs([]);
    } finally {
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const insertDatasetSnippet = () => {
    if (!datasetPath) {
      setError('Upload a dataset before inserting the helper snippet.');
      return;
    }

    const snippet = `# Load uploaded dataset
import pandas as pd

dataset_path = r"${datasetPath}"
df = ${getReadStatement('dataset_path', datasetExt)}

print("Dataset shape:", df.shape)
print("${HTML_MARKER}" + df.head(20).to_html(index=False))`;

    setCode(snippet);
    setError('');
    setOutput('Ready to inspect the uploaded dataset. Run the code to view the table and continue your analysis.');
    setRichOutputs([]);
  };

  const loadExample = (example: string) => {
    const examples: Record<string, string> = {
      ml: `# Machine Learning Example
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Generate sample data
X, y = make_classification(n_samples=1000, n_features=4, n_informative=2, n_redundant=0, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Predict
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"Model Accuracy: {accuracy:.2f}")`,
      dl: `# Deep Learning Example using scikit-learn
from sklearn.neural_network import MLPClassifier
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import numpy as np

# Generate sample data
X, y = make_classification(n_samples=1000, n_features=20, n_informative=15, 
                          n_redundant=5, n_classes=2, random_state=42)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Create a multi-layer perceptron (neural network)
# Hidden layers: 128 -> 64 -> 32 neurons
model = MLPClassifier(hidden_layer_sizes=(128, 64, 32), 
                      activation='relu', 
                      solver='adam',
                      max_iter=100,
                      random_state=42,
                      verbose=True)

# Train the model
print("Training neural network...")
model.fit(X_train, y_train)

# Predict
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"\nModel Accuracy: {accuracy:.4f}")
print("Model training completed!")`,
      data: `# Data Analysis Example
import pandas as pd
import numpy as np

# Create sample DataFrame
data = {
    "Name": ["Alice", "Bob", "Charlie", "Diana"],
    "Age": [25, 30, 35, 28],
    "Score": [85, 90, 88, 92]
}

df = pd.DataFrame(data)
print("DataFrame:")
print(df)
mean_score = df["Score"].mean()
print("Average Score: {:.2f}".format(mean_score))`,
      genai: `# GenAI Example - Using OpenAI-style API calls
# Note: For real API calls, you'll need to handle API keys securely
# This example shows the pattern

import json

# Example: Simple text processing that could be used with GenAI
def process_text(text):
    # Simulate text processing
    words = text.split()
    word_count = len(words)
    char_count = len(text)
    return {
        'word_count': word_count,
        'char_count': char_count,
        'words': words[:5]  # First 5 words
    }

text = "This is a sample text for GenAI processing"
result = process_text(text)
print("Text Processing Result:")
print(json.dumps(result, indent=2))

# For real GenAI API calls, you would use:
# import requests
# response = requests.post('https://api.openai.com/v1/chat/completions', ...)
# But API keys need to be handled securely (backend proxy recommended)`,
    };
    setCode(examples[example] || '');
    setOutput('');
    setError('');
    setRichOutputs([]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {showAnimation && simulatorType !== 'default' ? (
            <motion.div
              key={simulatorType}
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <SimulatorIcon className="w-8 h-8 text-primary" />
                </motion.div>
                <h1 className="text-3xl font-bold text-text">{simulatorConfig.title}</h1>
              </div>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-textSecondary"
              >
                {simulatorConfig.description}
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-2">
                <SimulatorIcon className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-text">{simulatorConfig.title}</h1>
              </div>
              <p className="text-textSecondary">
                {simulatorConfig.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Code Editor */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-black modern-card glow-border rounded-xl overflow-hidden relative"
          >
            <div className="bg-card/50 p-4 flex items-center justify-between border-b border-card relative z-10">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text">Python Editor</span>
                {mounted && (
                  <>
                    {initializing ? (
                      <span className="text-xs text-textSecondary flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Initializing Pyodide...
                      </span>
                    ) : pyodideReady ? (
                      <span className="text-xs text-green-400">✅ Ready</span>
                    ) : (
                      <span className="text-xs text-textSecondary">Preloaded: numpy, pandas, scikit-learn, matplotlib, scipy</span>
                    )}
                  </>
                )}
                {!mounted && (
                  <span className="text-xs text-textSecondary">Loading...</span>
                )}
              </div>
              <div className="flex items-center gap-2 relative z-20">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    loadExample('ml');
                  }}
                  className="px-3 py-1 text-xs bg-card hover:bg-card/80 rounded transition-all relative z-20 cursor-pointer"
                  type="button"
                >
                  ML Example
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    loadExample('dl');
                  }}
                  className="px-3 py-1 text-xs bg-card hover:bg-card/80 rounded transition-all relative z-20 cursor-pointer"
                  type="button"
                >
                  DL Example
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    loadExample('data');
                  }}
                  className="px-3 py-1 text-xs bg-card hover:bg-card/80 rounded transition-all relative z-20 cursor-pointer"
                  type="button"
                >
                  Data Example
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    loadExample('genai');
                  }}
                  className="px-3 py-1 text-xs bg-card hover:bg-card/80 rounded transition-all relative z-20 cursor-pointer"
                  type="button"
                >
                  GenAI Example
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleUploadClick();
                  }}
                  className="px-3 py-1 text-xs bg-primary/80 hover:bg-primary/90 text-white rounded transition-all flex items-center gap-1 relative z-20 cursor-pointer"
                  type="button"
                >
                  <Upload className="w-3 h-3" />
                  Upload Dataset
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    insertDatasetSnippet();
                  }}
                  className="px-3 py-1 text-xs bg-card hover:bg-card/80 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed relative z-20 cursor-pointer"
                  disabled={!datasetPath}
                  type="button"
                >
                  Load Uploaded Dataset
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    clearCode();
                  }}
                  className="p-2 hover:bg-card/80 rounded transition-all relative z-20 cursor-pointer"
                  aria-label="Clear code"
                  type="button"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,.tsv,.txt"
              hidden
              onChange={handleDatasetUpload}
            />
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-[500px] p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 relative z-10"
              placeholder="Write your Python code here..."
              spellCheck={false}
              style={{ 
                color: '#ffffff', 
                backgroundColor: 'rgba(26, 35, 50, 0.95)',
                caretColor: '#ff6b35',
                border: 'none',
                outline: 'none',
                pointerEvents: 'auto'
              }}
            />
            <div className="bg-card/50 p-4 border-t border-card relative z-10">
              {datasetInfo && (
                <div className="mb-3 text-xs text-green-400">{datasetInfo}</div>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  executeCode();
                }}
                disabled={loading || !code.trim() || !pyodideReady || initializing || !mounted}
                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed relative z-20 cursor-pointer"
                type="button"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Run Code
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Output */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-black modern-card glow-border rounded-xl overflow-hidden relative"
          >
            <div className="bg-card/50 p-4 border-b border-card flex items-center justify-between relative z-10">
              <span className="text-sm font-medium text-text">Console Output</span>
              {(output || error || richOutputs.length) && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    clearOutput();
                  }}
                  className="px-3 py-1 text-xs bg-card hover:bg-card/80 rounded transition-all text-textSecondary hover:text-text relative z-20 cursor-pointer"
                  aria-label="Clear output"
                  type="button"
                >
                  Clear Output
                </button>
              )}
            </div>
            <div className="p-4 h-[500px] overflow-auto space-y-4" style={{ backgroundColor: 'rgba(10, 17, 40, 0.9)' }}>
              {error ? (
                <>
                  <pre className="text-red-400 font-mono text-sm whitespace-pre-wrap break-words">
                    {error}
                  </pre>
                  {output && (
                    <pre className="text-textSecondary font-mono text-sm whitespace-pre-wrap border-t border-card pt-2 break-words">
                      {output}
                    </pre>
                  )}
                </>
              ) : (
                <>
                  {output && (
                    <pre className="text-textSecondary font-mono text-sm whitespace-pre-wrap break-words" style={{ color: '#a0aec0' }}>
                      {output}
                    </pre>
                  )}
                  {richOutputs.map((item, index) => {
                    if (item.type === 'html') {
                      return (
                        <div
                          key={`html-${index}`}
                          className="overflow-auto rounded-lg border border-card/60 bg-card/40 p-3"
                          style={{ color: '#e2e8f0' }}
                          dangerouslySetInnerHTML={{
                            __html: `<style>
                              table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
                              th, td { border: 1px solid rgba(148, 163, 184, 0.35); padding: 6px 10px; text-align: left; }
                              th { background-color: rgba(59, 130, 246, 0.15); color: #f8fafc; }
                              tr:nth-child(even) { background-color: rgba(148, 163, 184, 0.08); }
                            </style>${item.value}`,
                          }}
                        />
                      );
                    }
                    if (item.type === 'image') {
                      return (
                        <div
                          key={`img-${index}`}
                          className="overflow-auto rounded-lg border border-card/60 bg-card/40 p-3 flex justify-center"
                          style={{ color: '#e2e8f0' }}
                        >
                          <img
                            src={`data:image/png;base64,${item.value}`}
                            alt="Plot output"
                            className="max-h-96 w-full object-contain"
                          />
                        </div>
                      );
                    }
                    return (
                      <pre
                        key={`text-${index}`}
                        className="text-textSecondary font-mono text-sm whitespace-pre-wrap break-words"
                        style={{ color: '#a0aec0' }}
                      >
                        {item.value}
                      </pre>
                    );
                  })}
                  {!output && !richOutputs.length && (
                    <p className="text-textSecondary text-sm" style={{ color: '#a0aec0' }}>
                      Output will appear here after code execution...
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Library Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black modern-card glow-border p-6 rounded-xl"
        >
          <h2 className="text-xl font-bold text-text mb-4">Available Libraries</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['numpy', 'pandas', 'scikit-learn', 'matplotlib', 'scipy', 'json', 'requests'].map(
              (lib) => (
                <div
                  key={lib}
                  className="px-4 py-2 bg-card/50 rounded-lg text-center text-sm font-medium text-text"
                >
                  {lib}
                </div>
              )
            )}
          </div>
          <div className="mt-4 p-4 bg-card/30 rounded-lg">
            <p className="text-sm text-textSecondary">
              <strong className="text-text">Note:</strong> TensorFlow and PyTorch are not available in Pyodide due to size constraints.
              For Deep Learning, use scikit-learn's neural network modules or consider using a backend service.
              For GenAI API calls, handle API keys securely through a backend proxy.
            </p>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default function CodeSimulatorPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="space-y-6">
          <div className="bg-black modern-card glow-border p-6 rounded-xl text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-textSecondary">Loading code editor...</p>
          </div>
        </div>
      </DashboardLayout>
    }>
      <CodeSimulatorContent />
    </Suspense>
  );
}

