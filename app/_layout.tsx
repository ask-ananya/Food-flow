import "@/global.css";
import { PortalHost } from "@rn-primitives/portal";

import { Slot } from "expo-router";

export default function Layout() {
  return (
    <>
      <Slot />
      {/* Default Portal Host (one per app) */}
      <PortalHost />
    </>
  );
}
