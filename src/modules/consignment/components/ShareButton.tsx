"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Shares the partner's read-only copy: native share sheet (WhatsApp etc.)
 * where available, clipboard copy as the desktop fallback.
 */
export function ShareButton({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}${path}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user dismissed the sheet — fall through to copy
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button type="button" variant="secondary" onClick={share}>
      {copied ? "Link copied ✓" : "Share with partner"}
    </Button>
  );
}
