import type * as MonacoTypes from "monaco-editor/esm/vs/editor/editor.api";

import React, { useMemo, useRef } from "react";

import { Editor } from "@monaco-editor/react";
import { configureMonacoYaml } from "monaco-yaml";
import { getSystemTheme } from "@/utils";
import loader from "@monaco-editor/loader";
import yamlWorker from './yaml.worker.js?worker'

window.MonacoEnvironment = {
  getWorker() {
    return new yamlWorker();
  },
};

export function loadMonaco() {
  loader.config({ paths: { vs: "monaco" } });
  loader
    .init()
    .catch((e) => {
      console.error("error loading monaco", e);
    });
}

function defaultEditorOptions(): MonacoTypes.editor.IEditorOptions {
  const opts: MonacoTypes.editor.IEditorOptions = {
    fontSize: 12,
    fontFamily: "Hack",
    smoothScrolling: true,
    scrollbar: {
      useShadows: false,
      verticalScrollbarSize: 5,
      horizontalScrollbarSize: 5,
    },
    minimap: {
      enabled: true,
    },
    stickyScroll: {
      enabled: false,
    },
  };
  return opts;
}

interface CodeEditorProps {
  text: string;
  language?: string;
  onChange?: (text: string) => void;
}

export function CodeEditor({ text, language, onChange }: CodeEditorProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const unmountRef = useRef<() => void>(null);

  React.useEffect(() => {
    return () => {
      // unmount function
      if (unmountRef.current) {
        unmountRef.current();
      }
    };
  }, []);

  function handleEditorChange(text?: string) {
    if (onChange && text) {
      onChange(text);
    }
  }

  const editorOpts = useMemo(() => {
    const opts = defaultEditorOptions();
    return opts;
  }, []);

  return (
    <div >
      <div className="border rounded-lg h-screen pb-10" ref={divRef}>
        <Editor
          theme={getSystemTheme()}
          value={text}
          options={editorOpts}
          onChange={handleEditorChange}
          language={language}
        />
      </div>
    </div>
  );
}