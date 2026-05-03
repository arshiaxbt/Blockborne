"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const PrivyProviderInner = dynamic(
  () =>
    import("@/components/PrivyProviderInner").then(
      (module) => module.PrivyProviderInner,
    ),
  {
    ssr: false,
  },
);

export function PrivyProviderWrapper({ children }: { children: ReactNode }) {
  return <PrivyProviderInner>{children}</PrivyProviderInner>;
}
