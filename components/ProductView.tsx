"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { ObjectViewer } from "@/components/ObjectViewer";

type MaterialView = {
  view: string | null;
  setView: (src: string | null) => void;
};

const MaterialViewContext = createContext<MaterialView | null>(null);

export function MaterialViewProvider({
  initialView = null,
  children,
}: {
  initialView?: string | null;
  children: ReactNode;
}) {
  const [view, setView] = useState<string | null>(initialView);
  const value = useMemo(() => ({ view, setView }), [view]);
  return <MaterialViewContext.Provider value={value}>{children}</MaterialViewContext.Provider>;
}

export function useMaterialView() {
  return useContext(MaterialViewContext);
}

export function ProductHero({ images, name }: { images: readonly string[]; name: string }) {
  const materialView = useMaterialView();
  if (images.length === 0 && !materialView?.view) {
    return <div className="object-stage relative aspect-[4/5] bg-[#1c1a18]" />;
  }
  return <ObjectViewer images={images} name={name} featured={materialView?.view ?? null} />;
}
