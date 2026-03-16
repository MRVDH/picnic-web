"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface CategoryTreeState {
  focusedCategoryId: string | null;
  setFocusedCategoryId: (id: string) => void;
}

const CategoryTreeContext = createContext<CategoryTreeState>({
  focusedCategoryId: null,
  setFocusedCategoryId: () => {},
});

export function useCategoryTreeState() {
  return useContext(CategoryTreeContext);
}

export function CategoryTreeProvider({ defaultCategoryId, children }: { defaultCategoryId?: string; children: React.ReactNode }) {
  const [focusedCategoryId, setFocusedCategoryId] = useState<string | null>(defaultCategoryId || null);

  const setFocused = useCallback((id: string) => {
    setFocusedCategoryId(id);
  }, []);

  return (
    <CategoryTreeContext.Provider value={{ focusedCategoryId, setFocusedCategoryId: setFocused }}>
      {children}
    </CategoryTreeContext.Provider>
  );
}
