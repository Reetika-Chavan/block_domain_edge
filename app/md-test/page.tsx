export default function MarkdownTestPage() {
  return (
    <div>
      <nav>
        <a href="/">Home</a> | <a href="/about">About</a>
      </nav>
      <aside>Sidebar content that should be stripped.</aside>
      <main>
        <h1>Markdown Conversion Test</h1>
        <p>
          This paragraph has <strong>bold</strong>, <em>italic</em>, and{" "}
          <code>inline code</code>. It also links to{" "}
          <a href="https://example.com">example.com</a>.
        </p>
        <h2>Second Heading</h2>
        <p>
          Line one of a paragraph.
          <br />
          Line two after a line break.
        </p>
        <blockquote>This is a quoted line.</blockquote>
        <h3>A List</h3>
        <ul>
          <li>First item</li>
          <li>
            Second item
            <ul>
              <li>Nested item</li>
            </ul>
          </li>
        </ul>
        <ol>
          <li>Step one</li>
          <li>Step two</li>
        </ol>
        <h3>Code Block</h3>
        <pre>
          <code>{`function hello() {\n  return "world";\n}`}</code>
        </pre>
        <h3>A Table</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Alpha</td>
              <td>1</td>
            </tr>
            <tr>
              <td>Beta</td>
              <td>2</td>
            </tr>
          </tbody>
        </table>
        <hr />
        <img src="/next.svg" alt="Next logo" />
      </main>
      <footer>Footer content that should be stripped.</footer>
    </div>
  );
}
