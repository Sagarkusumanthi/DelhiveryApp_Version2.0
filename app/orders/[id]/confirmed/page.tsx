"use client";
import { useParams, useRouter } from "next/navigation";
import { CustomerHeader } from "@/components/CustomerHeader";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function OrderConfirmedPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  return (
    <div>
      <CustomerHeader />
      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
        <CheckCircle2 className="mb-4 text-emerald-500" size={56} />
        <h1 className="font-serif text-2xl font-semibold text-ink">Order placed!</h1>
        <p className="mt-2 text-sm text-muted">
          The store has been notified and will confirm your order shortly.
        </p>
        <div className="mt-6 flex w-full gap-3">
          <Button variant="outline" className="flex-1" onClick={() => router.push("/")}>
            Back home
          </Button>
          <Button className="flex-1" onClick={() => router.push(`/orders/${id}/track`)}>
            Track order →
          </Button>
        </div>
      </main>
    </div>
  );
}
