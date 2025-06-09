/* eslint-env browser */
import { useEffect } from "react";

export const useErrorTracking = () => {
  useEffect(() => {
    const handleError = (event) => {
      const { error } = event;
      if (error.message.includes("mapbox")) {
        console.error("[Map Error]:", error);
        // You can add custom error reporting here
      }
    };

    const handleUnhandledRejection = (event) => {
      const { reason } = event;
      if (reason.message?.includes("mapbox")) {
        console.error("[Map Promise Error]:", reason);
        // You can add custom error reporting here
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);
};
