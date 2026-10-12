"use client";
export default function PrintButton({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" className="pdc-linkbtn" onClick={() => window.print()}>
      {children}
    </button>
  );
}