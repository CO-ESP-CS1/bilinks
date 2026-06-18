"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      containerStyle={{ zIndex: 100001 }}
      toastOptions={{
        duration: 3500,
        className: "dark:bg-gray-800 dark:text-white",
        style: {
          borderRadius: "12px",
        },
        success: {
          iconTheme: { primary: "#12b76a", secondary: "#fff" },
        },
        error: {
          iconTheme: { primary: "#f04438", secondary: "#fff" },
        },
      }}
    />
  );
}
