import { Card, CardBody } from "@/components/ui/Card";
import Link from "next/link";

export default function NotFound() {
  return (
    <Card className="max-w-lg mx-auto mt-12">
      <CardBody className="text-center py-12">
        <div className="text-[var(--color-rubric-adverse)] text-5xl mb-4">
          404
        </div>
        <h2 className="text-base font-bold text-[var(--color-term-heading)] mb-2">
          ERROR: Page not found
        </h2>
        <p className="text-[var(--color-term-dim)] mb-6 text-sm">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 border border-[var(--color-term-heading)] text-[var(--color-term-heading)] text-base font-bold hover:bg-[var(--color-term-heading)] hover:text-[var(--color-term-bg)] transition-colors"
        >
          &gt; cd ~/dashboard
        </Link>
      </CardBody>
    </Card>
  );
}
