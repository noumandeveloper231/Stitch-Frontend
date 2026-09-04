import React from "react";
import { cn } from "@/lib/utils";

const Spinner = ({ className, containerClassName }) => {
  return (
    <div className={cn("flex justify-center items-center py-6", containerClassName)}>
      <div
        className={cn(
          "w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin",
          className
        )}
      ></div>
    </div>
  );
};

export default Spinner;
