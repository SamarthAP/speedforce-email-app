import Paragraph from "@tiptap/extension-paragraph";

// Tip Tap Paragraph Extension that changes the default tag to div from p
// Based on: https://github.com/ueberdosis/tiptap/tree/main/packages/extension-paragraph
const ParagraphExtension = Paragraph.extend({
  parseHTML() {
    return [{ tag: "p" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", HTMLAttributes, 0];
  },
});

export default ParagraphExtension;
