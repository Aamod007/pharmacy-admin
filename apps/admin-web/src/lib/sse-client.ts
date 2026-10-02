import { useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore } from "../store/authStore";

export function useStoreEvents() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem("admin_token");
    if (!token) return;

    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL || "/api/v1"}/events`
    );

    eventSource.addEventListener("order.created", (e: any) => {
      try {
        const data = JSON.parse(e.data);
        toast.success("New Order Placed!", {
          description: `Order #${data.referenceNumber || ""} received (${data.customerName || "Customer"})`,
        });
      } catch (err) {
        console.error(err);
      }
    });

    eventSource.addEventListener("stock.low", (e: any) => {
      try {
        const data = JSON.parse(e.data);
        toast.warning("Low Stock Warning", {
          description: `Item SKU ${data.referenceNumber} has fallen below threshold`,
        });
      } catch (err) {
        console.error(err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [isAuthenticated]);
}
