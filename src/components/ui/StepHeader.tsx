"use client";
import { useState, ReactNode } from "react";

interface StepHeaderProps {
  label: string;
  help?: string;
  children?: ReactNode;
}

export default function StepHeader({ label, help, children }: StepHeaderProps) {
  const [open, setOpen] = useState(false);
  
  return (
    <section>
      <div className="flex items-end justify-between">
        <h2 className="p-title text-slate-900 dark:text-white">{label}</h2>
        {children ? (
          <button 
            onClick={() => setOpen(!open)} 
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            {open ? "Hide details" : "Details"}
          </button>
        ) : null}
      </div>
      {help && <p className="mt-1 text-sm p-quiet">{help}</p>}
      {open && (
        <div className="mt-3 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
          {children}
        </div>
      )}
    </section>
  );
}