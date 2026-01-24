"use client";

import * as React from "react";
import { GripVerticalIcon } from "lucide-react";
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels";

import { cn } from "./utils";

/* ----------------------------------
   ResizablePanelGroup
----------------------------------- */

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof PanelGroup>) {
  return (
    <PanelGroup
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        className
      )}
      {...props}
    />
  );
}

/* ----------------------------------
   ResizablePanel
----------------------------------- */

function ResizablePanel(
  props: React.ComponentProps<typeof Panel>
) {
  return <Panel data-slot="resizable-panel" {...props} />;
}

/* ----------------------------------
   ResizableHandle
----------------------------------- */

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof PanelResizeHandle> & {
  withHandle?: boolean;
}) {
  return (
    <PanelResizeHandle
      data-slot="resizable-handle"
      className={cn(
        "bg-border focus-visible:ring-ring relative flex w-px items-center justify-center focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-sm border">
          <GripVerticalIcon className="size-2.5" />
        </div>
      )}
    </PanelResizeHandle>
  );
}

export {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
};
