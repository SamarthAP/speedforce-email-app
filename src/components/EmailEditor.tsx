import { forwardRef, useImperativeHandle, useState } from "react";
import { Editor, EditorState } from "draft-js";

interface EmailEditorProps {
  editorRef?: React.RefObject<Editor>;
}

export interface EditorComponentRef {
  getEditorState: () => EditorState;
}

function EmailEditor(
  { editorRef }: EmailEditorProps,
  ref: React.Ref<EditorComponentRef>
) {
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );

  const getEditorState = () => {
    return editorState;
  };

  useImperativeHandle(ref, () => ({
    getEditorState,
  }));

  return (
    <div className="text-sm text-black dark:text-white">
      <Editor
        ref={editorRef}
        editorState={editorState}
        onChange={setEditorState}
      />
    </div>
  );
}

export default forwardRef(EmailEditor);
