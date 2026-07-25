import { Card } from "@/components/ui/card";
import type { LearningModule, UserModule } from "@/lib/types";

export function SubscriptionSummary({
  items,
}: {
  items: { module: LearningModule; userModule: UserModule }[];
}) {
  const total = items.reduce((sum, i) => sum + i.module.monthly_price, 0);
  const nextRenewal = items
    .map((i) => i.userModule.expiration_date)
    .filter((d): d is string => !!d)
    .sort()[0];
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Active modules</span>
        <span className="text-sm font-medium">{items.length}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Monthly total</span>
        <span className="text-lg font-semibold">${total}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Next renewal</span>
        <span className="text-sm font-medium">
          {nextRenewal
            ? new Date(nextRenewal).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—"}
        </span>
      </div>
    </Card>
  );
}