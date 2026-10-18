import { cn } from "@/lib/utils";
import Loading from "@/components/Loading";

function Spinner({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("inline-flex items-center justify-center shrink-0", className)}
      {...props}
    >
      <Loading size="xs" />
    </div>
  );
}

export { Spinner };
