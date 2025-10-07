/**
 * 立替金残高表示カード
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDownRight, ArrowUpRight, DollarSign } from "lucide-react";

interface AdvanceBalanceCardProps {
  totalAdvanced: number;
  totalRecovered: number;
  remaining: number;
  className?: string;
}

export function AdvanceBalanceCard({
  totalAdvanced,
  totalRecovered,
  remaining,
  className,
}: AdvanceBalanceCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">立替金残高</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-2xl font-bold">¥{remaining.toLocaleString()}</div>
        {remaining > 0 && (
          <Badge
            variant="outline"
            className="text-orange-600 border-orange-600"
          >
            未回収
          </Badge>
        )}
        {remaining === 0 && totalAdvanced > 0 && (
          <Badge variant="outline" className="text-green-600 border-green-600">
            回収済み
          </Badge>
        )}
        {remaining === 0 && totalAdvanced === 0 && (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            立替なし
          </Badge>
        )}

        <div className="space-y-2 text-sm text-gray-600 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-red-500" />
              <span>立替済み</span>
            </div>
            <span className="font-medium">
              ¥{totalAdvanced.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3 text-green-500" />
              <span>回収済み</span>
            </div>
            <span className="font-medium">
              ¥{totalRecovered.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
