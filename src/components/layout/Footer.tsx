export function Footer() {
  return (
    <footer className="border-t border-[var(--color-term-border)] mt-auto bg-[var(--color-term-bg-light)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-[var(--color-term-dim)]">
          <span>
            [SESSION] policypulse v0.1.0 | [STATUS] operational | [MODE] non-partisan
          </span>
          <span>
            [DATA]{" "}
            <a
              href="https://www.federalregister.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-rubric-favorable)] hover:underline"
            >
              Federal Register
            </a>
            {" | "}
            <a
              href="https://apnews.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-rubric-favorable)] hover:underline"
            >
              AP News
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
