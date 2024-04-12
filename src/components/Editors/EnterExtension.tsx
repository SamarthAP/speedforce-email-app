import { Extension } from "@tiptap/core";

const EnterExtension = Extension.create({
  name: "enterAsShiftEnter",

  addKeyboardShortcuts() {
    return {
      // Capture the Enter key without the Shift key
      Enter: () =>
        this.editor.commands.command(({ tr, dispatch }) => {
          if (dispatch) {
            // This simulates inserting a line break
            tr.replaceSelectionWith(
              this.editor.schema.nodes.hardBreak.create()
            ).scrollIntoView();
            return true;
          }
          return false;
        }),
    };
  },
});

export default EnterExtension;
