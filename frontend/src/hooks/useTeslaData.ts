import { useContext } from "react";
import TeslaDataContext, { TeslaDataContextType } from "@/contexts/TeslaDataContext";

export function useTeslaData(): TeslaDataContextType {
  const context = useContext(TeslaDataContext);
  if (context === undefined) {
    throw new Error("useTeslaData must be used within a TeslaDataProvider");
  }
  return context;
}

export default useTeslaData;
