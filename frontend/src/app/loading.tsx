import { LoadingState } from "@/components/ui/LoadingState";

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <LoadingState message="Initializing CodeVista Runtime..." />
    </div>
  );
}
