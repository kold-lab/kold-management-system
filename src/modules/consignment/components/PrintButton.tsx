"use client";

import { Button } from "@/components/ui/button";

export function PrintButton({ documentTitle }: { documentTitle: string }) {
  return (
    <Button
      onClick={() => {
        const prev = document.title;
        document.title = documentTitle;
        window.print();
        document.title = prev;
      }}
    >
      Print / save PDF
    </Button>
  );
}
