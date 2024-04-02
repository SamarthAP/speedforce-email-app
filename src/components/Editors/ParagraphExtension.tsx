import Paragraph from "@tiptap/extension-paragraph";

// Tip Tap Paragraph Extension that changes the default tag from p to div
const ParagraphExtension = Paragraph.extend({
  parseHTML() {
    return [{ tag: "p" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", HTMLAttributes, 0];
  },
});

export default ParagraphExtension;
