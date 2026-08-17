import ClientOnlyBlock from "./ClientOnlyBlock";

export default function ComplexTestPage() {
  return (
    <div>
      <div className="cookie-banner">
        We use cookies. <button>Accept</button>
      </div>
      <nav>
        <a href="/">Home</a>
      </nav>
      <main>
        <h1>Complex Markup Test</h1>

        <div className="wrapper-a">
          <div className="wrapper-b">
            <div className="wrapper-c">
              <p>Deeply nested paragraph content.</p>
            </div>
          </div>
        </div>

        <form>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" name="email" />
          <button type="submit">Subscribe</button>
        </form>

        <figure>
          <img src="/next.svg" alt="A figure image" />
          <figcaption>Figure caption text.</figcaption>
        </figure>

        <details>
          <summary>Click to expand</summary>
          <p>Hidden detail content.</p>
        </details>

        <dl>
          <dt>Term One</dt>
          <dd>Definition of term one.</dd>
          <dt>Term Two</dt>
          <dd>Definition of term two.</dd>
        </dl>

        <p>
          Chemical formula: H<sub>2</sub>O. Exponent: x<sup>2</sup>.{" "}
          <mark>Highlighted text</mark>.
        </p>

        <iframe src="about:blank" title="third party embed placeholder" />

        <ClientOnlyBlock />
      </main>
      <footer>Footer content that should be stripped.</footer>
    </div>
  );
}
