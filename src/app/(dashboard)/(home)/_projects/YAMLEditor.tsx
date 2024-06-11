import CodeMirror, { EditorView } from "@uiw/react-codemirror";
// import { yaml } from "@nicktomlin/codemirror-lang-yaml-lite";
import { langs } from "@uiw/codemirror-extensions-langs";
import { useTheme } from "next-themes";

export default function YAMLEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const theme = useTheme();

  return (
    // <div className="relative w-full max-w-full">
    <CodeMirror
      value={value}
      onChange={onChange}
      theme={theme.theme === "dark" ? "dark" : "light"}
      extensions={[langs.yaml(), EditorView.lineWrapping]}
      data-enable-grammarly="false"
      spellCheck={false}
      width="100%"
      maxHeight="40vh"
      maxWidth="100%"
      // options={{
      //   mode: "yaml",
      //   theme: "material",
      //   lineNumbers: true,
      //   lineWrapping: true,
      //   tabSize: 2,
      //   indentWithTabs: false,
      //   extraKeys: {
      //     Tab: false,
      //     "Shift-Tab": false,
      //   },
      // }}
    />
    // </div>
  );
}
