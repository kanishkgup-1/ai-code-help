import { createContext, useState } from "react";

export const EditorContext = createContext();

export function EditorProvider({ children }) {
  const [editorPageData, setEditorPageData] = useState({
    code: "",
    suggestions: [],
    loading: false,
    error: "",
    isSuggestionsOn: true,
    collaborationSession: null,
    isSessionOn: false
  });

  return (
    <EditorContext.Provider value={{ editorPageData, setEditorPageData }}>
      {children}
    </EditorContext.Provider>
  );
}