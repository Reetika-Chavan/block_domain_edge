"use client";

import { useEffect, useState } from "react";

export default function ClientOnlyBlock() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <p>This paragraph only exists after client-side hydration.</p>;
}
