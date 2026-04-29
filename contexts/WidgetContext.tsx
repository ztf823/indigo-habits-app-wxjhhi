import * as React from "react";
import { createContext, useCallback, useContext } from "react";

type WidgetContextType = {
  refreshWidget: () => void;
};

const WidgetContext = createContext<WidgetContextType | null>(null);

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    try {
      const { ExtensionStorage } = require("@bacons/apple-targets");
      ExtensionStorage.reloadWidget();
    } catch (e) {
      // Widget extension not available in this build — safe to ignore
    }
  }, []);

  const refreshWidget = useCallback(() => {
    try {
      const { ExtensionStorage } = require("@bacons/apple-targets");
      ExtensionStorage.reloadWidget();
    } catch (e) {
      // Widget extension not available — safe to ignore
    }
  }, []);

  return (
    <WidgetContext.Provider value={{ refreshWidget }}>
      {children}
    </WidgetContext.Provider>
  );
}

export const useWidget = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error("useWidget must be used within a WidgetProvider");
  }
  return context;
};
