import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { USER_MD } from "./constants"

export function UserMarkdown({ children }: { children: string }) {
  return (
    <div className={USER_MD}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}