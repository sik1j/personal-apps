import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createFileRoute } from "@tanstack/react-router";
import { formatTimeHHMM, formatTimeMMSS } from "./-utils";
import { Badge } from "@/components/ui/badge";
import { useHistoryStore, type Session } from "./-store";

export const Route = createFileRoute("/focus/history")({
  component: RouteComponent,
});

function RouteComponent() {
  const history = useHistoryStore((state) => state.history);

  // Sort history to show the most recent sessions first
  const sortedHistory = [...history].sort(
    (a, b) => b.endTimeMillis - a.endTimeMillis,
  );

  // Group by date
  const groupedHistory = sortedHistory.reduce(
    (acc, item) => {
      const date = new Date(item.endTimeMillis).toLocaleDateString(undefined, {
        dateStyle: "medium",
      });

      if (!acc[date]) {
        acc[date] = [];
      }

      acc[date].push(item);
      return acc;
    },
    {} as Record<string, Session[]>,
  );

  return (
    <div className="mx-auto max-w-2xl p-6 pt-6">
      <h1 className="mb-8 text-center text-3xl font-bold tracking-tight">
        Session History
      </h1>
      {sortedHistory.length === 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Tag</TableHead>
              <TableHead className="text-right">Time Focused</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={3}
                className="h-24 text-center text-muted-foreground"
              >
                No history found. Start a focus session!
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedHistory).map(([date, items]) => (
            <div key={date}>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-xl font-semibold tracking-tight">{date}</h2>
                <p className="text-sm font-medium text-muted-foreground">
                  {formatTimeHHMM(
                    items.reduce((acc, item) => acc + item.focusedSeconds, 0),
                  )}
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Tag</TableHead>
                    <TableHead className="text-right">Time Focused</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.endTimeMillis}>
                      <TableCell className="font-medium">
                        {new Date(item.endTimeMillis).toLocaleTimeString(
                          undefined,
                          {
                            timeStyle: "short",
                          },
                        )}
                      </TableCell>
                      <TableCell>
                        {item.tag ? (
                          <Badge variant="secondary">{item.tag}</Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground"
                          >
                            Untagged
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatTimeMMSS(item.focusedSeconds)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
