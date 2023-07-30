import { Editor, EditorState /* , convertToRaw */ } from "draft-js";
import { useState } from "react";

interface EmailEditorProps {
  editorRef?: React.RefObject<Editor>;
}

export default function EmailEditor({ editorRef }: EmailEditorProps = {}) {
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );

  // console.log(convertToRaw(editorState.getCurrentContent()));

  return (
    <div className="p-4 border-t border-t-slate-200 dark:border-t-zinc-700">
      <Editor
        ref={editorRef}
        editorState={editorState}
        onChange={setEditorState}
      />
    </div>
  );
}
